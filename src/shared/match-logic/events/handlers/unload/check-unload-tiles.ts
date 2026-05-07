import type { Position } from "shared/schemas/position";
import type { Visibility } from "shared/schemas/unit";
import type { UnitWrapper } from "shared/wrappers/unit/unit";

export const getUnloadablePositions = <TVisibility extends Visibility = Visibility>(
  transportUnit: UnitWrapper<TVisibility>,
  unitToUnload: UnitWrapper<TVisibility>,
  newTransportUnitLocation?: Position,
): Position[] => {
  const transportPos = newTransportUnitLocation ?? transportUnit.data.position;

  //unit also has to be able to stand on the tile the transport is standing
  if (!unitToUnload.canMoveTo(transportPos)) {
    return [];
  }

  const unloadablePositions: Position[] = [];

  for (const adjPos of transportPos.getNeighbours()) {
    if (transportUnit.match.map.isOutOfBounds(adjPos)) {
      continue;
    }

    if (unitToUnload.canMoveTo(adjPos)) {
      unloadablePositions.push(adjPos);
    }
  }

  return unloadablePositions;
};
