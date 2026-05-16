import type { Unit } from "shared/wrappers/unit";

export const getPowerChargeGain = (
  attacker: Unit,
  attackerHpDiff: number,
  defender: Unit,
  defenderHpDiff: number,
): { attackerPowerCharge: number; defenderPowerCharge: number } => {
  //power meter charge
  const attackerVP = attacker.player.getVersionProperties();
  const defenderVP = defender.player.getVersionProperties();

  return {
    attackerPowerCharge:
      attackerVP.powerMeterIncreasePerHP(attacker) * attackerHpDiff +
      attackerVP.powerMeterIncreasePerHP(defender) *
        defenderHpDiff *
        attackerVP.offensivePowerGenMult,
    defenderPowerCharge:
      defenderVP.powerMeterIncreasePerHP(defender) * defenderHpDiff +
      defenderVP.powerMeterIncreasePerHP(attacker) *
        attackerHpDiff *
        defenderVP.offensivePowerGenMult,
  };
};
