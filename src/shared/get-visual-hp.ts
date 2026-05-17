import type { z } from "zod";
import type { hpSchema } from "./schemas/unit-schemas";

export const getVisualHP = (hp: z.infer<typeof hpSchema>): number =>
	Math.ceil(hp === "sonja-hidden" ? 100 : hp / 10);
