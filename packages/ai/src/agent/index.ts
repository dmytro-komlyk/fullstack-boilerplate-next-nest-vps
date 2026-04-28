import { handleAssistant } from '../';
import { getTools } from '../tools';
import { createAgentPrompt } from './agent.prompt';

const MAX_STEPS = 6;
const MAX_DATA_LENGTH = 1500;
export const DANGEROUS_TOOLS = ['banUser', 'unbanUser', 'deleteUser', 'unlockUser'] as const;

function truncateData(data: any, maxLength = MAX_DATA_LENGTH): string {
  const str = JSON.stringify(data);
  if (str.length > maxLength) {
    return `${str.substring(0, maxLength)}... [DATA TRUNCATED FOR BREVITY]`;
  }
  return str;
}

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
        results.push(JSON.parse(maybeJson.trim()));
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
  const lang = (AGENT_MESSAGES[language as Language] ? language : 'en') as Language;
  const t = AGENT_MESSAGES[lang];

  const tools = getTools(isAdmin);
  const usedTools = new Set<string>();

  const agentState: Record<string, any> = {};
  let executionLogs = '';
  let steps = 0;

  while (steps < MAX_STEPS) {
    steps++;

    console.log('\n--- AGENT STEP:', steps, '---');

    const context = `
      ### PREVIOUS STEPS LOG:
      ${executionLogs || 'No steps taken yet.'}

      ### GATHERED DATA (CURRENT STATE):
      ${
        Object.keys(agentState).length > 0
          ? Object.entries(agentState)
              .map(([t, d]) => `[${t}]: ${truncateData(d)}`)
              .join('\n')
          : 'No data gathered yet.'
      }
          `.trim();

    onStep?.({
      type: 'thinking',
      message: t.thinking(steps),
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

    if (jsonList.length === 0 && text.trim().length > 0) {
      console.log('PLAIN TEXT RESPONSE (NO JSON):', text);
      return text.trim();
    }

    if (jsonList.length === 0) {
      console.log('INVALID JSON:', text);
      executionLogs += `\nStep ${steps}: Received invalid JSON.`;
      continue;
    }

    const toolCalls = jsonList.filter((j) => j.type === 'tool');

    const unknownTool = toolCalls.find((call) => !tools[call.tool]);
    if (unknownTool) {
      console.log(`BLOCKED: Model tried to call unknown/admin tool: ${unknownTool.tool}`);
      return t.adminOnly;
    }

    if (!isAdmin) {
      const triesAdminTool = toolCalls.some((call) => DANGEROUS_TOOLS.includes(call.tool as any));
      if (triesAdminTool) {
        return t.noPermission;
      }
    }

    const hasDangerousTool = toolCalls.some((call) => DANGEROUS_TOOLS.includes(call.tool));

    const finalResponse = jsonList.find((j) => j.type === 'final');
    if (finalResponse && !hasDangerousTool) {
      console.log('FINAL ANSWER');
      return finalResponse.answer;
    }

    const hasInvalidArgs = toolCalls.some((call) =>
      Object.values(call.args || {}).some(
        (val) => val === 'user_not_found' || val === 'undefined' || val === 'null'
      )
    );

    if (hasInvalidArgs) {
      executionLogs += `\nStep ${steps}: [ERROR] You are using placeholder values like 'user_not_found'. You MUST provide a final answer stating the user does not exist.`;
      if (steps > 2) return t.userNotFound;
    }

    const repeatedTool = toolCalls.find((call) => usedTools.has(call.tool));
    if (repeatedTool) {
      executionLogs += `\nStep ${steps}: [CRITICAL ERROR] You attempted to call "${repeatedTool.tool}" again. 
      This is FORBIDDEN. You already have data for this tool in "GATHERED DATA". 
      STOP retrying and provide a final answer NOW.`;

      console.log(`Loop detected for tool: ${repeatedTool.tool}`);
      continue;
    }

    if (toolCalls.length === 0) continue;

    const results = await Promise.all(
      toolCalls.map(async (json) => {
        // If the tool is in the dangerous list, we ask for confirmation instead of executing it
        const isDangerous = DANGEROUS_TOOLS.includes(json.tool);

        if (isDangerous) {
          return {
            type: 'confirmation' as const,
            tool: json.tool,
            args: json.args,
          };
        }
        //
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

        onStep?.({
          type: 'tool_start',
          message: t.calling(json.tool),
          data: json.args,
        });

        try {
          const result = await toolFn.execute(json.args ?? {}, {
            toolCallId: '',
            messages: [],
          });
          usedTools.add(json.tool);

          onStep?.({
            type: 'tool_end',
            message: t.received(json.tool),
            data: result,
          });
          return { tool: json.tool, result };
        } catch (e) {
          return { tool: json.tool, error: 'Execution failed' };
        }
      })
    );

    // If any of the results is a confirmation request, we stop the agent and return that request
    results.forEach((res) => {
      if (typeof res === 'object' && res !== null) {
        if ('result' in res) {
          agentState[res.tool] = res.result;
          executionLogs += ` | [${res.tool}]: Success (Data received)`;
        } else if ('error' in res) {
          executionLogs += ` | Error in ${res.tool}: ${res.error}`;
        } else if ('type' in res && res.type === 'confirmation') {
          executionLogs += ` | Action ${res.tool} is waiting for manual confirmation.`;
        }
      } else {
        executionLogs += ` | Info: ${res}`;
      }
    });

    const confirmationRequest = results.find(
      (res) =>
        typeof res === 'object' && res !== null && 'type' in res && res.type === 'confirmation'
    );

    if (confirmationRequest) {
      if (
        !confirmationRequest.args.userId ||
        confirmationRequest.args.userId === 'user_not_found'
      ) {
        executionLogs += `\nStep ${steps}: Error - Invalid userId in confirmation.`;
        continue;
      }
      console.log('STOPPING FOR CONFIRMATION:', confirmationRequest);
      return confirmationRequest;
    }
    //

    executionLogs += `\nStep ${steps}: Executed [${toolCalls.map((c) => c.tool).join(', ')}]`;
  }

  return t.maxSteps;
}
