import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(4).max(12),
});

export const updateUserSchema = createUserSchema.extend({
  id: z.string().min(1),
});

export const outputUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1),
  token: z.string().min(1),
  accessToken: z.string().min(1),
  accessTokenExpires: z.number().min(1),
  refreshToken: z.string().min(1),
});

export type createUserSchema = z.TypeOf<typeof createUserSchema>;
export type updateUserSchema = z.TypeOf<typeof updateUserSchema>;
export type outputUserSchema = z.TypeOf<typeof outputUserSchema>;
