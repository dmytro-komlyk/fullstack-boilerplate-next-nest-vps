import { runAgent } from '@package/ai/agent';

export async function createSubscriptionStream({
  prompt,
  history,
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
    const language = locale === 'uk' ? 'Ukrainian' : 'English';

    const result = await runAgent({
      prompt,
      history,
      isAdmin,
      language,
    });

    onToken(result);

    onComplete();
  } catch {
    onToken('❌ AI Error');
    onComplete();
  }
}
