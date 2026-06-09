import { initTRPC, TRPCError } from '@trpc/server';
import { OpenApiMeta } from 'trpc-to-openapi';

import type { Context } from './trpc.context';

const SENSITIVE_FIELDS = new Set(['password', 'token', 'secret', 'oldPassword', 'newPassword']);

const maskSensitiveData = (input: unknown): unknown => {
  if (typeof input !== 'object' || input === null) return input;
  const clean = structuredClone(input) as Record<string, unknown>;
  for (const field of SENSITIVE_FIELDS) {
    if (field in clean) clean[field] = '***';
  }
  return clean;
};

const trpc = initTRPC
  .meta<OpenApiMeta>()
  .context<Context>()
  .create({
    errorFormatter({ shape }) {
      return shape;
    },
    allowOutsideOfServer: true,
    isDev: process.env.NODE_ENV === 'development',
  });

const errorLoggingMiddleware = trpc.middleware(async (opts) => {
  const { next, path, ctx } = opts;

  try {
    const result = await next();

    if (!result.ok) {
      const { error } = result;
      const rawInput = await opts.getRawInput();

      ctx.logger.error(
        {
          error: { code: error.code, name: error.name },
          path,
          input: maskSensitiveData(rawInput),
        },
        error.message
      );
    }

    return result;
  } catch (cause) {
    ctx.logger.error(
      {
        path,
        cause,
        context: 'Critical middleware failure',
      },
      'Unexpected Error'
    );
    throw cause;
  }
});

export const procedure = trpc.procedure.use(errorLoggingMiddleware);
const enforceUserIsAuthed = trpc.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You need to log in to access this resource.',
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});
export const protectedProcedure = trpc.procedure
  .use(errorLoggingMiddleware)
  .use(enforceUserIsAuthed);
export const router = trpc.router;
export const createCallerFactory = trpc.createCallerFactory;
export const mergeRouters = trpc.mergeRouters;
