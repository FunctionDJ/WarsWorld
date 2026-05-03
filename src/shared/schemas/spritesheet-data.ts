import type { SpritesheetData, SpritesheetFrameData } from "pixi.js";
import { z } from "zod";

const sizeSchema = z.strictObject({
  w: z.number(),
  h: z.number(),
}) satisfies z.ZodType<SpritesheetFrameData["sourceSize"]>;

const sizeAndPositionSchema = sizeSchema.extend({
  x: z.number(),
  y: z.number(),
}) satisfies z.ZodType<SpritesheetFrameData["frame"]>;

const frameSchema = z.strictObject({
  frame: sizeAndPositionSchema,
  rotated: z.boolean(),
  trimmed: z.boolean(),
  spriteSourceSize: sizeAndPositionSchema,
  sourceSize: sizeSchema,
}) satisfies z.ZodType<SpritesheetFrameData>;

export const spritesheetDataSchema = z.strictObject({
  frames: z.record(z.string(), frameSchema),
  animations: z.record(z.string(), z.array(z.string())).optional(),
  meta: z.object({
    scale: z.string().or(z.number()),
    image: z.string(),
  }),
}) satisfies z.ZodType<SpritesheetData>;
