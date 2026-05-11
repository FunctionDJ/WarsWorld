import type { AttackEvent, EmittableAttackEvent } from "shared/types/events";
import type { MatchWrapper } from "shared/wrappers/match/match";
import type { Team } from "shared/wrappers/team/team";
import type { UnitWrapper } from "shared/wrappers/unit/unit";
import { canAttackWithPrimary } from "./can-attack-with-primary";
import { getPowerChargeGain } from "./get-power-charge-gain";

export const createEmittableAttackEvent = (
  match: MatchWrapper,
  attacker: UnitWrapper, //assume updated after move
  attackEvent: AttackEvent,
  teamWitness: Team,
): EmittableAttackEvent => {
  const emittableEvent: EmittableAttackEvent = {
    type: "attack",
    playerUpdate: match.getAllPlayers().map((p) => p.data),
  };

  const defender = match.getUnit(attackEvent.defenderPosition, "dont-throw");

  const attackerHPDiff =
    attackEvent.attackerHP === undefined
      ? 0
      : attacker.getVisualHP() - Math.ceil(attackEvent.attackerHP / 10);
  const defenderHPDiff =
    defender === undefined ? 0 : defender.getVisualHP() - Math.ceil(attackEvent.defenderHP / 10);

  const powerChargeGain = defender
    ? getPowerChargeGain(attacker, attackerHPDiff, defender, defenderHPDiff)
    : { attackerPowerCharge: 0, defenderPowerCharge: 0 };

  if (
    teamWitness.canSeeUnitAtPosition(attacker.data.position) ||
    (attacker.player.data.COPowerState === "no-power" && powerChargeGain.attackerPowerCharge !== 0)
  ) {
    emittableEvent.attacker = {
      playerSlot: attacker.player.data.slot,
      powerChargeGained: powerChargeGain.attackerPowerCharge,
    };

    if (teamWitness.canSeeUnitAtPosition(attacker.data.position)) {
      emittableEvent.attacker.position = attacker.data.position;

      //include hp after engagement if allowed to see
      if (
        attacker.player.team.index === teamWitness.index ||
        attacker.player.data.coId.name !== "sonja" ||
        attackEvent.attackerHP === 0
      ) {
        emittableEvent.attacker.HP = attackEvent.attackerHP;
      }

      emittableEvent.attacker.usedAmmo = canAttackWithPrimary(
        attacker,
        defender?.data.type ?? "pipe-seam",
      );
    }

    if (
      defender &&
      teamWitness.players.includes(defender.player) &&
      defender.player.isUsingPower("super-co-power", "sasha") &&
      attackEvent.attackerHP !== undefined
    ) {
      //defender is sasha with scop, so we need to send damage dealt by sasha's unit
      //damage in funds = visual_hp_lost * build_cost_per_hp
      emittableEvent.attacker.damageTakenInFunds = (attackerHPDiff * attacker.getBuildCost()) / 10;
    }
  }

  if (!defender) {
    //pipe seam
    emittableEvent.defender = {
      playerSlot: -1,
      position: attackEvent.defenderPosition,
      HP: attackEvent.defenderHP,
    };
  } else if (
    teamWitness.canSeeUnitAtPosition(defender.data.position) ||
    (defender.player.data.COPowerState === "no-power" && powerChargeGain.defenderPowerCharge !== 0)
  ) {
    emittableEvent.defender = {
      playerSlot: defender.player.data.slot,
      powerChargeGained: powerChargeGain.defenderPowerCharge,
    };

    if (teamWitness.canSeeUnitAtPosition(defender.data.position)) {
      emittableEvent.defender.position = defender.data.position;

      //include hp after engagement if allowed to see
      if (
        defender.player.team.index === teamWitness.index ||
        defender.player.data.coId.name !== "sonja" ||
        attackEvent.defenderHP === 0
      ) {
        emittableEvent.defender.HP = attackEvent.defenderHP;
      }

      emittableEvent.defender.usedAmmo = canAttackWithPrimary(defender, attacker.data.type);
    }

    if (
      teamWitness.players.includes(attacker.player) &&
      attacker.player.isUsingPower("super-co-power", "sasha")
    ) {
      //attacker is sasha with scop, so we need to send damage dealt by sasha's unit
      //damage in funds = visual_hp_lost * build_cost_per_hp
      emittableEvent.defender.damageTakenInFunds = (defenderHPDiff * defender.getBuildCost()) / 10;
    }
  }

  return emittableEvent;
};
