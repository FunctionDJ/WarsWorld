import { z } from "zod";
import { playerSlotForPropertiesSchema } from "./player-slot";
import { axisConnectionsSchema, variableTileSchema } from "./variable-tiles";

const propertyTileSchema = z.object({
  type: z.enum(["base", "airport", "port", "hq", "lab", "commtower", "city"]),
  playerSlot: playerSlotForPropertiesSchema,
});

export type PropertyTile = z.infer<typeof propertyTileSchema>;
export type PropertyTileType = z.infer<typeof propertyTileSchema>["type"];

export const pipeSeamTileSchema = z.object({
  type: z.literal("pipeSeam"),
  variant: axisConnectionsSchema,
  hp: z.number().int().min(1).max(100),
});

export type PipeSeamTile = z.infer<typeof pipeSeamTileSchema>;

const unusedSiloTileSchema = z
  .object({
    type: z.literal("unusedSilo"),
  })
  .readonly();
export type UnusedSiloTile = z.infer<typeof unusedSiloTileSchema>;
export type UnusedSiloTileType = z.infer<typeof unusedSiloTileSchema>["type"];

const simpleTileSchema = z
  .object({
    type: z.enum(["shoal", "sea", "forest", "mountain", "reef", "usedSilo"]),
  })
  .or(unusedSiloTileSchema);

export const passableTileSchema = z.discriminatedUnion("type", [
  propertyTileSchema,
  ...simpleTileSchema.options,
  ...variableTileSchema.options,
]);

export type PassableTile = z.infer<typeof passableTileSchema>;

/**
 * Note: "broken pipe seam" does *not* currently have its own TileType
 *       and is considered to be a kind of `plains`.
 *
 * Note: `usedSilo` *does* have its own TileType distinct from `unusedSilo`.
 */
export type TileType = z.infer<typeof passableTileSchema>["type"];
