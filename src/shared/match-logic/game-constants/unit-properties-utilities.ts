export type MovementType =
  | "foot"
  | "boots"
  | "treads"
  | "tires"
  | "air"
  | "sea"
  | "lander"
  | "pipe";

export type Facility = "base" | "airport" | "port";

export interface UnitPropertiesWithoutWeapon {
  displayName: string;
  cost: number;
  facility: Facility;
  movementType: MovementType;
  movementPoints: number;
  initialFuel: number;
  vision: number;
}

type Range = [number, number];

export const directRange: Range = [1, 1];

export type UnitPropertiesWithoutAmmo = UnitPropertiesWithoutWeapon & {
  readonly attackRange: Range;
};

export type UnitPropertiesWithAmmo = UnitPropertiesWithoutAmmo & {
  readonly initialAmmo: number;
};
