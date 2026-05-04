import { generateText } from 'ai';
import { createOllama } from 'ai-sdk-ollama';
import { OLLAMA } from '../config';
import { createPlannerPrompt } from './planner.prompt';
import { planSchema, PlanStep } from './planner.types';

const MAX_RETRIES = 2;

function extractJSON(text: string): string {
  const match = text.match(/\[[\s\S]*\]/);
  return match ? match[0] : '[]';
}

export async function createPlan(prompt: string): Promise<PlanStep[]> {
  const ollama = createOllama({ baseURL: OLLAMA.baseURL });

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await generateText({
        model: ollama(OLLAMA.model),
        temperature: 0,
        prompt: createPlannerPrompt(prompt),
      });

      const raw = extractJSON(res.text);

      const parsed = JSON.parse(raw);

      const validated = planSchema.parse(parsed);

      console.log('PLANNER RAW:', res.text);
      console.log('PLANNER PARSED:', validated);

      if (validated.length === 0) {
        return [];
      }

      return validated;
    } catch (err) {
      console.warn(`Planner attempt ${attempt} failed`);
    }
  }
  console.warn('Planner failed completely → returning empty plan');
  return [];
}

export { executePlan } from './planner.executor';
export type { PlanStep } from './planner.types';
