import { TRPCError } from '@trpc/server';
import { observable } from '@trpc/server/observable';

import { procedure, protectedProcedure, router } from '../trpc/trpc.server';
import { banUser, unbanUser } from '../users/user.commands';
import { promptSchema, toolSchema } from './ai.schema';
import { createSubscriptionStream } from './ai.service';
import { getAiHistory, saveAiMessage } from './ai-history.redis';

type StepContent = {
  type: 'thinking' | 'tool_start' | 'tool_end';
  message: string;
  data?: unknown;
};

type StreamEvent = { type: 'token'; content: string } | { type: 'step'; content: StepContent };

const extractStringArg = (args: Record<string, unknown>, key: string): string => {
  const value = args[key];
  if (typeof value !== 'string' || !value) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Invalid tool arguments: "${key}" must be a non-empty string`,
    });
  }
  return value;
};

export const aiRouter = router({
  askAdminAssistant: protectedProcedure.input(promptSchema).subscription(({ input, ctx }) => {
    return observable<StreamEvent>((emit) => {
      const run = async () => {
        const userId = ctx.user.id;
        const history = await getAiHistory(ctx.redis, userId);
        let fullResponse = '';

        createSubscriptionStream({
          ...input,
          history,
          isAdmin: true,
          onStep: (step) => emit.next({ type: 'step', content: step }),
          onToken: (token) => {
            fullResponse += token;
            emit.next({ type: 'token', content: token });
          },
          onComplete: async () => {
            await saveAiMessage(ctx.redis, userId, 'user', input.prompt);
            await saveAiMessage(ctx.redis, userId, 'assistant', fullResponse);
            emit.complete();
          },
        });
      };

      run().catch((err: unknown) => {
        ctx.logger.error({ err }, 'AI subscription error');
        emit.error(err);
      });
    });
  }),

  askPublicAssistant: procedure.input(promptSchema).subscription(({ input, ctx }) => {
    return observable<StreamEvent>((emit) => {
      const run = async () => {
        createSubscriptionStream({
          ...input,
          isAdmin: false,
          onStep: (step) => emit.next({ type: 'step', content: step }),
          onToken: (token) => emit.next({ type: 'token', content: token }),
          onComplete: () => emit.complete(),
        });
      };

      run().catch((err: unknown) => {
        ctx.logger.error({ err }, 'AI public subscription error');
        emit.error(err);
      });
    });
  }),

  confirmAction: protectedProcedure.input(toolSchema).mutation(async ({ input }) => {
    const { tool, args } = input;

    switch (tool) {
      case 'banUser':
        return await banUser({ userId: extractStringArg(args, 'userId') });
      case 'unbanUser':
        return await unbanUser({ userId: extractStringArg(args, 'userId') });
      default:
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Unknown tool' });
    }
  }),

  getHistory: protectedProcedure.query(async ({ ctx }) => {
    return getAiHistory(ctx.redis, ctx.user.id);
  }),
});
