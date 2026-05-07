import { z } from "zod";
import { passableTileSchema } from "./tile";
import { visibleUnitSchema } from "./unit";

const tileRowSchema = z.array(passableTileSchema).nonempty().max(99);

export const mapSchema = z.object({
  name: z.string(),
  tiles: z.array(tileRowSchema).nonempty().max(99),
  predeployedUnits: z.array(visibleUnitSchema),
});

export type CreatableMap = z.infer<typeof mapSchema>;
