import type { PlayerInMatchWrapper } from "shared/wrappers/player/player-in-match";
import type { UnitWrapper } from "shared/wrappers/unit/unit";

export const applySashaFundsDamage = (
  sashaPlayer: PlayerInMatchWrapper,
  damageInFundsDealt: number,
): void => {
  sashaPlayer.data.funds += damageInFundsDealt * 0.5;
};

export const handleSashaScopFunds = (
  attacker: UnitWrapper,
  defender: UnitWrapper,
  attackerHpDiff: number,
  defenderHpDiff: number,
): void => {
  if (
    attacker.player.data.coId.name === "sasha" &&
    attacker.player.data.COPowerState === "super-co-power"
  ) {
    applySashaFundsDamage(attacker.player, (defenderHpDiff * defender.getBuildCost()) / 10);
  }

  if (
    defender.player.data.coId.name === "sasha" &&
    defender.player.data.COPowerState === "super-co-power"
  ) {
    applySashaFundsDamage(defender.player, (attackerHpDiff * attacker.getBuildCost()) / 10);
  }
};
