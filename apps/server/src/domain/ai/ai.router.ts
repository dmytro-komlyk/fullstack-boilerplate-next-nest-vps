import { TRPCError } from '@trpc/server';
import { observable } from '@trpc/server/observable';

import { procedure, protectedProcedure, router } from '../trpc/trpc.server';
import { banUser, unbanUser } from '../users/user.service';
import { promptSchema, toolSchema } from './ai.schema';
import { createSubscriptionStream } from './ai.service';
import { getAiHistory, saveAiMessage } from './ai-history.redis';

export const aiRouter = router({
  askAdminAssistant: protectedProcedure.input(promptSchema).subscription(({ input, ctx }) => {
    return observable<{ type: 'token' | 'step'; content: any }>((emit) => {
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

      run().catch((err) => {
        ctx.logger.error(err);
        emit.error(err);
      });
    });
  }),
  askPublicAssistant: procedure.input(promptSchema).subscription(({ input }) => {
    return observable<{ type: 'token' | 'step'; content: any }>((emit) => {
      createSubscriptionStream({
        ...input,
        isAdmin: false,
        onStep: (step) => emit.next({ type: 'step', content: step }),
        onToken: (token) => emit.next({ type: 'token', content: token }),
        onComplete: () => emit.complete(),
      });
    });
  }),
  confirmAction: protectedProcedure.input(toolSchema).mutation(async ({ input }) => {
    const { tool, args } = input;

    switch (tool) {
      case 'banUser':
        return await banUser({ userId: args.userId });
      case 'unbanUser':
        return await unbanUser({ userId: args.userId });
      // ... add other cases as needed
      default:
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Unknown tool' });
    }
  }),
  getHistory: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const history = await getAiHistory(ctx.redis, userId);
    return history;
  }),
});
