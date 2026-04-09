import { streamText, StreamTextResult } from 'ai';
import { createOllama } from 'ollama-ai-provider-v2';
import { ASSISTANT_RULES, OLLAMA } from '../config';

export async function generatePublicAssistant({
  prompt,
  history,
  language,
  intent,
}: {
  prompt: string;
  history: any[];
  tools?: any;
  language: string;
  intent: string;
}): Promise<StreamTextResult<any, any>> {
  const ollamaProvider = createOllama({
    baseURL: OLLAMA.baseURL,
  });

  const now = new Date().toISOString();

  const system = `
    ${ASSISTANT_RULES.CORE(now)}
    ${ASSISTANT_RULES.WEBSITE}

    ### LANGUAGE (CRITICAL)
    - You MUST respond ONLY in ${language}
    - DO NOT mix languages

    ### INTENT: ${intent}
    `;

  return streamText({
    model: ollamaProvider(OLLAMA.model),
    system,
    messages: [...history.slice(-10), { role: 'user', content: prompt }],
    toolChoice: 'none',
    temperature: 0.7,
  });
}
