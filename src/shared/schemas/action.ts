import { z } from "zod";
import { directionSchema } from "./direction";
import { pathSchema } from "./path";
import { positionSchema } from "./position";
import { unitTypeSchema } from "./unit-schemas";

const buildActionSchema = z
  .object({
    type: z.literal("build"),
    unitType: unitTypeSchema,
    position: positionSchema,
  })
  .readonly();

const deleteActionSchema = z
  .object({
    type: z.literal("delete"),
    position: positionSchema,
  })
  .readonly();

const waitActionSchema = z
  .object({
    type: z.literal("wait"),
  })
  .readonly();

/**
 * Capture, APC supply, black bomb explosion, toggle stealth/sub hide.
 * Unit inferred by event log (last event must be a "dangling" unit).
 */
const abilityActionSchema = z
  .object({
    type: z.literal("ability"),
  })
  .readonly();

const launchMissileActionSchema = z
  .object({
    type: z.literal("launchMissile"),
    targetPosition: positionSchema,
  })
  .readonly();

const unloadSchema = z
  .object({
    isSecondUnit: z.boolean(), //if the unloaded unit is "loadedUnit2"
    direction: directionSchema,
  })
  .readonly();

//AW2 behaviour, sub-action (comes after a move action)
const unloadWaitActionSchema = z
  .object({
    type: z.literal("unloadWait"),
    unloads: z
      .array(
        // 1 allowed by default, 2 for DoR move+unload
        unloadSchema,
      )
      .min(1)
      .max(2)
      .readonly(),
  })
  .readonly();

//AWBW behaviour, main action (needs position of transport, cause it's a main action)
const unloadNoWaitActionSchema = z
  .object({
    type: z.literal("unloadNoWait"),
    transportPosition: positionSchema,
    unloads: z
      .object({
        slot: z.literal(1).or(z.literal(2)),
        direction: directionSchema,
      })
      .readonly(),
  })
  .readonly();

const attackActionSchema = z
  .object({
    type: z.literal("attack"),
    defenderPosition: positionSchema,
  })
  .readonly();

const repairActionSchema = z
  .object({
    type: z.literal("repair"),
    direction: directionSchema,
  })
  .readonly();

const coPowerActionSchema = z
  .object({
    type: z.literal("coPower"),
    isSuper: z.boolean(),
  })
  .readonly();

const passTurnActionSchema = z
  .object({
    type: z.literal("passTurn"),
  })
  .readonly();

//subAction comes after a move action (which can also be "stand still")
const subActionSchema = z
  .discriminatedUnion("type", [
    waitActionSchema,
    attackActionSchema,
    abilityActionSchema,
    unloadWaitActionSchema,
    repairActionSchema,
    launchMissileActionSchema,
  ])
  .readonly();

const moveActionSchema = z
  .object({
    type: z.literal("move"),
    path: pathSchema,
    subAction: subActionSchema,
  })
  .readonly();

export const mainActionSchema = z
  .discriminatedUnion("type", [
    moveActionSchema,
    buildActionSchema,
    deleteActionSchema,
    // for DoR unload, unloading wouldn't be plainly (i.e. partially) allowed,
    // only as a subaction of move - Function
    unloadNoWaitActionSchema,
    coPowerActionSchema,
    passTurnActionSchema,
  ])
  .readonly();

export type MainAction = z.infer<typeof mainActionSchema>;
export type MainActionInput = z.input<typeof mainActionSchema>;
export type SubAction = z.infer<typeof subActionSchema>;
export type SubActionInput = z.input<typeof subActionSchema>;

export type BuildAction = z.infer<typeof buildActionSchema>;
export type DeleteAction = z.infer<typeof deleteActionSchema>;
export type MoveAction = z.infer<typeof moveActionSchema>;
export type WaitAction = z.infer<typeof waitActionSchema>;
export type AbilityAction = z.infer<typeof abilityActionSchema>;
export type LaunchMissileAction = z.infer<typeof launchMissileActionSchema>;
export type UnloadWaitAction = z.infer<typeof unloadWaitActionSchema>;
export type UnloadNoWaitAction = z.infer<typeof unloadNoWaitActionSchema>;
export type AttackAction = z.infer<typeof attackActionSchema>;
export type RepairAction = z.infer<typeof repairActionSchema>;
export type COPowerAction = z.infer<typeof coPowerActionSchema>;
export type PassTurnAction = z.infer<typeof passTurnActionSchema>;
