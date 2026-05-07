import { prisma } from '@package/prisma';
import type { z } from 'zod';

import type { getNotificationsSchema, markAsReadSchema } from './notification.schema';

type GetNotificationsInput = {
  userId: string;
  filters: z.infer<typeof getNotificationsSchema>;
};

type MarkAsReadInput = {
  userId: string;
  data: z.infer<typeof markAsReadSchema>;
};

type MarkAllAsReadInput = {
  userId: string;
};

export const getNotifications = async ({ userId, filters }: GetNotificationsInput) => {
  const where = {
    userId,
    ...(filters.onlyUnread ? { isRead: false } : {}),
  };

  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit,
    }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return { items, unreadCount };
};

export const markAsRead = async ({ userId, data }: MarkAsReadInput) => {
  const notification = await prisma.notification.findFirst({
    where: { id: data.id, userId },
  });

  if (!notification) {
    return null;
  }

  return prisma.notification.update({
    where: { id: data.id },
    data: { isRead: true },
  });
};

export const markAllAsRead = async ({ userId }: MarkAllAsReadInput) => {
  const { count } = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return { count };
};
