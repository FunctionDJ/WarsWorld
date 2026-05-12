import { DispatchableError } from "shared/dispatchable-error";
import type { MoveAction } from "shared/schemas/action";
import { Path } from "shared/schemas/path";
import {
  carrierLoadedUnitSchema,
  cruiserLoadedUnitSchema,
  landerLoadedUnitSchema,
} from "shared/schemas/unit";
import type { MoveEventWithoutSubEvent, MoveEventWithSubEvent } from "shared/types/events";
import { throwIfUndefined } from "shared/types/throw-helper";
import type { RO } from "shared/types/ww-readonly";
import type { MatchWrapper } from "shared/wrappers/match/match";
import type { MutableMatch } from "shared/wrappers/match/mutable-match";
import type { UnitWrapper } from "../../../wrappers/unit/unit";
import { loadUnitInto } from "./move/load-unit-into";

// we don't use MainActionToEvent here because MoveEvent is special
// because at this point we don't have the subEvent yet
// which MainActionToEvent requires.
export const moveActionToEvent = (
  match: RO<MatchWrapper>,
  action: MoveAction,
): MoveEventWithoutSubEvent => {
  if (action.path.len() === 0) {
    throw new DispatchableError("Move action path must have at least one position");
  }

  const unitPosition = action.path.at(0);
  const path = action.path.tail();
  const player = match.getCurrentTurnPlayer();
  const unit = match.getUnit(unitPosition);
  player.ownsOrThrow(unit);

  console.log("Unit trying to move:", unit.data);

  if (!unit.data.isReady) {
    throw new DispatchableError("Trying to move a waited unit");
  }

  const result: MoveEventWithoutSubEvent = {
    type: "move",
    path: new Path([]),
    trap: false,
  };

  //Unit is waiting in-place if it's path is only the starting tile
  if (action.path.len() === 1) {
    return {
      ...result,
      path: new Path([unitPosition]),
    };
  }

  if (unit.getFuel() < path.len()) {
    // TODO isn't there AWDS weather or something that makes units burn >1 fuel per tile?
    throw new DispatchableError("Not enough fuel for this move");
  }

  for (let pathIndex = 0; pathIndex < action.path.len(); ++pathIndex) {
    const position = action.path.at(pathIndex);

    match.map.throwIfOutOfBounds(position);

    let moveCost = unit.getMovementCost(position);

    //It costs 0 points to move out of starting tile, our path[0] is the starting tile so we should not count it for movement
    if (pathIndex === 0) {
      moveCost = 0;
    }

    const definedMoveCost = throwIfUndefined(moveCost, "Can't move to a desired position");

    if (result.path.contains(position)) {
      throw new DispatchableError("The given path passes through the same position twice");
    }

    const unitInPosition = match.getUnit(position, "dont-throw");

    if (unitInPosition !== undefined && unitInPosition.data.playerSlot !== unit.data.playerSlot) {
      result.trap = true;
      break;
    }

    if (definedMoveCost > unit.getMovementPoints()) {
      throw new DispatchableError("Using more move points than available");
    }

    if (
      pathIndex === action.path.len() - 1 &&
      unitInPosition?.data.playerSlot === unit.data.playerSlot
    ) {
      throwIfCantMoveIntoUnit(unit, unitInPosition);

      if (unitInPosition.data.type === unit.data.type) {
        //join, calculate gained funds
        const newVisualHP = unit.getVisualHP() + unitInPosition.getVisualHP();

        if (newVisualHP > 10) {
          result.fundsGained = (unit.getBuildCost() / 10) * (newVisualHP - 10);
        }
      }
    }

    return {
      ...result,
      path: result.path.with(action.path.at(pathIndex)),
    };
  }

  return result;
};

