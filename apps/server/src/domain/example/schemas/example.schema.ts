import { z } from 'zod';

export const createExampleSchema = z.object({
  text: z.string().min(1),
});

export const updateExampleSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
});

export const outputExampleSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
});

export type createExampleSchema = z.TypeOf<typeof createExampleSchema>;
export type updateExampleSchema = z.TypeOf<typeof updateExampleSchema>;
export type outputExampleSchema = z.TypeOf<typeof outputExampleSchema>;
