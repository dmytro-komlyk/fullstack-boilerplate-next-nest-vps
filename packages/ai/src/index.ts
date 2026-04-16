import { StreamTextResult } from 'ai';
import { generateAdminAssistant } from './assistants/admin.assistant';
import { generatePublicAssistant } from './assistants/public.assistant';

export async function handleAssistant({
  prompt,
  history,
  isAdmin,
  language,
  disableTools,
}: {
  prompt: string;
  history: any[];
  isAdmin: boolean;
  language: string;
  disableTools?: boolean;
}): Promise<StreamTextResult<any, any>> {
  if (!isAdmin) {
    return generatePublicAssistant({
      prompt,
      history,
      language,
    });
  }

  return generateAdminAssistant({
    prompt,
    history,
    language,
    ...(disableTools !== undefined && { disableTools }),
  });
}
