import { PlanStep } from './planner.types';

export async function executePlan({ plan, tools }: { plan: PlanStep[]; tools: any }) {
  const results = [];

  for (const step of plan) {
    const toolFn = tools[step.tool];

    if (!toolFn) {
      results.push({
        tool: step.tool,
        error: 'UNKNOWN_TOOL',
      });
      continue;
    }

    try {
      const res = await toolFn.execute(step.args ?? {});

      results.push({
        tool: step.tool,
        result: res,
      });
    } catch (e) {
      results.push({
        tool: step.tool,
        error: 'EXECUTION_FAILED',
      });
    }
  }

  return results;
}
