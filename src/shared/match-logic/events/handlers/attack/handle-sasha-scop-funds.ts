import type { MutablePlayerInMatch } from "shared/wrappers/player/mutable-player-in-match";
import type { MutableUnit } from "shared/wrappers/unit/mutable-unit";

export const applySashaFundsDamage = (
  sashaPlayer: MutablePlayerInMatch,
  damageInFundsDealt: number,
): void => {
  sashaPlayer.data.funds += damageInFundsDealt * 0.5;
};

export const handleSashaScopFunds = (
  attacker: MutableUnit,
  defender: MutableUnit,
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
