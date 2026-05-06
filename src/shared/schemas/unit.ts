import { z } from "zod";
import {
  unitInMapSharedProperties as shared,
  withAmmoUnitStats,
  withCapturePoints,
  withHidden,
  withNoAmmoUnitStats,
  withTypeSchema,
} from "./unit-traits";

//LAND UNITS:

const infantrySchema = withTypeSchema("infantry")
  .extend(withNoAmmoUnitStats)
  .extend(withCapturePoints);

const mechSchema = withTypeSchema("mech").extend(withAmmoUnitStats).extend(withCapturePoints);

export const infantryOrMechSchema = infantrySchema.or(mechSchema);

const APCSchema = withTypeSchema("apc").extend(withNoAmmoUnitStats).extend({
  loadedUnit: infantryOrMechSchema.nullable(),
});

const reconSchema = withTypeSchema("recon").extend(withNoAmmoUnitStats);

const otherLandUnitsWithAmmo = z
  .object({
    type: z.enum([
      "artillery",
      "tank",
      "antiAir",
      "missile",
      "rocket",
      "mediumTank",
      "neoTank",
      "megaTank",
    ]),
  })
  .extend(withAmmoUnitStats);

//AIR UNITS:
const transportCopterSchema = withTypeSchema("transportCopter").extend(withNoAmmoUnitStats).extend({
  loadedUnit: infantryOrMechSchema.nullable(),
});

const battleCopterSchema = withTypeSchema("battleCopter").extend(withAmmoUnitStats);

const blackBombSchema = withTypeSchema("blackBomb").extend(withNoAmmoUnitStats);

const bomberAndFighterSchema = z
  .object({
    type: z.enum(["bomber", "fighter"]),
  })
  .extend(withAmmoUnitStats);

const stealthSchema = withTypeSchema("stealth").extend(withHidden).extend(withAmmoUnitStats);

const blackBoatLoadedUnitSchema = z.discriminatedUnion("type", [infantrySchema, mechSchema]);

//SEA UNITS:
const blackBoatSchema = withTypeSchema("blackBoat").extend(withNoAmmoUnitStats).extend({
  loadedUnit: blackBoatLoadedUnitSchema.nullable(),
  loadedUnit2: blackBoatLoadedUnitSchema.nullable(),
});

export const landerLoadedUnitSchema = z.discriminatedUnion("type", [
  infantrySchema,
  mechSchema,
  reconSchema,
  APCSchema,
  otherLandUnitsWithAmmo,
]);

const landerSchema = withTypeSchema("lander").extend(withNoAmmoUnitStats).extend({
  loadedUnit: landerLoadedUnitSchema.nullable(),
  loadedUnit2: landerLoadedUnitSchema.nullable(),
});

export const cruiserLoadedUnitSchema = z.discriminatedUnion("type", [
  transportCopterSchema,
  battleCopterSchema,
]);

const cruiserSchema = withTypeSchema("cruiser").extend(withAmmoUnitStats).extend({
  loadedUnit: cruiserLoadedUnitSchema.nullable(),
  loadedUnit2: cruiserLoadedUnitSchema.nullable(),
});

const battleshipSchema = withTypeSchema("battleship").extend(withAmmoUnitStats);

const subSchema = withTypeSchema("sub").extend(withHidden).extend(withAmmoUnitStats);

export const carrierLoadedUnitSchema = z.discriminatedUnion("type", [
  transportCopterSchema,
  battleCopterSchema,
  blackBombSchema,
  bomberAndFighterSchema,
  stealthSchema,
]);

const carrierSchema = withTypeSchema("carrier").extend(withAmmoUnitStats).extend({
  loadedUnit: carrierLoadedUnitSchema.nullable(),
  loadedUnit2: carrierLoadedUnitSchema.nullable(),
});

export type LoadedUnit = z.infer<
  z.ZodUnion<
    [
      typeof cruiserLoadedUnitSchema,
      typeof landerLoadedUnitSchema,
      typeof blackBoatLoadedUnitSchema,
      typeof carrierLoadedUnitSchema,
    ]
  >
>;

//PIPE? UNITS:
const pipeRunnerSchema = withTypeSchema("pipeRunner").extend(withAmmoUnitStats);

export const unitSchema = z.discriminatedUnion("type", [
  // this can't be easily mapped
  // because it'd be pushing the limits of zod or typescript i think
  infantrySchema.extend(shared),
  mechSchema.extend(shared),
  reconSchema.extend(shared),
  APCSchema.extend(shared),
  otherLandUnitsWithAmmo.extend(shared),
  transportCopterSchema.extend(shared),
  battleCopterSchema.extend(shared),
  blackBombSchema.extend(shared),
  blackBoatSchema.extend(shared),
  landerSchema.extend(shared),
  cruiserSchema.extend(shared),
  bomberAndFighterSchema.extend(shared),
  stealthSchema.extend(shared),
  battleshipSchema.extend(shared),
  subSchema.extend(shared),
  carrierSchema.extend(shared),
  pipeRunnerSchema.extend(shared),
]);

export type UnitWithVisibleStats = z.infer<typeof unitSchema>;

export type UnitType = UnitWithVisibleStats["type"];

/** not nice to read but the only way to get the type strings as values */
export const unitTypes = unitSchema.options.flatMap((option) => {
  // there are also potentially other paths:
  // infantrySchema.shape.type.def.values
  // otherLandUnitsWithAmmo.shape.type.options
  // but i couldn't get this method sort-of-type-safe like the current code.

  const typeDef = option._zod.def.shape.type.def;

  switch (typeDef.type) {
    case "literal":
      return typeDef.values;
    case "enum":
      return Object.values(typeDef.entries);
  }
});

export const unitTypeSchema = z.enum(unitTypes as [UnitType, ...UnitType[]]);

type UnitWithHiddenStats = Omit<UnitWithVisibleStats, "stats"> & {
  stats: "hidden";
};

export type WWUnit = UnitWithHiddenStats | UnitWithVisibleStats;
