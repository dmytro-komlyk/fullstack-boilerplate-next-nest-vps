import { protectedProcedure, router } from '../trpc/trpc.server';
import { outputDashboardStatsSchema } from './user.schema';
import { getDashboardStats } from './user.service';

export const userRouter = router({
  getStats: protectedProcedure
    .meta({
      openapi: {
        enabled: true,
        method: 'GET',
        path: '/dashboard.stats',
        summary: 'Get dashboard statistics',
        tags: ['dashboard'],
        protect: true,
      },
    })
    .output(outputDashboardStatsSchema)
    .query(async ({ ctx }) => {
      const response = await getDashboardStats();
      ctx.logger.log({ userId: ctx.user.id, path: 'user.getStats' }, 'Dashboard stats fetched');
      return response;
    }),
});
