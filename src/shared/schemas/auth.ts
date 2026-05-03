import { z } from "zod/v4";

export const passwordSchema = z
  .string()
  .min(4, "Password Needs to be at least 4 characters long.")
  .max(40, "Password exceeds 40 characters.");

export const loginSchema = z.object({
  name: z.string().min(1, "Name is empty."),
  // TODO: change in prod min from 4 to 8 because I love making passwords called test
  password: passwordSchema,
});

export const signUpSchema = loginSchema.extend({
  email: z.email(),
});

export type Login = z.infer<typeof loginSchema>;
export type SignUp = z.infer<typeof signUpSchema>;
