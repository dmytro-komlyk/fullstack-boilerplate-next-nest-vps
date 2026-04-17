import { runAgent } from '@package/ai/agent';

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
  history: any[];
  isAdmin: boolean;
  locale: string;
  onStep: (step: {
    type: 'thinking' | 'tool_start' | 'tool_end';
    message: string;
    data?: any;
  }) => void;
  onToken: (token: string) => void;
  onComplete: () => void;
}) {
  try {
    const language = locale === 'uk' ? 'Ukrainian' : 'English';

    const result = await runAgent({
      prompt,
      history,
      isAdmin,
      language,
      onStep,
    });

    onToken(result);

    onComplete();
  } catch {
    onToken('❌ AI Error');
    onComplete();
  }
}
