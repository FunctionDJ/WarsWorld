import { DispatchableError } from "shared/errors";
import type { MatchWrapper } from "shared/wrappers/match";
import type { MainEventsWithoutSubEvents, MoveEventWithSubEvent } from "../../events";
import { applyAttackEvent } from "./handlers/attack/apply-attack-event";
import { applyBuildEvent } from "./handlers/build";
import { applyCOPowerEvent } from "./handlers/co-power";
import { applyDeleteEvent } from "./handlers/delete";
import { applyAbilityEvent } from "./handlers/move/ability";
import { applyLaunchMissileEvent } from "./handlers/move/launch-missile";
import { applyMoveEvent } from "./handlers/move/move";
import { applyRepairEvent } from "./handlers/move/repair";
import { applyPassTurnEvent } from "./handlers/pass-turn";
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
    // [correctness]: Starting a match breaks the app because it can't apply "matchStart" event.
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
