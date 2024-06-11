import type { AppRouter } from '@server/domain/trpc/trpc.router';
import { createTRPCReact } from '@trpc/react-query';

export const trpc = createTRPCReact<AppRouter>({});
