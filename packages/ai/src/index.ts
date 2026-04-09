import { StreamTextResult } from 'ai';
import { generateAdminAssistant } from './assistants/admin.assistant';
import { generatePublicAssistant } from './assistants/public.assistant';
import { detectIntent } from './router';

export async function handleAssistant({
  prompt,
  history,
  isAdmin,
  tools,
  language,
}: {
  prompt: string;
  history: any[];
  isAdmin: boolean;
  tools?: any;
  language: string;
}): Promise<StreamTextResult<any, any>> {
  const intent = detectIntent(prompt);

  if (!isAdmin && intent === 'PRIVATE') {
    return generatePublicAssistant({
      prompt: "I'm sorry, I cannot access private account data.",
      history,
      tools,
      language,
      intent,
    });
  }

  if (isAdmin) {
    return generateAdminAssistant({ prompt, history, tools, language, intent });
  }

  return generatePublicAssistant({ prompt, history, tools, language, intent });
}
