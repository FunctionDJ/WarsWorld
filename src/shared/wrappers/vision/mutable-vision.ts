import type { Position } from "shared/schemas/position";
import type { MutableTeam } from "../team/mutable-team";
import type { UnitWrapper } from "../unit/unit";
import { getUnitVisionRange } from "./get-unit-vision-range";
import { Vision } from "./vision";
import { changeVision } from "./vision-builder";

export class MutableVision extends Vision {
  protected visionArray: Uint16Array; // i put 16 cause 2^8 = 256 and we *could* go over 256, in theory

  constructor(team: MutableTeam) {
    super(team);

    const { map } = team.match;
    const visionArraySize = this.mapWidth * map.height;
    this.visionArray = new Uint16Array(visionArraySize);
  }

  /**
   * Used when a non-owned property gets captured.
   */
  addOwnedProperty(position: Position): void {
    this.ownedProperties.add(position);
    // you will always have vision of a property you just captured cause a unit has to be on top
    changeVision(
      position,
      false,
      this.mapWidth,
      this.visionArray,
      this.discoveredPositions,
      this.undiscoveredPositions,
    );
  }

  /**
   * Used when an owned property gets captured.
   */
  removeOwnedProperty(position: Position): void {
    this.ownedProperties.delete(position);
    changeVision(
      position,
      false,
      this.mapWidth,
      this.visionArray,
      this.discoveredPositions,
      this.undiscoveredPositions,
    );
  }

  private changeUnitVision(unit: UnitWrapper, addVision: boolean): void {
    const visionRange = getUnitVisionRange(unit);
    const activeSonjaPower =
      unit.player.data.coId.name === "sonja" && unit.player.data.COPowerState !== "no-power";
    const matchMap = unit.match.map;

    for (let rowIndex = -visionRange; rowIndex <= visionRange; ++rowIndex) {
      for (
        let columnIndex = -(visionRange - Math.abs(rowIndex));
        columnIndex <= visionRange - Math.abs(rowIndex);
        ++columnIndex
      ) {
        const pos = unit.data.position.offset({ x: rowIndex, y: columnIndex });

        if (matchMap.isOutOfBounds(pos)) {
          continue;
        }

        // if not next to forest or reef and sonja power not active, skip

        if (
          (matchMap.getTile(pos).type === "forest" || matchMap.getTile(pos).type === "reef") &&
          !activeSonjaPower &&
          Math.abs(rowIndex) + Math.abs(columnIndex) > 1
        ) {
          continue;
        }

        changeVision(
          pos,
          addVision,
          this.mapWidth,
          this.visionArray,
          this.discoveredPositions,
          this.undiscoveredPositions,
        );
      }
    }
  }

  /**
   * Used for creating, unloading or moving units.
   */
  addUnitVision(unit: UnitWrapper): void {
    this.changeUnitVision(unit, true);
  }

  /**
   * Used for when a unit dies or a unit moves from a position.
   */
  removeUnitVision(unit: UnitWrapper): void {
    this.changeUnitVision(unit, false);
  }

  /**
   * Used for vision powers (and expiring powers) and rain activation / deactivation.
   * Does NOT update new discovered / undiscovered positions.
   */
  recalculateVision(units: readonly UnitWrapper[]): void {
    this.visionArray.fill(0);

    for (const property of this.ownedProperties.values()) {
      changeVision(
        property,
        true,
        this.mapWidth,
        this.visionArray,
        this.discoveredPositions,
        this.undiscoveredPositions,
      );
    }

    for (const unit of units) {
      this.addUnitVision(unit);
    }
  }
}
