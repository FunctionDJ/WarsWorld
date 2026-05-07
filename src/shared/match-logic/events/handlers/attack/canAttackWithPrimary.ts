import type { UnitTypeString } from "shared/schemas/unit";
import type { UnitWrapper } from "shared/wrappers/unit/unit";

/**
 * Returns if unit is going to attack enemy unit with primary weapon or not
 */
export const canAttackWithPrimary = (
  attacker: UnitWrapper,
  defender: UnitTypeString | "pipe-seam",
): boolean => {
  if (attacker.getAmmo() === 0 || attacker.getAmmo() === undefined) {
    return false;
  }

  const defenderType: UnitTypeString = defender === "pipe-seam" ? "mediumTank" : defender;

  return (
    attacker.player.getVersionProperties().damageChart[attacker.data.type]?.primary?.[
      defenderType
    ] !== undefined
  );
};
