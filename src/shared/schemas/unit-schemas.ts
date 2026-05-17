/* eslint-disable max-lines */
import { z } from "zod";
import { playerSlotForUnitsSchema } from "./player-slot";
import { positionSchema } from "./position";

export const hpSchema = z.number().int().min(1).max(100).or(z.literal("sonja-hidden"));
const fuelSchema = z.number().int().min(0).max(99);

const infantrySchema = z.object({
	type: z.literal("infantry"),
	playerSlot: playerSlotForUnitsSchema,
	position: positionSchema,
	isReady: z.boolean(),
	hp: hpSchema,
	fuel: fuelSchema,
});

const mechSchema = z.object({
	type: z.literal("mech"),
	playerSlot: playerSlotForUnitsSchema,
	position: positionSchema,
	isReady: z.boolean(),
	hp: hpSchema,
	fuel: fuelSchema,
	ammo: z.number().int().min(0),
});

const infantryOrMechSchema = infantrySchema.or(mechSchema);

const apcSchema = z.object({
	type: z.literal("apc"),
	playerSlot: playerSlotForUnitsSchema,
	position: positionSchema,
	isReady: z.boolean(),
	hp: hpSchema,
	fuel: fuelSchema,
	loadedUnits: z.tuple([infantryOrMechSchema.or(z.undefined())]),
});

const reconSchema = z.object({
	type: z.literal("recon"),
	playerSlot: playerSlotForUnitsSchema,
	position: positionSchema,
	isReady: z.boolean(),
	hp: hpSchema,
	fuel: fuelSchema,
});

const artillerySchema = z.object({
	type: z.literal("artillery"),
	playerSlot: playerSlotForUnitsSchema,
	position: positionSchema,
	isReady: z.boolean(),
	hp: hpSchema,
	fuel: fuelSchema,
	ammo: z.number().int().min(0),
});

const tankSchema = z.object({
	type: z.literal("tank"),
	playerSlot: playerSlotForUnitsSchema,
	position: positionSchema,
	isReady: z.boolean(),
	hp: hpSchema,
	fuel: fuelSchema,
	ammo: z.number().int().min(0),
});

const antiAirSchema = z.object({
	type: z.literal("antiAir"),
	playerSlot: playerSlotForUnitsSchema,
	position: positionSchema,
	isReady: z.boolean(),
	hp: hpSchema,
	fuel: fuelSchema,
	ammo: z.number().int().min(0),
});

const missileSchema = z.object({
	type: z.literal("missile"),
	playerSlot: playerSlotForUnitsSchema,
	position: positionSchema,
	isReady: z.boolean(),
	hp: hpSchema,
	fuel: fuelSchema,
	ammo: z.number().int().min(0),
});

const rocketSchema = z.object({
	type: z.literal("rocket"),
	playerSlot: playerSlotForUnitsSchema,
	position: positionSchema,
	isReady: z.boolean(),
	hp: hpSchema,
	fuel: fuelSchema,
	ammo: z.number().int().min(0),
});

const mediumTankSchema = z.object({
	type: z.literal("mediumTank"),
	playerSlot: playerSlotForUnitsSchema,
	position: positionSchema,
	isReady: z.boolean(),
	hp: hpSchema,
	fuel: fuelSchema,
	ammo: z.number().int().min(0),
});

const neoTankSchema = z.object({
	type: z.literal("neoTank"),
	playerSlot: playerSlotForUnitsSchema,
	position: positionSchema,
	isReady: z.boolean(),
	hp: hpSchema,
	fuel: fuelSchema,
	ammo: z.number().int().min(0),
});

const megaTankSchema = z.object({
	type: z.literal("megaTank"),
	playerSlot: playerSlotForUnitsSchema,
	position: positionSchema,
	isReady: z.boolean(),
	hp: hpSchema,
	fuel: fuelSchema,
	ammo: z.number().int().min(0),
});

const transportCopterSchema = z.object({
	type: z.literal("transportCopter"),
	playerSlot: playerSlotForUnitsSchema,
	position: positionSchema,
	isReady: z.boolean(),
	hp: hpSchema,
	fuel: fuelSchema,
	loadedUnits: z.tuple([infantryOrMechSchema.or(z.undefined())]),
});

const battleCopterSchema = z.object({
	type: z.literal("battleCopter"),
	playerSlot: playerSlotForUnitsSchema,
	position: positionSchema,
	isReady: z.boolean(),
	hp: hpSchema,
	fuel: fuelSchema,
	ammo: z.number().int().min(0),
});

const blackBombSchema = z.object({
	type: z.literal("blackBomb"),
	playerSlot: playerSlotForUnitsSchema,
	position: positionSchema,
	isReady: z.boolean(),
	hp: hpSchema,
	fuel: fuelSchema,
});

const bomberSchema = z.object({
	type: z.literal("bomber"),
	playerSlot: playerSlotForUnitsSchema,
	position: positionSchema,
	isReady: z.boolean(),
	hp: hpSchema,
	fuel: fuelSchema,
	ammo: z.number().int().min(0),
});

