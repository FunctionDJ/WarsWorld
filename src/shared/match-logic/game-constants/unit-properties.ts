/* eslint-disable max-lines */
import {
	type UnitPropertiesWithAmmo,
	type UnitPropertiesWithoutAmmo,
	type UnitPropertiesWithoutWeapon,
	directRange,
} from "./unit-properties-utilities";

const infantry: UnitPropertiesWithoutAmmo = {
	displayName: "Infantry",
	cost: 1000,
	facility: "base",
	movementType: "foot",
	movementPoints: 3,
	initialFuel: 99,
	vision: 2,
	attackRange: directRange,
} as const;

const mech: UnitPropertiesWithAmmo = {
	displayName: "Mech",
	cost: 3000,
	facility: "base",
	movementType: "boots",
	movementPoints: 2,
	initialFuel: 70,
	vision: 2,
	initialAmmo: 3,
	attackRange: directRange,
} as const;

const recon: UnitPropertiesWithoutAmmo = {
	displayName: "Recon",
	cost: 4000,
	facility: "base",
	vision: 5,
	initialFuel: 80,
	attackRange: directRange,
	movementType: "tires",
	movementPoints: 8,
} as const;

const apc: UnitPropertiesWithoutWeapon = {
	displayName: "APC",
	cost: 5000,
	facility: "base",
	movementPoints: 5,
	vision: 1,
	initialFuel: 70,
	movementType: "treads",
} as const;

const artillery: UnitPropertiesWithAmmo = {
	displayName: "Artillery",
	cost: 6000,
	facility: "base",
	vision: 1,
	initialFuel: 50,
	attackRange: [2, 3],
	initialAmmo: 9,
	movementType: "treads",
	movementPoints: 5,
} as const;

const tank: UnitPropertiesWithAmmo = {
	displayName: "Tank",
	cost: 7000,
	facility: "base",
	movementPoints: 6,
	vision: 3,
	initialAmmo: 9,
	attackRange: directRange,
	movementType: "treads",
	initialFuel: 70,
} as const;

const antiAir: UnitPropertiesWithAmmo = {
	displayName: "Anti-Air",
	cost: 8000,
	facility: "base",
	vision: 2,
	initialFuel: 60,
	movementType: "treads",
	attackRange: directRange,
	movementPoints: 6,
	initialAmmo: 9,
} as const;

const missile: UnitPropertiesWithAmmo = {
	displayName: "Missile",
	cost: 12_000,
	facility: "base",
	movementType: "tires",
	movementPoints: 4,
	initialAmmo: 6,
	attackRange: [3, 5],
	vision: 5,
	initialFuel: 50,
} as const;

const rocket: UnitPropertiesWithAmmo = {
	displayName: "Rocket",
	cost: 15_000,
	facility: "base",
	movementType: "tires",
	attackRange: [3, 5],
	movementPoints: 5,
	initialAmmo: 6,
	vision: 1,
	initialFuel: 50,
} as const;

const mediumTank: UnitPropertiesWithAmmo = {
	displayName: "MdTank",
	cost: 16_000,
	facility: "base",
	vision: 1,
	movementPoints: 5,
	initialFuel: 50,
	initialAmmo: 8,
	movementType: "treads",
	attackRange: directRange,
} as const;

const pipeRunner: UnitPropertiesWithAmmo = {
	displayName: "PipeRunner",
	cost: 20_000,
	facility: "base",
	attackRange: [2, 5],
	movementType: "pipe",
	movementPoints: 9,
	vision: 4,
	initialAmmo: 9,
	initialFuel: 99,
} as const;

const neoTank: UnitPropertiesWithAmmo = {
	displayName: "NeoTank",
	cost: 22_000,
	facility: "base",
	initialAmmo: 9,
	movementPoints: 6,
	vision: 1,
	initialFuel: 99,
	movementType: "treads",
	attackRange: directRange,
} as const;

const megaTank: UnitPropertiesWithAmmo = {
	displayName: "MegaTank",
	cost: 28_000,
	facility: "base",
	initialAmmo: 3,
	vision: 1,
	movementPoints: 4,
	initialFuel: 50,
	movementType: "treads",
	attackRange: directRange,
} as const;

