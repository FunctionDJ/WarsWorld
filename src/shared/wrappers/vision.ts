import { unitPropertiesMap } from "shared/match-logic/game-constants/unit-properties";
import { Position } from "shared/schemas/position";
import type { TeamWrapper } from "./team";
import type { UnitWrapper } from "./unit";

const getUnitVisionRange = (unit: UnitWrapper): number => {
  const { vision: baseVision } = unitPropertiesMap[unit.data.type];

  const hasMountainBonus = unit.isInfantryOrMech() && unit.getTile().type === "mountain";
  const modifiedVision = unit.player.getHook("vision")?.(baseVision);
  const coVisionRange = (modifiedVision ?? baseVision) + (hasMountainBonus ? 3 : 0);

  const weatherVisionRange =
    unit.player.match.getCurrentWeather() === "rain" ? coVisionRange - 1 : coVisionRange;

  return Math.max(weatherVisionRange, 0);
};

/**
 * Only used for when fog of war!
 */
export class Vision {
  private visionArray: Uint16Array; // i put 16 cause 2^8 = 256 and we *could* go over 256, in theory
  private mapWidth: number;
  private ownedProperties: Set<Position>; // TODO does a set make sense here? maybe we need a more sophisticated data structure to deduplicate positions.

  // used for temporary information storage. does not guarantee that a position is not in both at the same time
  // (but making discovered have priority over undiscovered works for all current events)
  private discoveredPositions: Position[] = [];
  private undiscoveredPositions: Position[] = [];

  constructor(team: TeamWrapper) {
    const { map } = team.match;
    this.mapWidth = map.width;
    const visionArraySize = this.mapWidth * map.height;
    this.visionArray = new Uint16Array(visionArraySize);
    this.ownedProperties = new Set<Position>();

    // add property and pipeSeam vision
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const position = new Position([x, y]);
        const tile = team.match.getTile(position);

        if (
          ("playerSlot" in tile &&
            team.match.getPlayerBySlot(tile.playerSlot)?.team.index === team.index) ||
          tile.type === "pipeSeam"
        ) {
          this.addOwnedProperty(position);
        }
      }
    }

    // add unit vision
    for (const unit of team.getUnits()) {
      this.addUnitVision(unit);
    }
  }

  private changeVision(position: Position, addVision: boolean) {
    const index = position.data[1] * this.mapWidth + position.data[0];
    const currentVision = this.visionArray[index];

    if (currentVision === undefined) {
      throw new Error("Position for vision update is out of bounds");
    }

    if (addVision) {
      this.visionArray[index] = currentVision + 1;

      if (this.visionArray[index] === 1) {
        this.discoveredPositions.push(position);
      }
    } else {
      this.visionArray[index] = currentVision - 1;

      if (this.visionArray[index] === 0) {
        this.undiscoveredPositions.push(position);
      }
    }
  }

  /**
   * Used when a non-owned property gets captured.
   */
  addOwnedProperty(position: Position) {
    this.ownedProperties.add(position);
    // you will always have vision of a property you just captured cause a unit has to be on top
    this.changeVision(position, false);
  }

  /**
   * Used when an owned property gets captured.
   */
  removeOwnedProperty(position: Position) {
    this.ownedProperties.delete(position);
    this.changeVision(position, false);
  }

  private changeUnitVision(unit: UnitWrapper, addVision: boolean) {
    const visionRange = getUnitVisionRange(unit);
    const activeSonjaPower =
      unit.player.data.coId.name === "sonja" && unit.player.data.COPowerState !== "no-power";
    const matchMap = unit.match.map;

    for (let i = -visionRange; i <= visionRange; ++i) {
      for (let j = -(visionRange - Math.abs(i)); j <= visionRange - Math.abs(i); ++j) {
        const pos = unit.data.position.offset({ x: i, y: j });

        if (matchMap.isOutOfBounds(pos)) {
          continue;
        }

        // if not next to forest or reef and sonja power not active, skip

        if (
          (matchMap.getTile(pos).type === "forest" || matchMap.getTile(pos).type === "reef") &&
          !activeSonjaPower &&
          Math.abs(i) + Math.abs(j) > 1
        ) {
          continue;
        }

        this.changeVision(pos, addVision);
      }
    }
  }

  /**
   * Used for creating, unloading or moving units.
   */
  addUnitVision(unit: UnitWrapper) {
    this.changeUnitVision(unit, true);
  }

  /**
   * Used for when a unit dies or a unit moves from a position.
   */
  removeUnitVision(unit: UnitWrapper) {
    this.changeUnitVision(unit, false);
  }

  /**
   * Used for vision powers (and expiring powers) and rain activation / deactivation.
   * Does NOT update new discovered / undiscovered positions.
   */
  recalculateVision(units: UnitWrapper[]) {
    this.visionArray.fill(0);

    for (const property of this.ownedProperties.values()) {
      this.changeVision(property, true);
    }

    for (const unit of units) {
      this.addUnitVision(unit);
    }
  }

  /**
   * Returns new discovered positions until now, and resets the array.
   * Does NOT work when recalculateVision() is called!
   */
  getDiscoveredPositionsAndClear(): Position[] {
    const discoveredPositions = [...this.discoveredPositions];
    this.discoveredPositions = [];
    return discoveredPositions;
  }

  /**
   * Returns new undiscovered positions until now, and resets the array.
   * Does NOT work when recalculateVision() is called!
   */
  getUndiscoveredPositionsAndClear(): Position[] {
    const undiscoveredPositions = [...this.undiscoveredPositions];
    this.undiscoveredPositions = [];
    return undiscoveredPositions;
  }

  /**
   * Returns is a position is visible, !supposing fog of war is activated!
   */
  isPositionVisible(position: Position): boolean {
    const result: number | undefined =
      this.visionArray[position.data[1] * this.mapWidth + position.data[0]];

    if (result === undefined) {
      throw new Error("Position for visible check is out of bounds");
    }

    return result > 0;
  }
}
