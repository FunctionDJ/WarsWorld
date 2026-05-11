import { z } from "zod";

export const axisConnectionsSchema = z.enum(["right-left", "top-bottom"]);

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

const roadTileSchema = z.object({
  category: z.literal("variable"),
  type: z.literal("road"),
  variant: twoWayConnectionsSchema.or(threeWayConnectionSchema).or(fourWayConnectionSchema),
});

const bridgeTileSchema = z.object({
  category: z.literal("variable"),
  type: z.literal("bridge"),
  variant: axisConnectionsSchema,
});

const pipeTileSchema = z.object({
  category: z.literal("variable"),
  type: z.literal("pipe"),
  variant: oneWayConnectionsSchema.or(twoWayConnectionsSchema),
});

const plainTileSchema = z.object({
  category: z.literal("variable"),
  type: z.literal("plain"),
  variant: z.enum(["normal", "broken-pipe-right-left", "broken-pipe-top-bottom"]),
});

const riverTileSchema = z.object({
  category: z.literal("variable"),
  type: z.literal("river"),
  // TODO rivers have MANY more variants with flow direction and all
  // the question is: do we want to support them for map creation?
  variant: twoWayConnectionsSchema.or(threeWayConnectionSchema).or(fourWayConnectionSchema),
});

export const variableTileSchema = z.discriminatedUnion("type", [
  roadTileSchema,
  bridgeTileSchema,
  pipeTileSchema,
  riverTileSchema,
  plainTileSchema,
]);
