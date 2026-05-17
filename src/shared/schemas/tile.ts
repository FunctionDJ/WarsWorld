import { z } from "zod";
import { playerSlotForPropertiesSchema } from "./player-slot";
import { positionSchema } from "./position";

const axisConnectionsSchema = z.enum(["right-left", "top-bottom"]);

/** tile HP works only in ""whole numbers"" unlike the underworks of unit HP */
const tileHPSchema = z.number().int().min(1).max(20);

const oneWayConnectionsSchema = z.enum(["top", "right", "bottom", "left"]);

const twoWayConnectionsSchema = axisConnectionsSchema.or(
	z.enum(["top-right", "right-bottom", "bottom-left", "top-left"]),
);

const threeWayConnectionSchema = z.enum([
	"right-bottom-left",
	"top-right-bottom",
	"top-bottom-left",
	"top-right-left",
]);

const fourWayConnectionSchema = z.literal("top-right-bottom-left");

export const propertyTileSchema = z.object({
	type: z.enum(["base", "airport", "port", "hq", "lab", "commtower", "city"]),
	playerSlot: playerSlotForPropertiesSchema,
	hp: tileHPSchema,
});

const pipeSeamTileSchema = z.object({
	type: z.literal("pipeSeam"),
	variant: axisConnectionsSchema,
	hp: tileHPSchema,
});

const unusedSiloTileSchema = z.object({
	type: z.literal("unusedSilo"),
});

const simpleTileSchema = z.object({
	type: z.enum(["shoal", "sea", "forest", "mountain", "reef", "usedSilo"]),
});

const roadTileSchema = z.object({
	type: z.literal("road"),
	variant: twoWayConnectionsSchema.or(threeWayConnectionSchema).or(fourWayConnectionSchema),
});

const bridgeTileSchema = z.object({
	type: z.literal("bridge"),
	variant: axisConnectionsSchema,
});

const pipeTileSchema = z.object({
	type: z.literal("pipe"),
	variant: oneWayConnectionsSchema.or(twoWayConnectionsSchema),
});

const plainTileSchema = z.object({
	type: z.literal("plain"),
	variant: z.enum(["normal", "broken-pipe-right-left", "broken-pipe-top-bottom"]),
});

const riverTileSchema = z.object({
	type: z.literal("river"),
	// [improvement] rivers have MANY more variants with flow direction and all
	// the question is: do we want to support them for map creation?
	variant: twoWayConnectionsSchema.or(threeWayConnectionSchema).or(fourWayConnectionSchema),
});

export const tileSchema = z.discriminatedUnion("type", [
	propertyTileSchema,
	simpleTileSchema,
	unusedSiloTileSchema,
	roadTileSchema,
	bridgeTileSchema,
	pipeTileSchema,
	riverTileSchema,
	plainTileSchema,
	pipeSeamTileSchema,
]);

export type Tile = z.infer<typeof tileSchema>;

/**
 * Note: "broken pipe seam" does *not* currently have its own TileType
 *       and is considered to be a kind of `plains`.
 *
 * Note: `usedSilo` *does* have its own TileType distinct from `unusedSilo`.
 */
export type TileType = z.infer<typeof tileSchema>["type"];

export const positionedTileSchema = z.discriminatedUnion("type", [
	propertyTileSchema.extend({ position: positionSchema }),
	unusedSiloTileSchema.extend({ position: positionSchema }),
	pipeSeamTileSchema.extend({ position: positionSchema }),
]);

export type PositionedTile = z.infer<typeof positionedTileSchema>;
