import type { WWReadOnly } from "shared/types/ww-readonly";
import type { MatchWrapper } from "shared/wrappers/match/match";
import type { UnitWrapper } from "shared/wrappers/unit/unit";

export type CombatProperties = Readonly<{
  attacker: UnitWrapper;
  defender: UnitWrapper;
}>;

type ReturnValue = number | undefined;

export interface Hooks {
  buildCost: (baseBuildCost: number, match: WWReadOnly<MatchWrapper>) => ReturnValue;
  movementCost: (baseMovementCost: number, unit: WWReadOnly<UnitWrapper>) => ReturnValue;
  movementPoints: (baseMovementPoints: number, unit: WWReadOnly<UnitWrapper>) => ReturnValue;
  vision: (baseVisionRange: number) => ReturnValue;

  attackRange: (baseRange: number, attacker: WWReadOnly<UnitWrapper>) => ReturnValue;

  terrainStars: (baseTerrainStars: number, combatProperties: CombatProperties) => ReturnValue;

  attack: (combatProperties: CombatProperties) => ReturnValue;
  defense: (combatProperties: CombatProperties) => ReturnValue;

  maxGoodLuck: (combatProperties: CombatProperties) => ReturnValue;
  maxBadLuck: (combatProperties: CombatProperties) => ReturnValue;
}
