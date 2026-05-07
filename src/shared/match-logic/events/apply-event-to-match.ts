import { DispatchableError } from "shared/dispatchable-error";
import type { MatchWrapper } from "shared/wrappers/match/match";
import type { MainEventsWithoutSubEvents, MoveEventWithSubEvent } from "../../types/events";
import { applyAbilityEvent } from "./handlers/ability";
import { applyAttackEvent } from "./handlers/attack/apply-attack-event";
import { applyBuildEvent } from "./handlers/build";
import { applyCOPowerEvent } from "./handlers/co-power";
import { applyDeleteEvent } from "./handlers/delete";
import { applyLaunchMissileEvent } from "./handlers/launch-missile";
import { applyMoveEvent } from "./handlers/move";
import { applyPassTurnEvent } from "./handlers/pass-turn";
import { applyRepairEvent } from "./handlers/repair";
import { applyUnloadNoWaitEvent } from "./handlers/unload/unload-no-wait";
import { applyUnloadWaitEvent } from "./handlers/unload/unload-wait";

export const applyMainEventToMatch = (
  match: MatchWrapper,
  event: MainEventsWithoutSubEvents,
): void => {
  switch (event.type) {
    case "build": {
      applyBuildEvent(match, event);
      break;
    }
    case "delete": {
      applyDeleteEvent(match, event);
      break;
    }
    case "move": {
      applyMoveEvent(match, event);
      break;
    }
    case "unloadNoWait": {
      applyUnloadNoWaitEvent(match, event);
      break;
    }
    case "coPower": {
      applyCOPowerEvent(match, event);
      break;
    }
    case "passTurn": {
      applyPassTurnEvent(match, event);
      break;
    }
    //TODO: Starting a match breaks the app because it can't apply "matchStart" event.
    // Does MatchStart really need an event here? Because this is what fixes it
    case "matchStart": {
      break;
    }
    default: {
      throw new DispatchableError(`Can't apply main event type ${event.type}`);
    }
  }
};

export const applySubEventToMatch = (
  match: MatchWrapper,
  { subEvent, path }: MoveEventWithSubEvent,
): void => {
  const fromPosition = path.at("last");

  switch (subEvent.type) {
    case "wait": {
      break;
    }
    case "attack": {
      applyAttackEvent(match, subEvent, fromPosition);
      break;
    }
    case "ability": {
      applyAbilityEvent(match, subEvent, fromPosition);
      break;
    }
    case "unloadWait": {
      applyUnloadWaitEvent(match, subEvent, fromPosition);
      break;
    }
    case "repair": {
      applyRepairEvent(match, subEvent, fromPosition);
      break;
    }
    case "launchMissile": {
      applyLaunchMissileEvent(match, subEvent, fromPosition);
      break;
    }
  }
};
