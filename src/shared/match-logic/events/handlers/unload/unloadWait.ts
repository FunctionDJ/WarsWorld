import { arr } from "shared/arr";
import { DispatchableError } from "shared/DispatchedError";
import { UnloadPositionError } from "shared/match-logic/logic-errors";
import type { UnloadWaitAction } from "shared/schemas/action";
import type { Position } from "shared/schemas/position";
import type { UnloadWaitEvent } from "shared/types/events";
import type { MatchWrapper } from "shared/wrappers/match";
import type { SubActionToEvent } from "../../handler-types";

export const unloadWaitActionToEvent: SubActionToEvent<UnloadWaitAction> = (
  match,
  action,
  fromPosition,
) => {
  const player = match.getCurrentTurnPlayer();

  if (!player.getVersionProperties().unloadOnlyAfterMove) {
    throw new DispatchableError("This type of unload is illegal in this version/setting");
  }

  const transportUnit = match.getUnitOrThrow(fromPosition);
  player.ownsOrThrow(transportUnit);

  if (action.unloads.length < 1) {
    throw new DispatchableError("No unit specified to unload");
  }

  if (!transportUnit.isTransport()) {
    throw new DispatchableError("Trying to unload from a unit that can't load units");
  }

  if (transportUnit.data.loadedUnit === null) {
    throw new DispatchableError("Transport doesn't currently have a loaded unit");
  }

  const unloadPosition = fromPosition.addDirection(arr(action.unloads, 0).direction);

  match.map.throwIfOutOfBounds(unloadPosition);

  if (action.unloads.length === 1) {
    if (arr(action.unloads, 0).isSecondUnit) {
      if (!transportUnit.getLoadedUnit(2).canMoveTo(unloadPosition)) {
        throw new UnloadPositionError();
      }
    } else {
      if (!transportUnit.getLoadedUnit(1).canMoveTo(unloadPosition)) {
        throw new UnloadPositionError();
      }
    }
  } else if (action.unloads.length === 2) {
    if (!("loadedUnit2" in transportUnit.data)) {
      throw new DispatchableError(
        "Tried to unload 2 units, but only one can be put in a transport",
      );
    }

    if (transportUnit.data.loadedUnit2 === null) {
      throw new DispatchableError("Transport doesn't currently have a 2nd loaded unit");
    }

    if (arr(action.unloads, 0).direction === arr(action.unloads, 1).direction) {
      throw new DispatchableError("Trying to unload both units in the same direction");
    }

    if (arr(action.unloads, 0).isSecondUnit === arr(action.unloads, 1).isSecondUnit) {
      throw new DispatchableError("Trying to unload the same unit twice");
    }

    if (arr(action.unloads, 0).isSecondUnit) {
      const temp = arr(action.unloads, 0);
      action.unloads[0] = arr(action.unloads, 1);
      action.unloads[1] = temp;
    }

    const unloadPosition2 = fromPosition.addDirection(arr(action.unloads, 1).direction);

    match.map.throwIfOutOfBounds(unloadPosition2);

    if (!transportUnit.getLoadedUnit(1).canMoveTo(unloadPosition)) {
      throw new UnloadPositionError();
    }
  } else {
    throw new DispatchableError("Trying to unload more than 2 units");
  }

  return action;
};

export const applyUnloadWaitEvent = (
  match: MatchWrapper,
  event: UnloadWaitEvent,
  transportPosition: Position,
): void => {
  const unit = match.getUnitOrThrow(transportPosition);

  if (event.unloads.length === 1) {
    if (arr(event.unloads, 0).isSecondUnit && "loadedUnit2" in unit.data) {
      if (unit.data.loadedUnit2 === null) {
        throw new Error("Can't unload from empty slot 2");
      }

      unit.player.addUnwrappedUnit({
        ...unit.data.loadedUnit2,
        isReady: false,
        position: transportPosition.addDirection(arr(event.unloads, 1).direction),
      });

      unit.data.loadedUnit2 = null;
    } else if (!arr(event.unloads, 0).isSecondUnit && unit.isTransport()) {
      if (unit.data.loadedUnit === null) {
        throw new Error("Can't unload from empty slot 1");
      }

      unit.player.addUnwrappedUnit({
        ...unit.data.loadedUnit,
        isReady: false,
        position: transportPosition.addDirection(arr(event.unloads, 0).direction),
      });

      if ("loadedUnit2" in unit.data) {
        unit.data.loadedUnit = unit.data.loadedUnit2;
        unit.data.loadedUnit2 = null;
      } else {
        unit.data.loadedUnit = null;
      }
    }
  }

  if (event.unloads.length === 2) {
    //unload all. unloads[0] refers to 1st unit, unloads[1] refers to 2nd unit
    if ("loadedUnit" in unit.data && "loadedUnit2" in unit.data) {
      if (unit.data.loadedUnit === null || unit.data.loadedUnit2 === null) {
        throw new Error("Tried to unload a unit from an empty loadedUnit slot");
      }

      unit.player.addUnwrappedUnit({
        ...unit.data.loadedUnit,
        isReady: false,
        position: transportPosition.addDirection(arr(event.unloads, 0).direction),
      });

      unit.player.addUnwrappedUnit({
        ...unit.data.loadedUnit2,
        isReady: false,
        position: transportPosition.addDirection(arr(event.unloads, 1).direction),
      });

      unit.data.loadedUnit = null;
      unit.data.loadedUnit2 = null;
    }
  }
};
