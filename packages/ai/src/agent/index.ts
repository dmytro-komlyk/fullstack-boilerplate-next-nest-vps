import { handleAssistant } from '../';
import { getTools } from '../tools';
import { createAgentPrompt } from './agent.prompt';

const MAX_STEPS = 10;

function extractAllJSON(text: string): any[] {
  const sanitized = text
    .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ')
    .replace(/\r/g, '')
    .trim();

  const results = [];

  let startIdx = sanitized.indexOf('{');
  while (startIdx !== -1) {
    let depth = 0;
    let endIdx = -1;

    for (let i = startIdx; i < sanitized.length; i++) {
      if (sanitized[i] === '{') depth++;
      if (sanitized[i] === '}') depth--;

      if (depth === 0) {
        endIdx = i;
        break;
      }
    }

    if (endIdx !== -1) {
      const maybeJson = sanitized.substring(startIdx, endIdx + 1);
      try {
        results.push(JSON.parse(maybeJson));
      } catch (e) {
        console.error('FAILED TO PARSE JSON CHUNK:', JSON.stringify(maybeJson));
      }
      startIdx = sanitized.indexOf('{', endIdx + 1);
    } else {
      break;
    }
  }

  return results;
}

export async function runAgent({
  prompt,
  history,
  isAdmin,
  language,
  onStep,
}: {
  prompt: string;
  history: any[];
  isAdmin: boolean;
  language: string;
  onStep?: (step: {
    type: 'thinking' | 'tool_start' | 'tool_end';
    message: string;
    data?: any;
  }) => void;
}) {
  const tools = getTools(isAdmin);
  let context = '';
  let steps = 0;
  const usedTools = new Set<string>();

  while (steps < MAX_STEPS) {
    steps++;

    console.log('\n--- AGENT STEP:', steps, '---');

    onStep?.({
      type: 'thinking',
      message: language === 'uk' ? `Розмірковую (крок ${steps})...` : `Thinking (step ${steps})...`,
    });

    const res = await handleAssistant({
      prompt: createAgentPrompt({
        prompt,
        context,
        history,
        usedTools: Array.from(usedTools),
        language,
      }),
      history: [],
      isAdmin,
      language,
      disableTools: true,
    });

    let text = '';

    for await (const t of res.textStream) {
      text += t;
    }

    console.log('RAW LLM:', text);
    const jsonList = extractAllJSON(text);

    if (jsonList.length === 0) {
      console.log('INVALID JSON:', text);

      context += `\nERROR: No valid JSON found. Please return tool calls or final answer in JSON.`;
      continue;
    }

    const finalResponse = jsonList.find((j) => j.type === 'final');
    if (finalResponse) {
      console.log('FINAL ANSWER');
      return finalResponse.answer;
    }

    const toolCalls = jsonList.filter((j) => j.type === 'tool');

    if (toolCalls.length === 0) continue;

    toolCalls.forEach((call) => {
      onStep?.({
        type: 'tool_start',
        message: language === 'uk' ? `Викликаю: ${call.tool}` : `Calling tool: ${call.tool}`,
        data: call.args,
      });
    });

    const results = await Promise.all(
      toolCalls.map(async (json) => {
        if (usedTools.has(json.tool)) {
          return `[TERMINATE]: You already called '${json.tool}'. 
          The database has NO MORE data for this tool. 
          If you requested a large 'limit' but got few results, it means the database is EXHAUSTED. 
          STOP calling this tool immediately. 
          Do not try to find more items by calling other tools or guessing IDs. 
          Provide a final answer with the data you already have.`;
        }

        const toolFn = tools[json.tool as keyof typeof tools];
        if (!toolFn || !toolFn.execute) {
          return `Error: Tool ${json.tool} not found.`;
        }

        try {
          const result = await toolFn.execute(json.args ?? {}, {
            toolCallId: '',
            messages: [],
          });
          usedTools.add(json.tool);
          onStep?.({
            type: 'tool_end',
            message:
              language === 'uk'
                ? `Дані від ${json.tool} отримано`
                : `Data from ${json.tool} received`,
            data: result,
          });
          return { tool: json.tool, result };
        } catch (e) {
          return `Error: Tool ${json.tool} failed to execute.`;
        }
      })
    );

    context += `\n--- STEP ${steps} DATA RECEIVED ---`;
    results.forEach((res) => {
      if (typeof res === 'string') {
        context += `\n${res}`;
      } else {
        context += `\nSUCCESS: Tool ${res.tool} execution finished. Data: ${JSON.stringify(res.result)}`;
      }
    });

    context += `\n[SYSTEM]: All requested tools for Step ${steps} have been executed. Compare "limit" vs "actual results". If actual results < limit, it means NO MORE DATA. Do not retry.`;

    context += `
      \nIMPORTANT:
      - You just received data from multiple tools.
      - If this is enough to answer the USER QUESTION, return "type": "final" now.
      - Don't repeat successful tool calls.
    `;
  }

  return '❌ Failed to complete request (Max steps reached)';
}
