import { z } from 'zod';

export const planStepSchema = z.object({
  tool: z.string(),
  args: z.record(z.string(), z.any()).optional(),
});

export const planSchema = z.array(planStepSchema);

export type PlanStep = z.infer<typeof planStepSchema>;
