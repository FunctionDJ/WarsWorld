import type { MatchWrapper } from "shared/wrappers/match";
import type { DeleteEvent } from "../../../events";
import type { DeleteAction } from "../../../schemas/action";
import type { MainActionToEvent } from "../handler-types";

export const deleteActionToEvent: MainActionToEvent<DeleteAction> = (match, action) => {
	const player = match.getCurrentTurnPlayer();
	const deletedUnit = match.getUnit(action.position);
	player.ownsOrThrow(deletedUnit);

	return player.getUnits().length <= 1
		? {
				...action,
				eliminationReason: "all-units-destroyed",
			}
		: action;
};

export const applyDeleteEvent = (match: MatchWrapper, event: DeleteEvent): void => {
	match.getUnit(event.position).remove();
};
