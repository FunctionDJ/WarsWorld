import { z } from "zod";

const weatherSchema = z.union([
  z.literal("clear"),
  z.literal("snow"),
  z.literal("rain"),
  z.literal("sandstorm"),
]);

export type Weather = z.infer<typeof weatherSchema>;

export const weatherSettingSchema = weatherSchema.or(z.literal("random"));
