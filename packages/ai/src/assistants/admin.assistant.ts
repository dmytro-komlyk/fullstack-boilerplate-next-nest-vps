import { streamText, type StreamTextResult } from 'ai';
import { createOllama } from 'ai-sdk-ollama';
import { ASSISTANT_RULES, OLLAMA } from '../config';
import { getTools } from '../tools';

function filterTools(prompt: string, tools: any) {
  const p = prompt.toLowerCase();

  if (p.includes('csv') || p.includes('export')) {
    return { exportUsersToCSV: tools.exportUsersToCSV };
  }

  if (p.includes('stat') || p.includes('growth')) {
    return {
      getUserCounts: tools.getUserCounts,
      getGrowthRate: tools.getGrowthRate,
      getRoleDistribution: tools.getRoleDistribution,
    };
  }

  if (p.includes('admin')) {
    return {
      getAdminList: tools.getAdminList,
    };
  }

  return tools;
}

export async function generateAdminAssistant({
  prompt,
  history,
  language,
}: {
  prompt: string;
  history: any[];
  language: string;
}): Promise<StreamTextResult<any, any>> {
  const ollamaProvider = createOllama({
    baseURL: OLLAMA.baseURL,
  });

  const tools = getTools(true);
  const filteredTools = filterTools(prompt, tools);

  const settings = {
    model: ollamaProvider(OLLAMA.model),
    system: `
    ${ASSISTANT_RULES.CORE(new Date().toISOString())}
    ${ASSISTANT_RULES.ADMIN}

    CRITICAL:
    - If tool exists → ALWAYS call tool
    - DO NOT answer manually if tool exists
    - DO NOT explain actions
    - DO NOT repeat data
    - ONLY final answer

    Language: ${language}
        `,
    messages: [...history.slice(-10), { role: 'user', content: prompt }],
    tools: filteredTools,
    maxSteps: 3,
    temperature: 0.1,
  };

  return streamText(settings);
}
