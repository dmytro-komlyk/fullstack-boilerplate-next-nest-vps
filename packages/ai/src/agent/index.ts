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
}: {
  prompt: string;
  history: any[];
  isAdmin: boolean;
  language: string;
}) {
  const tools = getTools(isAdmin);

  let context = '';
  let steps = 0;
  const usedTools = new Set<string>();

  while (steps < MAX_STEPS) {
    steps++;

    console.log('\n--- AGENT STEP:', steps, '---');

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

      context += `
        ERROR:
        - Return valid JSON
        - No text outside JSON
        `;
      continue;
    }

    for (const json of jsonList) {
      console.log('PARSED:', json);

      if (json.type === 'final') {
        console.log('FINAL ANSWER');
        return json.answer;
      }

      if (json.type !== 'tool') continue;

      if (usedTools.has(json.tool)) {
        console.log('REDUNDANT TOOL CALL DETECTED:', json.tool);
        context += `
          [SYSTEM STOP]:
          - You already called the tool '${json.tool}'. 
          - The result you received is the ONLY data available.
          - If you asked for more items than returned, it means NO MORE items exist in the database.
          - STOP searching in other tools (like invites or alerts) unless the user specifically asked for them.
          - Use the data from CURRENT DATA CONTEXT and return "type": "final" immediately.
        `;
        continue;
      }

      const toolFn = tools[json.tool as keyof typeof tools];

      if (!toolFn || !toolFn.execute) {
        context += `\nERROR: Tool ${json.tool} not found`;
        continue;
      }

      try {
        const result = await toolFn.execute(json.args ?? {}, {
          toolCallId: '',
          messages: [],
        });

        usedTools.add(json.tool);

        console.log('TOOL RESULT:', result);

        context += `
            Tool: ${json.tool}
            Result: ${JSON.stringify(result)}
            `;
      } catch (e) {
        context += `\nERROR: Tool ${json.tool} failed`;
      }
    }

    context += `
      IMPORTANT:
      - Check if the requested quantity exists in the results above.
      - If results are empty or fewer than requested, explain this to the user.
      - RETURN FINAL NOW if you have gathered all information for the prompt.
      `;
  }

  return '❌ Failed to complete request';
}
