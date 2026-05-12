import type { Position } from "shared/schemas/position";
import type { UnitTypeString, Visibility } from "shared/schemas/unit";
import type { UnitWrapper } from "shared/wrappers/unit/unit";

export const getUnloadablePositions = <TUnitType extends UnitTypeString>(
  transportUnit: UnitWrapper,
  unitToUnload: UnitWrapper<Visibility, TUnitType>,
  newTransportUnitLocation?: Position,
): readonly Position[] => {
  const transportPosition = newTransportUnitLocation ?? transportUnit.data.position;

  return transportPosition.getNeighbours().filter((neighbourPosition) => {
    if (transportUnit.match.map.isOutOfBounds(neighbourPosition)) {
      return false;
    }

    // canMoveTo also checks if unit can move to transportPosition
    // (AW logic: lander can only unload unit on harbor, not see next to plains)
    return unitToUnload.canMoveTo(neighbourPosition);
  });
};
