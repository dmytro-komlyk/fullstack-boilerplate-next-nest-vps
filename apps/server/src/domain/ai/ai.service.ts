import { runAgent } from '@package/ai/agent';

type StepEvent = {
  type: 'thinking' | 'tool_start' | 'tool_end';
  message: string;
  data?: unknown;
};

type HistoryMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export async function createSubscriptionStream({
  prompt,
  history,
  isAdmin,
  locale,
  onStep,
  onToken,
  onComplete,
}: {
  prompt: string;
  history: HistoryMessage[];
  isAdmin: boolean;
  locale: string;
  onStep: (step: StepEvent) => void;
  onToken: (token: string) => void;
  onComplete: () => void;
}) {
  try {
    const language = locale === 'uk' ? 'Ukrainian' : 'English';

    const result = await runAgent({ prompt, history, isAdmin, language, onStep });

    onToken(result);
    onComplete();
  } catch {
    onToken('❌ AI Error');
    onComplete();
  }
}
