import { DispatchableError } from "shared/DispatchedError";
import { UnloadPositionError } from "shared/match-logic/logic-errors";
import type { UnloadNoWaitAction } from "shared/schemas/action";
import type { UnloadNoWaitEvent } from "shared/types/events";
import type { MatchWrapper } from "shared/wrappers/match";
import type { MainActionToEvent } from "../../handler-types";

export const unloadNoWaitActionToEvent: MainActionToEvent<UnloadNoWaitAction> = (match, action) => {
  const player = match.getCurrentTurnPlayer();

  if (player.getVersionProperties().unloadOnlyAfterMove) {
    throw new DispatchableError("This type of unload is illegal in this version/setting");
  }

  const transportUnit = match.getUnitOrThrow(action.transportPosition);
  player.ownsOrThrow(transportUnit);

  if (!transportUnit.isTransport()) {
    throw new DispatchableError("Trying to unload from a unit that can't load units");
  }

  const unloadPosition = action.transportPosition.addDirection(action.unloads.direction);

  match.map.throwIfOutOfBounds(unloadPosition);

  if (!transportUnit.getLoadedUnit(action.unloads.slot).canMoveTo(unloadPosition)) {
    throw new UnloadPositionError();
  }

  return action;
};

export const applyUnloadNoWaitEvent = (match: MatchWrapper, event: UnloadNoWaitEvent): void => {
  const unit = match.getUnitOrThrow(event.transportPosition);

  if (!unit.isTransport()) {
    throw new DispatchableError("Trying to apply unload event to a unit that isn't a transport");
  }

  unit.unload({ slot: event.unloads.slot, direction: event.unloads.direction });
};
