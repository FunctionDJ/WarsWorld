import type { MutableMatch } from "shared/wrappers/match/mutable-match";
import type { DeleteAction } from "../../../schemas/action";
import type { DeleteEvent } from "../../../types/events";
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

export const applyDeleteEvent = (match: MutableMatch, event: DeleteEvent): void => {
  match.getUnit(event.position).remove();
};
