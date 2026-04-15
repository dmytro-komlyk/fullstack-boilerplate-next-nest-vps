import { handleAssistant } from '@package/ai';

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
    const targetLanguage = locale === 'uk' ? 'Ukrainian' : 'English';
    // onToken('⏳ Processing...\n');

    const result = await handleAssistant({
      prompt,
      history,
      isAdmin,
      language: targetLanguage,
    });

    const toolResults: any[] = [];
    let textOutput = '';

    for await (const part of result.fullStream) {
      if (part.type === 'text-delta') {
        textOutput += part.text;
      }

      if (part.type === 'tool-result') {
        toolResults.push({
          tool: part.toolName,
          result: part.output,
        });
      }
    }

    if (toolResults.length > 0) {
      const formatted = await handleAssistant({
        prompt: `
        You are a response formatter.

        STRICT RULES:
        - Use ONLY provided data
        - NO hallucination
        - NO explanations
        - SHORT answer
        - Use bullet points if list
        - Language: ${targetLanguage}

        User request:
        ${prompt}

        Tool results:
        ${JSON.stringify(toolResults)}
                `,
        history: [],
        isAdmin,
        language: targetLanguage,
      });

      for await (const t of formatted.textStream) {
        onToken(t);
      }

      onComplete();
      return;
    }

    if (textOutput.trim()) {
      onToken(textOutput);
    } else {
      onToken(locale === 'uk' ? 'Немає даних' : 'No data found');
    }

    onComplete();
  } catch (err) {
    console.error('STREAM ERROR:', err);
    onToken(locale === 'uk' ? '❌ Помилка AI' : '❌ AI Error');
    onComplete();
  }
}