const transportCopter: UnitPropertiesWithoutWeapon = {
	displayName: "T-Copter",
	cost: 5000,
	movementPoints: 6,
	vision: 2,
	facility: "airport",
	movementType: "air",
	initialFuel: 99,
} as const;

const battleCopter: UnitPropertiesWithAmmo = {
	displayName: "B-Copter",
	cost: 9000,
	vision: 3,
	initialFuel: 99,
	facility: "airport",
	movementType: "air",
	movementPoints: 9000,
	initialAmmo: 6,
	attackRange: directRange,
} as const;

const fighter: UnitPropertiesWithAmmo = {
	displayName: "Fighter",
	cost: 20_000,
	vision: 2,
	initialFuel: 99,
	movementType: "air",
	facility: "airport",
	movementPoints: 9,
	initialAmmo: 9,
	attackRange: directRange,
} as const;

const bomber: UnitPropertiesWithAmmo = {
	displayName: "Bomber",
	cost: 22_000,
	vision: 2,
	initialAmmo: 9,
	movementType: "air",
	facility: "airport",
	movementPoints: 7,
	initialFuel: 99,
	attackRange: directRange,
} as const;

const stealth: UnitPropertiesWithAmmo = {
	displayName: "Stealth",
	cost: 24_000,
	vision: 4,
	initialFuel: 60,
	movementPoints: 6,
	movementType: "air",
	facility: "airport",
	initialAmmo: 6,
	attackRange: directRange,
} as const;

const blackBomb: UnitPropertiesWithoutWeapon = {
	displayName: "BlackBomb",
	cost: 25_000,
	vision: 1,
	movementPoints: 9,
	movementType: "air",
	facility: "airport",
	initialFuel: 45,
} as const;

const blackBoat: UnitPropertiesWithoutWeapon = {
	displayName: "BlackBoat",
	cost: 7500,
	vision: 1,
	movementPoints: 7,
	movementType: "lander",
	facility: "port",
	initialFuel: 60,
} as const;

const lander: UnitPropertiesWithoutWeapon = {
	displayName: "Lander",
	cost: 12_000,
	vision: 1,
	movementType: "lander",
	facility: "port",
	movementPoints: 6,
	initialFuel: 99,
} as const;

const cruiser: UnitPropertiesWithAmmo = {
	displayName: "Cruiser",
	cost: 18_000,
	vision: 3,
	movementPoints: 6,
	movementType: "sea",
	facility: "port",
	initialAmmo: 9,
	initialFuel: 99,
	attackRange: directRange,
} as const;

const sub: UnitPropertiesWithAmmo = {
	displayName: "Sub",
	cost: 20_000,
	vision: 5,
	movementPoints: 5,
	facility: "port",
	movementType: "sea",
	initialAmmo: 6,
	initialFuel: 60,
	attackRange: directRange,
} as const;

const battleship: UnitPropertiesWithAmmo = {
	displayName: "Battleship",
	cost: 28_000,
	attackRange: [2, 6],
	vision: 2,
	movementType: "sea",
	movementPoints: 5,
	facility: "port",
	initialAmmo: 9,
	initialFuel: 99,
} as const;

const carrier: UnitPropertiesWithAmmo = {
	displayName: "Carrier",
	cost: 30_000,
	attackRange: [3, 8],
	vision: 4,
	movementType: "sea",
	facility: "port",
	movementPoints: 5,
	initialAmmo: 9,
	initialFuel: 99,
} as const;

export const unitPropertiesMap = {
	infantry,
	mech,
	recon,
	apc,
	artillery,
	tank,
	antiAir,
	missile,
	rocket,
	mediumTank,
	pipeRunner,
	neoTank,
	megaTank,
	transportCopter,
	battleCopter,
	fighter,
	bomber,
	stealth,
	blackBomb,
	blackBoat,
	lander,
	cruiser,
	sub,
	battleship,
	carrier,
} as const;
