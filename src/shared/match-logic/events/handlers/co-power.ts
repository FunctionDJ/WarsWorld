import { DispatchableError } from "shared/errors";
import type { COPowerEvent } from "shared/events";
import type { COPowerAction } from "shared/schemas/action";
import { throwIfUndefined } from "shared/throw-helper";
import type { MatchWrapper } from "shared/wrappers/match";
import type { COProperties } from "../../co";
import { getCOProperties } from "../../co";
import type { MainActionToEvent } from "../handler-types";

export const coPowerActionToEvent: MainActionToEvent<COPowerAction> = (match, action) => {
  const player = match.getCurrentTurnPlayer();
  const powerType: keyof COProperties["powers"] = action.isSuper ? "superCOPower" : "COPower";

  if (player.data.COPowerState !== "no-power") {
    throw new DispatchableError(`Can't use ${powerType} with a power already active`);
  }

  const coProperties = getCOProperties(player.data.coId);

  const power = throwIfUndefined(
    coProperties.powers[powerType],
    `Your CO (${coProperties.displayName}) doesn't have ${powerType}`,
  );

  const powerCost = power.stars * player.getPowerStarCost();

  if (powerCost > player.data.powerMeter) {
    throw new DispatchableError(`Not enough power meter for ${powerType}`);
  }

  if (power.calculatePositions !== undefined) {
    return {
      ...action,
      positions: power.calculatePositions(player),
    };
  }

  return action;
};

export const applyCOPowerEvent = (match: MatchWrapper, event: COPowerEvent): void => {
  const player = match.getCurrentTurnPlayer();
  const COProperties = getCOProperties(player.data.coId);
  const powerType: keyof COProperties["powers"] = event.isSuper ? "superCOPower" : "COPower";
  const power = throwIfUndefined(COProperties.powers[powerType]);

  // applying all match rules, read doc of variables for details
  if (player.getVersionProperties().raisePowerCostBeforeUsing) {
    ++player.data.timesPowerUsed;
    player.data.powerMeter -= power.stars * player.getPowerStarCost();
  } else {
    player.data.powerMeter -= power.stars * player.getPowerStarCost();
    ++player.data.timesPowerUsed;
  }

  //event.positions are for rachel, sturm, von-bolt supers
  power.instantEffect?.(player, event.positions);

  player.team.vision?.recalculateVision(player.team.getUnits()); // justin case
};
