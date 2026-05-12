import { z } from "zod";
import { playerSlotForPropertiesSchema } from "./player-slot";
import { positionSchema } from "./position";

const basicUnitStatsSchema = z.object({
  hp: z.number().int().min(1).max(100),
  fuel: z.number().int().min(0).max(99),
});

export const withNoAmmoUnitStats = {
  stats: basicUnitStatsSchema,
} as const;

export const withAmmoUnitStats = {
  stats: basicUnitStatsSchema.extend({
    ammo: z.number().int().min(0),
  }),
} as const;

export const unitInMapSharedProperties = {
  playerSlot: playerSlotForPropertiesSchema,
  position: positionSchema,
  isReady: z.boolean(),
};

export const withHidden = {
  hidden: z.boolean(),
};

export const withCapturePoints = {
  currentCapturePoints: z.number().positive().optional(),
};

export const withTypeSchema = <T extends string>(
  input: T,
): z.ZodObject<{ type: z.ZodLiteral<T> }> =>
  z.object({
    type: z.literal(input),
  });
