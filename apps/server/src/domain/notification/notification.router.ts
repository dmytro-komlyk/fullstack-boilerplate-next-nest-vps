import { z } from 'zod';

import { protectedProcedure, router } from '../trpc/trpc.server';
import {
  getNotificationsSchema,
  markAsReadSchema,
  outputNotificationSchema,
  outputNotificationsSchema,
} from './notification.schema';
import { getNotifications, markAllAsRead, markAsRead } from './notification.service';

export const notificationRouter = router({
  getAll: protectedProcedure
    .meta({
      openapi: {
        enabled: true,
        method: 'GET',
        path: '/notification.getAll',
        summary: 'Get user notifications',
        tags: ['notification'],
        protect: true,
      },
    })
    .input(getNotificationsSchema)
    .output(outputNotificationsSchema)
    .query(async ({ input, ctx }) => {
      const result = await getNotifications({ userId: ctx.user.id, filters: input });
      ctx.logger.log({ userId: ctx.user.id, path: 'notification.getAll' }, 'Fetched notifications');
      return result;
    }),

  markAsRead: protectedProcedure
    .meta({
      openapi: {
        enabled: true,
        method: 'POST',
        path: '/notification.markAsRead',
        summary: 'Mark a notification as read',
        tags: ['notification'],
        protect: true,
      },
    })
    .input(markAsReadSchema)
    .output(outputNotificationSchema.nullable())
    .mutation(async ({ input, ctx }) => {
      const result = await markAsRead({ userId: ctx.user.id, data: input });
      ctx.logger.log(
        { userId: ctx.user.id, notificationId: input.id, path: 'notification.markAsRead' },
        'Marked notification as read'
      );
      return result;
    }),

  markAllAsRead: protectedProcedure
    .meta({
      openapi: {
        enabled: true,
        method: 'POST',
        path: '/notification.markAllAsRead',
        summary: 'Mark all notifications as read',
        tags: ['notification'],
        protect: true,
      },
    })
    .input(z.void())
    .output(z.object({ count: z.number().int() }))
    .mutation(async ({ ctx }) => {
      const result = await markAllAsRead({ userId: ctx.user.id });
      ctx.logger.log(
        { userId: ctx.user.id, path: 'notification.markAllAsRead' },
        'Marked all notifications as read'
      );
      return result;
    }),
});
