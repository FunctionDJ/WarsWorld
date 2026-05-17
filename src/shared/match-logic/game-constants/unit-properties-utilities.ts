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

export type UnitPropertiesWithoutWeapon = Readonly<{
	displayName: string;
	cost: number;
	facility: Facility;
	movementType: MovementType;
	movementPoints: number;
	initialFuel: number;
	vision: number;
}>;

type Range = readonly [number, number];

export const directRange = [1, 1] as const satisfies Range;

export type UnitPropertiesWithoutAmmo = UnitPropertiesWithoutWeapon & {
	readonly attackRange: Range;
};

export type UnitPropertiesWithAmmo = UnitPropertiesWithoutAmmo & {
	readonly initialAmmo: number;
};

export type UnitProperties =
	| UnitPropertiesWithAmmo
	| UnitPropertiesWithoutAmmo
	| UnitPropertiesWithoutWeapon;
