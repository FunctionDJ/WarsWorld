import { arrayAtOrThrow } from "shared/array-utilities";
import { IllegalActionError, InvalidStateError } from "shared/errors";
import type { UnloadWaitEvent } from "shared/events";
import { UnloadPositionError } from "shared/match-logic/logic-errors";
import type { UnloadWaitAction } from "shared/schemas/action";
import type { Position } from "shared/schemas/position";
import { throwIfUndefined } from "shared/throw-helper";
import type { MatchWrapper } from "shared/wrappers/match";
import type { SubActionToEvent } from "../../handler-types";

export const unloadWaitActionToEvent: SubActionToEvent<UnloadWaitAction> = (
  match,
  action,
  fromPosition,
) => {
  const player = match.getCurrentTurnPlayer();

  if (!player.getVersionProperties().unloadOnlyAfterMove) {
    throw new IllegalActionError("This type of unload is illegal in this version/setting");
  }

  const transportUnit = match.getUnit(fromPosition);
  player.ownsOrThrow(transportUnit);

  if (action.unloads.length === 0) {
    throw new IllegalActionError("No unit specified to unload");
  }

  if (!("loadedUnits" in transportUnit.data)) {
    throw new IllegalActionError("Trying to unload from a unit that can't load units");
  }

  if (transportUnit.data.loadedUnits.every((u) => u === undefined)) {
    throw new IllegalActionError("Transport has no loaded units");
  }

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
      throw new IllegalActionError(
        "Tried to unload 2 units, but only one can be put in a transport",
      );
    }

    if (transportUnit.data.loadedUnit2 === undefined) {
      throw new IllegalActionError("Transport doesn't currently have a 2nd loaded unit");
    }

    if (
      arrayAtOrThrow(action.unloads, 0).direction === arrayAtOrThrow(action.unloads, 1).direction
    ) {
      throw new IllegalActionError("Trying to unload both units in the same direction");
    }

    if (
      arrayAtOrThrow(action.unloads, 0).isSecondUnit ===
      arrayAtOrThrow(action.unloads, 1).isSecondUnit
    ) {
      throw new IllegalActionError("Trying to unload the same unit twice");
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
    throw new IllegalActionError("Trying to unload more than 2 units");
  }

  return {
    ...action,
    unloads: modifiedUnloads,
  };
};

export const applyUnloadWaitEvent = (
  match: MatchWrapper,
  event: UnloadWaitEvent,
  transportPosition: Position,
): void => {
  const unit = match.getUnit(transportPosition);

  if (!("loadedUnits" in unit.data)) {
    throw new InvalidStateError("Unit is not transport");
  }

  if (event.unloads.length === 1) {
    if (arrayAtOrThrow(event.unloads, 0).isSecondUnit && unit.data.loadedUnits.length === 2) {
      unit.player.addUnwrappedUnit({
        ...throwIfUndefined(unit.data.loadedUnits[1]),
        position: transportPosition.addDirection(arrayAtOrThrow(event.unloads, 1).direction),
      });

      unit.data.loadedUnits[1] = undefined;
    } else if (!arrayAtOrThrow(event.unloads, 0).isSecondUnit && unit.isTransport()) {
      unit.player.addUnwrappedUnit({
        ...throwIfUndefined(unit.data.loadedUnits[0]),
        position: transportPosition.addDirection(arrayAtOrThrow(event.unloads, 0).direction),
      });

      if (unit.data.loadedUnits.length === 2) {
        // destructuring here would cause big type issues (complicated), the line rule can't know
        // eslint-disable-next-line @typescript-eslint/prefer-destructuring
        unit.data.loadedUnits[0] = unit.data.loadedUnits[1];
        unit.data.loadedUnits[1] = undefined;
      } else {
        unit.data.loadedUnits[0] = undefined;
      }
    }
  }

  //unload all. unloads[0] refers to 1st unit, unloads[1] refers to 2nd unit
  if (event.unloads.length === 2 && unit.data.loadedUnits.length === 2) {
    unit.player.addUnwrappedUnit({
      ...throwIfUndefined(unit.data.loadedUnits[0]),
      position: transportPosition.addDirection(arrayAtOrThrow(event.unloads, 0).direction),
    });

    unit.player.addUnwrappedUnit({
      ...throwIfUndefined(unit.data.loadedUnits[1]),
      position: transportPosition.addDirection(arrayAtOrThrow(event.unloads, 1).direction),
    });

    unit.data.loadedUnits = [undefined, undefined];
  }
};
