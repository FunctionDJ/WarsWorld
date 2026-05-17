import type { Position } from "shared/schemas/position";
import type { Unit } from "shared/wrappers/unit";

export const getUnloadablePositions = (
	transportUnit: Unit,
	unitToUnload: Unit,
	newTransportUnitLocation?: Position,
): readonly Position[] => {
	const transportPosition = newTransportUnitLocation ?? transportUnit.data.position;

	return transportPosition.getNeighbours().filter((neighbourPosition) => {
		if (transportUnit.player.match.map.isOutOfBounds(neighbourPosition)) {
			return false;
		}

		// canMoveTo also checks if unit can move to transportPosition
		// (AW logic: lander can only unload unit on harbor, not see next to plains)
		return unitToUnload.canMoveTo(neighbourPosition);
	});
};