export const throwIfCantMoveIntoUnit = (
  unit: RO<UnitWrapper>,
  unitInPosition: RO<UnitWrapper>,
): void => {
  if (unitInPosition.data.type === unit.data.type) {
    // trying to join (same unit type)
    // join logic: if neither unit has loaded units, and the unit at join destination is not 10 hp
    if (unitInPosition.getVisualHP() === 10) {
      throw new DispatchableError("Trying to join into a unit at full hp");
    }

    if ("loadedUnit" in unitInPosition.data && unitInPosition.data.loadedUnit !== undefined) {
      throw new DispatchableError("Trying to join into a unit that has a loaded unit");
    }

    if ("loadedUnit" in unit && unit.loadedUnit !== undefined) {
      throw new DispatchableError("Trying to join while having a unit loaded");
    }
  } else {
    // trying to load (different unit type)
    if (!("loadedUnit" in unitInPosition.data)) {
      throw new DispatchableError("Move action ending position is overlapping with an allied unit");
    }

    if (
      unitInPosition.data.loadedUnit !== undefined &&
      (!("loadedUnit2" in unitInPosition.data) || unitInPosition.data.loadedUnit2 !== undefined)
    ) {
      throw new DispatchableError("Transport already occupied");
    }

    //check if unit can go into that transport
    switch (unitInPosition.data.type) {
      case "transportCopter":
      case "apc":
      case "blackBoat": {
        // TODO
        /**
         * i bet there's a way to use some typescript magic
         * to get the [transport]LoadedUnitSchema based on the transport type and
         * short-cut this switch statement.
         */

        if (!unit.isInfantryOrMech()) {
          throw new DispatchableError("Can't load non-soldier in apc / transport / black boat");
        }

        break;
      }
      case "lander": {
        if (!landerLoadedUnitSchema.safeParse(unit.data).success) {
          throw new DispatchableError("Can't load non-land unit to lander");
        }

        break;
      }
      case "cruiser": {
        if (!cruiserLoadedUnitSchema.safeParse(unit.data).success) {
          throw new DispatchableError("Can't load non-copter in cruiser");
        }

        break;
      }
      case "carrier": {
        if (!carrierLoadedUnitSchema.safeParse(unit.data).success) {
          throw new DispatchableError("Can't load non-air unit to carrier");
        }

        break;
      }
    }
  }
};

const getOneTileFuelCost = (match: RO<MatchWrapper>, unit: RO<UnitWrapper>): number => {
  const gameVersion = match.rules.gameVersion ?? unit.player.data.coId.version;

  if (
    gameVersion === "AWDS" &&
    match.getCurrentWeather() === "snow" &&
    unit.player.data.coId.name !== "olaf"
  ) {
    return 2;
  }

  return 1;
};

export const applyMoveEvent = (match: MutableMatch, event: RO<MoveEventWithoutSubEvent>): void => {
  //check if unit is moving or just standing still
  if (event.path.len() <= 1) {
    return;
  }

  const unit = match.getUnit(event.path.at(0));

  unit.data.isReady = false;

  //if unit was capturing, interrupt capture
  if ("currentCapturePoints" in unit.data) {
    unit.data.currentCapturePoints = undefined;
  }

  unit.drainFuel((event.path.len() - 1) * getOneTileFuelCost(match, unit));
  const unitAtDestination = match.getUnit(event.path.at("last"), "dont-throw");

  if (unitAtDestination === undefined) {
    unit.data.position = event.path.at("last");
  } else {
    if (unit.data.type === unitAtDestination.data.type) {
      //join (hp, fuel, ammo, (keep capture points))
      unitAtDestination.setFuel(unit.getFuel() + unitAtDestination.getFuel());

      // yes, this "generates" hp, but it's how it works in game
      const newVisualHP = unit.getVisualHP() + unitAtDestination.getVisualHP();

      //gain funds
      if (event.fundsGained !== undefined) {
        unit.player.data.funds += event.fundsGained;
      }

      unitAtDestination.setHp(Math.min(newVisualHP, 10) * 10);

      const newAmmo = (unit.getAmmo() ?? 0) + (unitAtDestination.getAmmo() ?? 0);

      unitAtDestination.setAmmo(newAmmo);
    } else if (unit.data.stats !== "hidden" && unitAtDestination.data.stats !== "hidden") {
      loadUnitInto(unit.data, unitAtDestination.data);
    }

    unit.remove();
  }
};

/**
 * Call this AFTER creating the sub event but BEFORE applying it
 */
export const updateMoveVision = (match: MutableMatch, event: RO<MoveEventWithSubEvent>): void => {
  if (event.path.len() < 2) {
    // if didn't move no vision change
    return;
  }

  const movedUnit = match.getUnit(event.path.at("last"));

  movedUnit.data.position = event.path.at(0); // temporarily revert position
  movedUnit.player.team.vision?.removeUnitVision(movedUnit); // remove vision from previous position
  movedUnit.data.position = event.path.at("last"); // revert the reversion (xd)
  movedUnit.player.team.vision?.addUnitVision(movedUnit); // add vision from new position

  /*
  Small side note: attack event works fine with this if the attacker dies, since
  vision works by having how many units see a particular tile, and when a unit dies
  it subtracts one from that counter. so attack event subtracts from final position,
  and then move event adds back (so in the end the unit lost vision from previous
  position, but didn't gain vision from new position (- +)
   */
};
