import type { MatchWrapper } from "shared/wrappers/match";
import type { Unit } from "shared/wrappers/unit";
import type { RO } from "shared/ww-readonly";

export type CombatProperties = Readonly<{
  attacker: RO<Unit>;
  defender: RO<Unit>;
}>;

type ReturnValue = number | undefined;

export interface Hooks {
  buildCost: (baseBuildCost: number, match: RO<MatchWrapper>) => ReturnValue;
  movementCost: (baseMovementCost: number, unit: RO<Unit>) => ReturnValue;
  movementPoints: (baseMovementPoints: number, unit: RO<Unit>) => ReturnValue;
  vision: (baseVisionRange: number) => ReturnValue;

  attackRange: (baseRange: number, attacker: RO<Unit>) => ReturnValue;

  terrainStars: (baseTerrainStars: number, combatProperties: CombatProperties) => ReturnValue;

  attack: (combatProperties: CombatProperties) => ReturnValue;
  defense: (combatProperties: CombatProperties) => ReturnValue;

  maxGoodLuck: (combatProperties: CombatProperties) => ReturnValue;
  maxBadLuck: (combatProperties: CombatProperties) => ReturnValue;
}
