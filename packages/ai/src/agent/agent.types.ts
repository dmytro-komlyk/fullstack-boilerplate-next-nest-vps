export type AgentStep =
  | { type: 'tool'; tool: string; args?: any }
  | { type: 'final'; answer: string };
