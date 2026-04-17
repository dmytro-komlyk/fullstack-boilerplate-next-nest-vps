import { observable } from '@trpc/server/observable';

import { procedure, router } from '../trpc/trpc.server';
import { promptSchema } from './ai.schema';
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
});
