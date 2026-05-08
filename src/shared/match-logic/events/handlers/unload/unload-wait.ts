import { arrayAtOrThrow } from "shared/array-utilities";
import { DispatchableError } from "shared/dispatchable-error";
import { UnloadPositionError } from "shared/match-logic/logic-errors";
import type { UnloadWaitAction } from "shared/schemas/action";
import type { Position } from "shared/schemas/position";
import type { UnloadWaitEvent } from "shared/types/events";
import { throwIfUndefined } from "shared/types/throw-helper";
import type { MutableMatch } from "shared/wrappers/match/mutable-match";
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

  const transportUnit = match.getUnit(fromPosition);
  player.ownsOrThrow(transportUnit);

  if (action.unloads.length === 0) {
    throw new DispatchableError("No unit specified to unload");
  }

  if (!transportUnit.isTransport()) {
    throw new DispatchableError("Trying to unload from a unit that can't load units");
  }

  throwIfUndefined(transportUnit.data.loadedUnit, "Transport doesn't currently have a loaded unit");
  const unloadPosition = fromPosition.addDirection(arrayAtOrThrow(action.unloads, 0).direction);
  match.map.throwIfOutOfBounds(unloadPosition);
  const modifiedUnloads = [...action.unloads];

  if (action.unloads.length === 1) {
    if (arrayAtOrThrow(action.unloads, 0).isSecondUnit) {
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

    if (transportUnit.data.loadedUnit2 === undefined) {
      throw new DispatchableError("Transport doesn't currently have a 2nd loaded unit");
    }

    if (
      arrayAtOrThrow(action.unloads, 0).direction === arrayAtOrThrow(action.unloads, 1).direction
    ) {
      throw new DispatchableError("Trying to unload both units in the same direction");
    }

    if (
      arrayAtOrThrow(action.unloads, 0).isSecondUnit ===
      arrayAtOrThrow(action.unloads, 1).isSecondUnit
    ) {
      throw new DispatchableError("Trying to unload the same unit twice");
    }

    if (arrayAtOrThrow(action.unloads, 0).isSecondUnit) {
      modifiedUnloads[0] = arrayAtOrThrow(action.unloads, 1);
      modifiedUnloads[1] = arrayAtOrThrow(action.unloads, 0);
    }

    const unloadPosition2 = fromPosition.addDirection(arrayAtOrThrow(modifiedUnloads, 1).direction);

    match.map.throwIfOutOfBounds(unloadPosition2);

    if (!transportUnit.getLoadedUnit(1).canMoveTo(unloadPosition)) {
      throw new UnloadPositionError();
    }
  } else {
    throw new DispatchableError("Trying to unload more than 2 units");
  }

  return {
    ...action,
    unloads: modifiedUnloads,
  };
};

export const applyUnloadWaitEvent = (
  match: MutableMatch,
  event: UnloadWaitEvent,
  transportPosition: Position,
): void => {
  const unit = match.getUnit(transportPosition);

  if (event.unloads.length === 1) {
    if (arrayAtOrThrow(event.unloads, 0).isSecondUnit && "loadedUnit2" in unit.data) {
      unit.player.addUnwrappedUnit({
        ...throwIfUndefined(unit.data.loadedUnit2),
        isReady: false,
        position: transportPosition.addDirection(arrayAtOrThrow(event.unloads, 1).direction),
      });

      unit.data.loadedUnit2 = undefined;
    } else if (!arrayAtOrThrow(event.unloads, 0).isSecondUnit && unit.isTransport()) {
      unit.player.addUnwrappedUnit({
        ...throwIfUndefined(unit.data.loadedUnit),
        isReady: false,
        position: transportPosition.addDirection(arrayAtOrThrow(event.unloads, 0).direction),
      });

      if ("loadedUnit2" in unit.data) {
        unit.data.loadedUnit = unit.data.loadedUnit2;
        unit.data.loadedUnit2 = undefined;
      } else {
        unit.data.loadedUnit = undefined;
      }
    }
  }

  //unload all. unloads[0] refers to 1st unit, unloads[1] refers to 2nd unit
  if (event.unloads.length === 2 && "loadedUnit" in unit.data && "loadedUnit2" in unit.data) {
    const loadedUnit = throwIfUndefined(unit.data.loadedUnit);
    const loadedUnit2 = throwIfUndefined(unit.data.loadedUnit2);

    unit.player.addUnwrappedUnit({
      ...loadedUnit,
      isReady: false,
      position: transportPosition.addDirection(arrayAtOrThrow(event.unloads, 0).direction),
    });

    unit.player.addUnwrappedUnit({
      ...loadedUnit2,
      isReady: false,
      position: transportPosition.addDirection(arrayAtOrThrow(event.unloads, 1).direction),
    });

    unit.data.loadedUnit = undefined;
    unit.data.loadedUnit2 = undefined;
  }
};