const fighterSchema = z.object({
	type: z.literal("fighter"),
	playerSlot: playerSlotForUnitsSchema,
	position: positionSchema,
	isReady: z.boolean(),
	hp: hpSchema,
	fuel: fuelSchema,
	ammo: z.number().int().min(0),
});

const stealthSchema = z.object({
	type: z.literal("stealth"),
	playerSlot: playerSlotForUnitsSchema,
	position: positionSchema,
	isReady: z.boolean(),
	hp: hpSchema,
	fuel: fuelSchema,
	ammo: z.number().int().min(0),
	hiddenByAbility: z.boolean(),
});

const blackBoatSchema = z.object({
	type: z.literal("blackBoat"),
	playerSlot: playerSlotForUnitsSchema,
	position: positionSchema,
	isReady: z.boolean(),
	hp: hpSchema,
	fuel: fuelSchema,
	loadedUnits: z.tuple([
		infantryOrMechSchema.or(z.undefined()),
		infantryOrMechSchema.or(z.undefined()),
	]),
});

export const landerLoadedUnitSchema = z.discriminatedUnion("type", [
	infantrySchema,
	mechSchema,
	reconSchema,
	apcSchema,
	artillerySchema,
	tankSchema,
	antiAirSchema,
	missileSchema,
	rocketSchema,
	mediumTankSchema,
	neoTankSchema,
	megaTankSchema,
]);

const landerSchema = z.object({
	type: z.literal("lander"),
	playerSlot: playerSlotForUnitsSchema,
	position: positionSchema,
	isReady: z.boolean(),
	hp: hpSchema,
	fuel: fuelSchema,
	loadedUnits: z.tuple([
		landerLoadedUnitSchema.or(z.undefined()),
		landerLoadedUnitSchema.or(z.undefined()),
	]),
});

export const cruiserLoadedUnitSchema = z.discriminatedUnion("type", [
	transportCopterSchema,
	battleCopterSchema,
]);

const cruiserSchema = z.object({
	type: z.literal("cruiser"),
	playerSlot: playerSlotForUnitsSchema,
	position: positionSchema,
	isReady: z.boolean(),
	hp: hpSchema,
	fuel: fuelSchema,
	ammo: z.number().int().min(0),
	loadedUnits: z.tuple([
		cruiserLoadedUnitSchema.or(z.undefined()),
		cruiserLoadedUnitSchema.or(z.undefined()),
	]),
});

const battleshipSchema = z.object({
	type: z.literal("battleship"),
	playerSlot: playerSlotForUnitsSchema,
	position: positionSchema,
	isReady: z.boolean(),
	hp: hpSchema,
	fuel: fuelSchema,
	ammo: z.number().int().min(0),
});

const subSchema = z.object({
	type: z.literal("sub"),
	playerSlot: playerSlotForUnitsSchema,
	position: positionSchema,
	isReady: z.boolean(),
	hp: hpSchema,
	fuel: fuelSchema,
	ammo: z.number().int().min(0),
	hiddenByAbility: z.boolean(),
});

export const carrierLoadedUnitSchema = z.discriminatedUnion("type", [
	transportCopterSchema,
	battleCopterSchema,
	blackBombSchema,
	bomberSchema,
	fighterSchema,
	stealthSchema,
]);

const carrierSchema = z.object({
	type: z.literal("carrier"),
	playerSlot: playerSlotForUnitsSchema,
	position: positionSchema,
	isReady: z.boolean(),
	hp: hpSchema,
	fuel: fuelSchema,
	ammo: z.number().int().min(0),
	loadedUnits: z.tuple([
		carrierLoadedUnitSchema.or(z.undefined()),
		carrierLoadedUnitSchema.or(z.undefined()),
	]),
});

const pipeRunnerSchema = z.object({
	type: z.literal("pipeRunner"),
	playerSlot: playerSlotForUnitsSchema,
	position: positionSchema,
	isReady: z.boolean(),
	hp: hpSchema,
	fuel: fuelSchema,
	ammo: z.number().int().min(0),
});

export const unitSchema = z.discriminatedUnion("type", [
	infantrySchema,
	mechSchema,
	apcSchema,
	reconSchema,
	artillerySchema,
	tankSchema,
	antiAirSchema,
	missileSchema,
	rocketSchema,
	mediumTankSchema,
	neoTankSchema,
	megaTankSchema,
	transportCopterSchema,
	battleCopterSchema,
	blackBombSchema,
	bomberSchema,
	fighterSchema,
	stealthSchema,
	blackBoatSchema,
	landerSchema,
	cruiserSchema,
	battleshipSchema,
	subSchema,
	carrierSchema,
	pipeRunnerSchema,
]);

export type UnitData = z.infer<typeof unitSchema>;

export const unitTypeSchema = z.enum(unitSchema.options.map((option) => option.shape.type.value));

export const unitTypes = unitTypeSchema.options;

export type UnitType = z.infer<typeof unitTypeSchema>;
