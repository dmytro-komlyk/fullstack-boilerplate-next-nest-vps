import { protectedProcedure, router } from '../trpc/trpc.server';
import {
  outputDashboardStatsSchema,
  outputUserProfileSchema,
  updateContactsSchema,
  updateProfileSchema,
} from './user.schema';
import { getDashboardStats, getProfile, updateContacts, updateProfile } from './user.service';

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

  getProfile: protectedProcedure
    .meta({
      openapi: {
        enabled: true,
        method: 'GET',
        path: '/user.getProfile',
        summary: 'Get current user profile',
        tags: ['user'],
        protect: true,
      },
    })
    .output(outputUserProfileSchema)
    .query(async ({ ctx }) => {
      const response = await getProfile({ userId: ctx.user.id });
      ctx.logger.log({ userId: ctx.user.id, path: 'user.getProfile' }, 'Profile fetched');
      return response;
    }),

  updateProfile: protectedProcedure
    .meta({
      openapi: {
        enabled: true,
        method: 'POST',
        path: '/user.updateProfile',
        summary: 'Update user profile',
        tags: ['user'],
        protect: true,
      },
    })
    .input(updateProfileSchema)
    .output(outputUserProfileSchema)
    .mutation(async ({ input, ctx }) => {
      const response = await updateProfile({ userId: ctx.user.id, data: input });
      ctx.logger.log({ userId: ctx.user.id, path: 'user.updateProfile' }, 'Profile updated');
      return response;
    }),

  updateContacts: protectedProcedure
    .meta({
      openapi: {
        enabled: true,
        method: 'POST',
        path: '/user.updateContacts',
        summary: 'Update user social contact integrations',
        tags: ['user'],
        protect: true,
      },
    })
    .input(updateContactsSchema)
    .output(outputUserProfileSchema)
    .mutation(async ({ input, ctx }) => {
      const response = await updateContacts({ userId: ctx.user.id, data: input });
      ctx.logger.log({ userId: ctx.user.id, path: 'user.updateContacts' }, 'Contacts updated');
      return response;
    }),
});
