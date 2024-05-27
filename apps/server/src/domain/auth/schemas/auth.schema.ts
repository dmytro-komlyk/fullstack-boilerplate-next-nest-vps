import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4).max(12),
});

export const signUpSchema = loginSchema.extend({
  name: z.string(),
});

export const resetPassword = z.object({
  userId: z.string().min(1),
  token: z.string().min(1),
  password: z.string().min(4).max(12),
});

export const tokenSchema = z.object({
  accessToken: z.string().min(1),
  accessTokenExpires: z.number().min(1),
  refreshToken: z.string().min(1),
});

export const outputAuthSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
  token: z.string().min(1),
  accessToken: z.string().min(1),
  accessTokenExpires: z.number().min(1),
  refreshToken: z.string().min(1),
});

export type resetPassword = z.TypeOf<typeof resetPassword>;
export type loginSchema = z.TypeOf<typeof loginSchema>;
export type signUpSchema = z.TypeOf<typeof signUpSchema>;
export type tokenSchema = z.TypeOf<typeof tokenSchema>;
export type outputAuthSchema = z.TypeOf<typeof outputAuthSchema>;
