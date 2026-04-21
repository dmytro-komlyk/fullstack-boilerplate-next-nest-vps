import { DANGEROUS_TOOLS } from '@package/ai/agent';
import { z } from 'zod';

export const promptSchema = z.object({
  prompt: z.string(),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
  locale: z.string().optional().default('ru'),
});

export const toolSchema = z.object({
  tool: z.enum(DANGEROUS_TOOLS),
  args: z.record(z.string(), z.any()),
});
