import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address").transform((e) => e.toLowerCase()),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required").max(100),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").transform((e) => e.toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
