import { TRPCError } from '@trpc/server';
import { observable } from '@trpc/server/observable';

import { procedure, protectedProcedure, router } from '../trpc/trpc.server';
import { banUser, unbanUser } from '../users/user.service';
import { promptSchema, toolSchema } from './ai.schema';
import { createSubscriptionStream } from './ai.service';

export const aiRouter = router({
  askAdminAssistant: procedure.input(promptSchema).subscription(({ input }) => {
    return observable<{ type: 'token' | 'step'; content: any }>((emit) => {
      createSubscriptionStream({
        ...input,
        isAdmin: true,
        onStep: (step) => emit.next({ type: 'step', content: step }),
        onToken: (token) => emit.next({ type: 'token', content: token }),
        onComplete: () => emit.complete(),
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
});
