import { DispatchableError } from "shared/dispatchable-error";
import { getVisualHPfromHP } from "shared/match-logic/calculate-damage";
import type { RepairAction } from "shared/schemas/action";
import type { Position } from "shared/schemas/position";
import type { RepairEvent } from "shared/types/events";
import type { MatchWrapper } from "shared/wrappers/match/match";
import type { SubActionToEvent } from "../handler-types";

export const repairActionToEvent: SubActionToEvent<RepairAction> = (
  match,
  action,
  fromPosition,
) => {
  const player = match.getCurrentTurnPlayer();
  const unit = match.getUnitOrThrow(fromPosition);
  player.ownsOrThrow(unit);

  // TESTED: if trying to repair but no funds, unit will get resupplied but not repaired

  if (unit.data.type !== "blackBoat") {
    throw new DispatchableError("Trying to repair with a unit that is not a black boat");
  }

  const repairPosition = fromPosition.addDirection(action.direction);
  match.map.throwIfOutOfBounds(repairPosition);

  const repairedUnit = match.getUnitOrThrow(repairPosition);

  if (!player.owns(repairedUnit)) {
    throw new DispatchableError("You don't own the repaired unit");
  }

  return action;
};

export const applyRepairEvent = (
  match: MatchWrapper,
  event: RepairEvent,
  fromPosition: Position,
): void => {
  const player = match.getCurrentTurnPlayer();

  const repairedUnit = match.getUnitOrThrow(fromPosition.addDirection(event.direction));

  repairedUnit.resupply();

  //heal for free if visual hp is 10
  if (getVisualHPfromHP(repairedUnit.getHP()) === 10) {
    repairedUnit.heal(0);
  } else {
    //check if enough funds for heal, and heal if it's the case
    const repairCost = repairedUnit.getBuildCost() / 10;

    if (repairCost <= player.data.funds) {
      repairedUnit.heal(1);
      player.data.funds -= repairCost;
    }
  }
};
