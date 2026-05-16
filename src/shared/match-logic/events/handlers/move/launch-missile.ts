import { DispatchableError, InvalidStateError } from "shared/errors";
import type { LaunchMissileEvent } from "shared/events";
import type { LaunchMissileAction } from "shared/schemas/action";
import type { Position } from "shared/schemas/position";
import type { MatchWrapper } from "shared/wrappers/match";
import type { SubActionToEvent } from "../../handler-types";

export const launchMissileActionToEvent: SubActionToEvent<LaunchMissileAction> = (
  match,
  action,
  fromPosition,
) => {
  const player = match.getCurrentTurnPlayer();
  const unit = match.getUnit(fromPosition);
  player.ownsOrThrow(unit);

  const tile = match.getTile(fromPosition);

  if (tile.type !== "unusedSilo") {
    throw new DispatchableError("This tile is not a missile silo");
  }

  if (unit.data.type !== "infantry" && unit.data.type !== "mech") {
    throw new DispatchableError("Trying to launch a missile with a non valid unit type");
  }

  match.map.throwIfOutOfBounds(action.targetPosition);

  return action;
};

export const applyLaunchMissileEvent = (
  match: MatchWrapper,
  event: LaunchMissileEvent,
  fromPosition: Position,
): void => {
  if (match.getTile(fromPosition).type !== "unusedSilo") {
    throw new InvalidStateError("This tile is not a missile silo");
  }

  // [missing-implementation] remove unusedSilo from match changeable/positionedTiles

  match.damageUntil1HPInRadius({
    radius: 2,
    visualHpAmount: 3,
    epicenter: event.targetPosition,
  });
};
