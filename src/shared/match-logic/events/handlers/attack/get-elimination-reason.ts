import type { AttackEvent } from "shared/events";
import type { PlayerInMatchWrapper } from "shared/wrappers/player-in-match";
import type { RO } from "shared/ww-readonly";

export function getEliminationReason({
  attacker,
  defender,
  attackerHP,
  defenderHP,
}: {
  attacker: RO<PlayerInMatchWrapper>;
  defender: RO<PlayerInMatchWrapper>;
  attackerHP?: number;
  defenderHP?: number;
}): AttackEvent["eliminationReason"] {
  if (defenderHP === 0 && defender.getUnits().length - 1 <= 0) {
    return "all-defender-units-destroyed";
  }

  if (attackerHP === 0 && attacker.getUnits().length - 1 <= 0) {
    return "all-attacker-units-destroyed";
  }

  return;
}
