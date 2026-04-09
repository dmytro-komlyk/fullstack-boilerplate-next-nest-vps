import { streamText, StreamTextResult } from 'ai';
import { createOllama } from 'ollama-ai-provider-v2';
import { ASSISTANT_RULES, OLLAMA } from '../config';

export async function generateAdminAssistant({
  prompt,
  history,
  tools,
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
    ${ASSISTANT_RULES.ADMIN}

    ### LANGUAGE (CRITICAL)
    - You MUST respond ONLY in ${language}
    - DO NOT mix languages
    - Technical values MUST stay unchanged

    ### INTENT: ${intent}
    `;

  return streamText({
    model: ollamaProvider(OLLAMA.model),
    system,
    messages: [...history.slice(-10), { role: 'user', content: prompt }],
    tools,
    toolChoice: intent === 'GENERAL' ? 'none' : 'required',
    temperature: 0.3,
  });
}
