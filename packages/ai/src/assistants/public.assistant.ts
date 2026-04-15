import { streamText, StreamTextResult } from 'ai';
import { createOllama } from 'ai-sdk-ollama';
import { ASSISTANT_RULES, OLLAMA } from '../config';
import { getTools } from '../tools';

export async function generatePublicAssistant({
  prompt,
  history,
  language,
}: {
  prompt: string;
  history: any[];
  language: string;
}): Promise<StreamTextResult<any, any>> {
  const ollamaProvider = createOllama({ baseURL: OLLAMA.baseURL });

  return streamText({
    model: ollamaProvider(OLLAMA.model),
    system: `
    ${ASSISTANT_RULES.CORE(new Date().toISOString())}
    ${ASSISTANT_RULES.WEBSITE}

    STRICT:
    - NO tools
    - NO admin simulation
    - If restricted → ONLY say:
    "❌ You do not have permission to perform this action."

    Language: ${language}
        `,
    messages: [...history.slice(-10), { role: 'user', content: prompt }],
    tools: getTools(false),
    toolChoice: 'auto',
    temperature: 0.7,
  });
}
