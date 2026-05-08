import type { Position } from "shared/schemas/position";
import { throwIfUndefined } from "shared/types/throw-helper";
import type { UnitWrapper } from "../unit/unit";
import { getUnitVisionRange } from "./get-unit-vision-range";

export const changeVision = (
  position: Position,
  addVision: boolean,
  mapWidth: number,
  visionArray: Uint16Array,
  discoveredPositions: Position[],
  undiscoveredPositions: Position[],
): void => {
  const index = position.data[1] * mapWidth + position.data[0];
  const currentVision = throwIfUndefined(visionArray[index], "Position is out of bounds");

  if (addVision) {
    visionArray[index] = currentVision + 1;

    if (visionArray[index] === 1) {
      discoveredPositions.push(position);
    }
  } else {
    visionArray[index] = currentVision - 1;

    if (visionArray[index] === 0) {
      undiscoveredPositions.push(position);
    }
  }
};

export const buildVisionArray = (
  visionArraySize: number,
  mapWidth: number,
): {
  visionArray: Uint16Array;
  addOwnedProperty: (position: Position) => void;
  addUnitVision: (unit: UnitWrapper) => void;
  discoveredPositions: Position[];
  undiscoveredPositions: Position[];
} => {
  const discoveredPositions: Position[] = [];
  const undiscoveredPositions: Position[] = [];
  const visionArray = new Uint16Array(visionArraySize);

  const changeUnitVision = (unit: UnitWrapper, addVision: boolean): void => {
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
          mapWidth,
          visionArray,
          discoveredPositions,
          undiscoveredPositions,
        );
      }
    }
  };

  return {
    addOwnedProperty: (position: Position): void => {
      // you will always have vision of a property you just captured cause a unit has to be on top
      changeVision(
        position,
        true,
        mapWidth,
        visionArray,
        discoveredPositions,
        undiscoveredPositions,
      );
    },
    addUnitVision: (unit: UnitWrapper): void => {
      changeUnitVision(unit, true);
    },
    visionArray,
    discoveredPositions,
    undiscoveredPositions,
  };
};
