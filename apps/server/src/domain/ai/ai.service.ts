import { handleAssistant } from '@package/ai';
import { createPlan, executePlan, type PlanStep } from '@package/ai/planner';
import { getTools } from '@package/ai/tools';

export async function createSubscriptionStream({
  prompt,
  isAdmin,
  locale,
  onToken,
  onComplete,
}: {
  prompt: string;
  history: any[];
  isAdmin: boolean;
  locale: string;
  onToken: (token: string) => void;
  onComplete: () => void;
}) {
  try {
    const lang = locale === 'uk' ? 'Ukrainian' : 'English';

    // onToken('⏳ Processing...\n');

    // 🔥 1. PLAN
    let plan: PlanStep[] = [];

    if (isAdmin) {
      plan = await createPlan(prompt);
    }
    console.log('FINAL PLAN:', plan);
    let toolResults: any[] = [];

    if (plan.length > 0) {
      const tools = getTools(true);
      toolResults = await executePlan({ plan, tools });
    }

    console.log('TOOL RESULTS:', JSON.stringify(toolResults, null, 2));

    if (toolResults.length === 0) {
      onToken(lang === 'Ukrainian' ? 'Немає даних' : 'No data found');
      onComplete();
      return;
    }

    const final = await handleAssistant({
      prompt: `
      You are a response formatter.

      STRICT RULES:
      - DO NOT ignore data
      - ALWAYS produce an answer
      - DO NOT return empty response
      - DO NOT repeat question
      - NO hallucination
      - NO repetition

      FORMAT RULES:

      If result contains users:
      - output bullet list:
        • email (role)

      If result contains counts:
      - output:
        Кількість користувачів: X

      If result contains growth:
      - output:
        Всього користувачів: X
        Нових користувачів (24h): Y

      If multiple tools:
      - combine results into ONE answer

      Language: ${lang}

      User request:
      ${prompt}

      Data:
      ${JSON.stringify(toolResults, null, 2)}
      `,
      history: [],
      isAdmin,
      language: lang,
    });

    for await (const t of final.textStream) {
      onToken(t);
    }

    onComplete();
  } catch {
    onToken('❌ AI Error');
    onComplete();
  }
}
