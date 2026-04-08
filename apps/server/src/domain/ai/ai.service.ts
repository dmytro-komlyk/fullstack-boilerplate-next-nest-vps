import { generateAssistantStream } from '@package/ai';

import { createTools } from './tools';

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
    const tools = createTools(isAdmin);

    const languageNames: Record<string, string> = {
      ru: 'Russian',
      en: 'English',
      uk: 'Ukrainian',
    };
    const targetLanguage = languageNames[locale] || 'English';

    const result = await generateAssistantStream({ prompt, history, isAdmin, tools, locale });

    let lastToolResult = '';
    let hasActualText = false;

    for await (const chunk of result.fullStream) {
      if (chunk.type === 'text-delta') {
        const token = (chunk as any).textDelta || (chunk as any).text || '';
        if (token.trim().length > 0) {
          hasActualText = true;
          onToken(token);
        }
      }

      if (chunk.type === 'tool-result') {
        const output = (chunk as any).output || (chunk as any).result;
        lastToolResult = typeof output === 'string' ? output : JSON.stringify(output);
      }
    }

    if (lastToolResult && !hasActualText) {
      console.log("🔄 The model remained silent. I'm initiating a forced response...");

      const followUp = await generateAssistantStream({
        prompt: `
          DATABASE DATA: ${lastToolResult}
          USER QUESTION: ${prompt}
          
          TASK: Provide a direct answer based ONLY on the RAW DATABASE DATA above.
          - If the data contains specific users, list them with bullet points.
          - If the data contains only counts or stats, report only those stats.
          - **FORBIDDEN**: Do not invent examples or placeholder data.
          - **FORBIDDEN**: Do not add meta-notes or explanations of your internal instructions.
          - Language: ${targetLanguage}.
        `,
        history: [],
        isAdmin,
        tools: undefined,
        locale,
      });

      for await (const textPart of followUp.textStream) {
        onToken(textPart);
      }
    }

    onComplete();
  } catch (err) {
    console.error('STREAM ERROR:', err);
    onToken('Error');
    onComplete();
  }
}
