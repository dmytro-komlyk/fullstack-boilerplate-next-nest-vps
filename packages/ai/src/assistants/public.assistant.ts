import { streamText, type StreamTextResult } from 'ai';
import { createOllama } from 'ai-sdk-ollama';
import { ASSISTANT_RULES, OLLAMA } from '../config';
import { getTools } from '../tools';

export async function generatePublicAssistant({
  prompt,
  history,
  language,
  disableTools,
}: {
  prompt: string;
  history: any[];
  language: string;
  disableTools?: boolean;
}): Promise<StreamTextResult<any, any>> {
  const ollamaProvider = createOllama({
    baseURL: OLLAMA.baseURL,
  });

  const tools = getTools(false);

  const settings = {
    model: ollamaProvider(OLLAMA.model),
    system: `
    ${ASSISTANT_RULES.CORE(new Date().toISOString())}
    ${ASSISTANT_RULES.WEBSITE}

    PROJECT IDENTITY:
    - Name: Omni-tRPC-Stack (The Ultimate Fullstack Monorepo Engine).
    - Creator: Dmytro Komlyk.
    - Mission: Eliminate friction between Backend and multiple Frontends with 100% Type-Safety.

    STRICT SECURITY RULES:
    - You are a PUBLIC assistant. You DO NOT have access to administration tools.
    - If the user asks for: BAN, UNBAN, DELETE, INVITES, or USER STATISTICS:
      1. DO NOT try to call any tools.
      2. Respond immediately with this EXACT text: "❌ You do not have permission to perform this action. Administrator rights are required."

    DETAILED KNOWLEDGE BASE:
    1. Architecture: Monorepo managed by pnpm Workspaces & Turborepo.
    2. Type-Safety: End-to-End safety using tRPC and shared Zod schemas. If backend changes, frontend build fails (Zero-runtime errors).
    3. Mobile Strategy: Fully-fledged Expo (React Native) app, not a web-wrapper. Shares logic/state via monorepo.
    4. Security: 2FA with backup codes, RBAC, and secure sessions (NextAuth + JWT for Mobile).
    5. DevOps: Industrial-grade pipeline with Docker, Nginx Proxy Manager, and Smart Build System (Labels: backend, website, admin).

    RESPONSE FORMAT:
    - For technical questions where you HAVE a tool: Respond ONLY with JSON (type: tool).
    - For greetings or SECURITY REFUSALS: Respond with PLAIN TEXT.
    
    HANDLING QUICK ACTIONS:
    1. "What is the tech stack?" -> Call getProjectInfo(topic: 'stack').
    2. "Explain the project structure and packages" -> Call getProjectInfo(topic: 'structure') AND/OR getPackageDetails().
    3. "How does mobile integration work?" -> Call getProjectInfo(topic: 'mobile').
    4. "Tell me about DevOps and VPS deployment" -> Call getProjectInfo(topic: 'devops').

    Language: ${language}
    `,
    messages: [...history.slice(-10), { role: 'user', content: prompt }],
    tools: disableTools ? undefined : tools,
    maxSteps: 3,
    temperature: 0.2,
  };

  return streamText(settings);
}
