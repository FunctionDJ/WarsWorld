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
  loadedUnit: infantryOrMechSchema.optional(),
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
  loadedUnit: infantryOrMechSchema.optional(),
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
  loadedUnit: blackBoatLoadedUnitSchema.optional(),
  loadedUnit2: blackBoatLoadedUnitSchema.optional(),
});

export const landerLoadedUnitSchema = z.discriminatedUnion("type", [
  infantrySchema,
  mechSchema,
  reconSchema,
  APCSchema,
  otherLandUnitsWithAmmo,
]);

const landerSchema = withTypeSchema("lander").extend(withNoAmmoUnitStats).extend({
  loadedUnit: landerLoadedUnitSchema.optional(),
  loadedUnit2: landerLoadedUnitSchema.optional(),
});

export const cruiserLoadedUnitSchema = z.discriminatedUnion("type", [
  transportCopterSchema,
  battleCopterSchema,
]);

const cruiserSchema = withTypeSchema("cruiser").extend(withAmmoUnitStats).extend({
  loadedUnit: cruiserLoadedUnitSchema.optional(),
  loadedUnit2: cruiserLoadedUnitSchema.optional(),
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
  loadedUnit: carrierLoadedUnitSchema.optional(),
  loadedUnit2: carrierLoadedUnitSchema.optional(),
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

export type LoadedTypeString = LoadedUnit["type"];

//PIPE? UNITS:
const pipeRunnerSchema = withTypeSchema("pipeRunner").extend(withAmmoUnitStats);

export const visibleUnitSchema = z.discriminatedUnion("type", [
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

export type UnitWithVisibleStats = z.infer<typeof visibleUnitSchema>;

export type UnitTypeString = UnitWithVisibleStats["type"];
export type TransportTypeString = Extract<
  UnitTypeString,
  "apc" | "transportCopter" | "blackBoat" | "lander" | "carrier" | "cruiser"
>;
export type IndirectTypeString = Extract<
  UnitTypeString,
  "artillery" | "missile" | "battleship" | "carrier" | "pipeRunner" | "rocket"
>;
export type InfantryOrMechTypeString = Extract<UnitTypeString, "infantry" | "mech">;

/** not nice to read but the only way to get the type strings as values */
export const unitTypes = visibleUnitSchema.options.flatMap((option) => {
  // there are also potentially other paths:
  // infantrySchema.shape.type.def.values
  // otherLandUnitsWithAmmo.shape.type.options
  // but i couldn't get this method sort-of-type-safe like the current code.

  const typeDefinition = option._zod.def.shape.type.def;

  switch (typeDefinition.type) {
    case "literal": {
      return typeDefinition.values;
    }
    case "enum": {
      return Object.values(typeDefinition.entries);
    }
  }
});

// export const unitTypeSchema = z.enum(unitTypes as [UnitTypeString, ...UnitTypeString[]]).readonly();
export const unitTypeSchema = z.enum(unitTypes).readonly();

type HiddenFromVisible<Unit extends UnitWithVisibleStats> = Omit<Unit, "stats"> & {
  stats: "hidden";
};

export type UnitWithHiddenStats = UnitWithVisibleStats extends infer Unit
  ? Unit extends UnitWithVisibleStats
    ? HiddenFromVisible<Unit>
    : never
  : never;

export type WWUnit = UnitWithHiddenStats | UnitWithVisibleStats;

export type FilterWWUnitByTypeString<
  TypeStringParameter extends UnitTypeString,
  UnitType extends WWUnit,
> = Extract<UnitType, { type: TypeStringParameter }>;

export type Visibility = "visible" | "hidden";

type UnitByVisibility<TVisibility extends Visibility = Visibility> = TVisibility extends "visible"
  ? UnitWithVisibleStats
  : UnitWithHiddenStats;

export type UnitByVisibilityAndTypeString<
  TVisibility extends Visibility = Visibility,
  TypeString extends UnitTypeString = UnitTypeString,
> = Extract<UnitByVisibility<TVisibility>, { type: TypeString }>;
