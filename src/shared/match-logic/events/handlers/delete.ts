import { DispatchableError } from "../../../DispatchedError";
import type { DeleteAction } from "../../../schemas/action";
import type { DeleteEvent } from "../../../types/events";
import type { MatchWrapper } from "../../../wrappers/match";
import type { MainActionToEvent } from "../handler-types";

export const deleteActionToEvent: MainActionToEvent<DeleteAction> = (match, action) => {
  const player = match.getCurrentTurnPlayer();

  const deletedUnit = match.getUnit(action.position);

  if (deletedUnit === undefined) {
    throw new DispatchableError("No unit to delete was selected");
  }

  player.ownsOrThrow(deletedUnit);

  if (player.getUnits().length <= 1) {
    return {
      ...action,
      eliminationReason: "all-units-destroyed",
    };
  } else {
    return action;
  }
};

export const applyDeleteEvent = (match: MatchWrapper, event: DeleteEvent): void => {
  match.getUnitOrThrow(event.position).remove();
};
