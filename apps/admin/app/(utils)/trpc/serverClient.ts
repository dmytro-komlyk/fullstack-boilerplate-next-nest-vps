import {
  appRouter,
  createCallerFactory,
} from '@server/domain/trpc/trpc.router';

const createCaller = createCallerFactory(appRouter);
export const serverClient = createCaller;
