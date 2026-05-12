import type { RO } from "shared/types/ww-readonly";
import type { MatchWrapper } from "shared/wrappers/match/match";
import type { UnitWrapper } from "shared/wrappers/unit/unit";

export type CombatProperties = Readonly<{
  attacker: RO<UnitWrapper>;
  defender: RO<UnitWrapper>;
}>;

type ReturnValue = number | undefined;

export interface Hooks {
  buildCost: (baseBuildCost: number, match: RO<MatchWrapper>) => ReturnValue;
  movementCost: (baseMovementCost: number, unit: RO<UnitWrapper>) => ReturnValue;
  movementPoints: (baseMovementPoints: number, unit: RO<UnitWrapper>) => ReturnValue;
  vision: (baseVisionRange: number) => ReturnValue;

  attackRange: (baseRange: number, attacker: RO<UnitWrapper>) => ReturnValue;

  terrainStars: (baseTerrainStars: number, combatProperties: CombatProperties) => ReturnValue;

  attack: (combatProperties: CombatProperties) => ReturnValue;
  defense: (combatProperties: CombatProperties) => ReturnValue;

  maxGoodLuck: (combatProperties: CombatProperties) => ReturnValue;
  maxBadLuck: (combatProperties: CombatProperties) => ReturnValue;
}
