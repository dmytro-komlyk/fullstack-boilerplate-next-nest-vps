import { z } from 'zod';

export const notificationSeverity = z.enum(['INFO', 'SUCCESS', 'WARNING', 'ERROR', 'CRITICAL']);

export type NotificationSeverity = z.TypeOf<typeof notificationSeverity>;

export const getNotificationsSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  onlyUnread: z.boolean().default(false),
});

export const markAsReadSchema = z.object({
  id: z.string().uuid(),
});

export const outputNotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  message: z.string(),
  severity: notificationSeverity,
  isRead: z.boolean(),
  createdAt: z.date(),
});

export const outputNotificationsSchema = z.object({
  items: z.array(outputNotificationSchema),
  unreadCount: z.number().int(),
});
