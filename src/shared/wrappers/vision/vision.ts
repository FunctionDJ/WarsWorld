import { Position } from "shared/schemas/position";
import { throwIfUndefined } from "shared/types/throw-helper";
import type { Team } from "../team/team";
import { buildVisionArray } from "./vision-builder";

/**
 * Only used for when fog of war!
 */
export class Vision {
  protected visionArray: Uint16Array; // i put 16 cause 2^8 = 256 and we *could* go over 256, in theory
  protected mapWidth: number;

  // TODO does a set make sense here? maybe we need a more sophisticated data structure to deduplicate positions.
  protected ownedProperties: Set<Position>;

  // used for temporary information storage. does not guarantee that a position is not in both at the same time
  // (but making discovered have priority over undiscovered works for all current events)
  protected discoveredPositions: Position[];
  protected undiscoveredPositions: Position[];

  constructor(team: Team) {
    const { map } = team.match;
    this.mapWidth = map.width;
    const visionArraySize = this.mapWidth * map.height;

    const visionBuilder = buildVisionArray(visionArraySize, this.mapWidth);

    this.ownedProperties = new Set<Position>();

    // add property and pipeSeam vision
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const position = new Position([x, y]);
        const tile = team.match.getTile(position);

        if (
          ("playerSlot" in tile &&
            team.match.getPlayerBySlot(tile.playerSlot).team.index === team.index) ||
          tile.type === "pipeSeam"
        ) {
          visionBuilder.addOwnedProperty(position);
        }
      }
    }

    // add unit vision
    for (const unit of team.getUnits()) {
      visionBuilder.addUnitVision(unit);
    }

    this.visionArray = visionBuilder.visionArray;
    this.discoveredPositions = visionBuilder.discoveredPositions;
    this.undiscoveredPositions = visionBuilder.undiscoveredPositions;
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
    const result = this.visionArray[position.data[1] * this.mapWidth + position.data[0]];
    return throwIfUndefined(result, `Position ${position.data.toString()} is out of bounds`) > 0;
  }
}
