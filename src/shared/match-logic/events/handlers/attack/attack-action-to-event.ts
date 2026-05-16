import { DispatchableError } from "shared/errors";
import type { AttackEvent } from "shared/events";
import { calculateEngagementOutcome } from "shared/match-logic/calculate-damage";
import {
  createPipeSeamUnitEquivalent,
  getBaseDamage,
} from "shared/match-logic/game-constants/base-damage";
import type { AttackAction } from "shared/schemas/action";
import type { LuckRoll } from "shared/schemas/co";
import { throwIfUndefined } from "shared/throw-helper";
import type { SubActionToEvent } from "../../handler-types";
import { getEliminationReason } from "./get-elimination-reason";

type ParametersForAttackActionToEvent = [
  ...Parameters<SubActionToEvent<AttackAction>>,
  unitHasMoved: boolean,
  attackerLuck: LuckRoll,
  defenderLuck: LuckRoll,
];

export const attackActionToEvent: (
  ...parameters: ParametersForAttackActionToEvent
) => AttackEvent = (
  match,
  action,
  fromPosition,
  unitHasMoved, // for indirects not attacking and shooting
  attackerLuck,
  defenderLuck,
) => {
  const player = match.getCurrentTurnPlayer();

  const attacker = match.getUnit(fromPosition);
  player.ownsOrThrow(attacker);

  //check if unit is in range
  const attackRange = attacker.getAttackRange();

  if (attackRange.minRange > 1 && unitHasMoved) {
    throw new DispatchableError("Trying to move and attack with an indirect unit");
  }

  const attackDistance = fromPosition.getDistance(action.defenderPosition);

  if (attackRange.minRange > attackDistance || attackDistance > attackRange.maxRange) {
    throw new DispatchableError("Unit is not in range to attack");
  }

  const defender = match.getUnit(action.defenderPosition, "dont-throw");

  if (defender === undefined) {
    const attackedTile = match.getTile(action.defenderPosition);

    if (attackedTile.type !== "pipeSeam") {
      throw new DispatchableError("No unit found in target location to attack");
    }

    const pipeSeamUnitEquivalent = createPipeSeamUnitEquivalent(
      attacker,
      action.defenderPosition,
      attackedTile.hp,
    );

    throwIfUndefined(
      getBaseDamage(attacker, pipeSeamUnitEquivalent),
      "Unit cannot attack specified pipeseam",
    );

    const result = calculateEngagementOutcome(
      attacker,
      pipeSeamUnitEquivalent,
      { goodLuck: 0, badLuck: 0 },
      { goodLuck: 0, badLuck: 0 },
    );

    return {
      ...action,
      defenderHP: Math.max(0, result.defenderHP),
    };
  }

  if (defender.player.team.index === player.team.index) {
    throw new DispatchableError("The target unit is from your own team");
  }

  // TODO
  // i think we need to make this check a lot earlier.
  // maybe just use team.vision to see if the targeted position is visible.
  // the way this code reads right now could expose info to players if the target position has a unit or not.

  if (!attacker.player.team.canSeeUnitAtPosition(defender.data.position)) {
    throw new DispatchableError("The target unit is not in vision");
  }

  throwIfUndefined(
    getBaseDamage(attacker, defender),
    "This unit cannot attack specified enemy unit",
  );

  // sonja scop exception (she attacks first when attacked)
  if (
    defender.player.data.coId.name === "sonja" &&
    defender.player.data.COPowerState === "super-co-power"
  ) {
    // "defender" is sonja unit with scop, "attacker" is unit that attacked sonja unit
    const result = calculateEngagementOutcome(defender, attacker, defenderLuck, attackerLuck);

    // that means sonja scop unit killed attacker, so they couldn't "counterattack" the sonja unit
    // therefore, sonja unit (defender) remains untouched
    result.attackerHP ??= defender.data.hp === "sonja-hidden" ? 100 : defender.data.hp;
    // note: this `defender.data.hp === "sonja-hidden" ? 100 : defender.data.hp` might be confusing to readers.
    // the architecture requires us to have this `100` fallback value, but it effectively doesn't get used by any client running this code.
    // they'll keep using the "sonja-hidden" special hp value and handle it accordingly.

    return {
      ...action,
      defenderHP: Math.max(0, result.attackerHP),
      attackerHP: Math.max(0, result.defenderHP),
      eliminationReason: getEliminationReason({
        attacker: attacker.player, // TODO not sure if this is the correct way around...
        defender: defender.player,
        attackerHP: Math.max(0, result.defenderHP),
        defenderHP: Math.max(0, result.attackerHP),
      }),
    };
  }

  const result = calculateEngagementOutcome(attacker, defender, attackerLuck, defenderLuck);

  return {
    ...action,
    defenderHP: Math.max(0, result.defenderHP),
    attackerHP: result.attackerHP === undefined ? undefined : Math.max(0, result.attackerHP),
    eliminationReason: getEliminationReason({
      attacker: attacker.player,
      defender: defender.player,
      attackerHP: result.attackerHP === undefined ? undefined : Math.max(0, result.attackerHP),
      defenderHP: Math.max(0, result.defenderHP),
    }),
  };
};
