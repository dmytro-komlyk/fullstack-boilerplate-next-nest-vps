import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@package/prisma', () => ({
  prisma: {
    notification: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import { prisma } from '@package/prisma';

import { getNotifications, markAllAsRead, markAsRead } from './notification.service';

const mockPrisma = prisma as unknown as {
  notification: {
    findMany: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
};

describe('notification.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('returns items and unreadCount', async () => {
      const items = [{ id: '1', isRead: false }];
      mockPrisma.notification.findMany.mockResolvedValue(items);
      mockPrisma.notification.count.mockResolvedValue(1);

      const result = await getNotifications({
        userId: 'user-1',
        filters: { onlyUnread: false, limit: 10 },
      });

      expect(result).toEqual({ items, unreadCount: 1 });
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
    });

    it('applies onlyUnread filter', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(0);

      await getNotifications({
        userId: 'user-1',
        filters: { onlyUnread: true, limit: 5 },
      });

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRead: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
    });
  });

  describe('markAsRead', () => {
    it('returns null when notification not found', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue(null);

      const result = await markAsRead({ userId: 'user-1', data: { id: 'notif-1' } });

      expect(result).toBeNull();
      expect(mockPrisma.notification.update).not.toHaveBeenCalled();
    });

    it('updates and returns notification when found', async () => {
      const notification = { id: 'notif-1', userId: 'user-1', isRead: false };
      const updated = { ...notification, isRead: true };
      mockPrisma.notification.findFirst.mockResolvedValue(notification);
      mockPrisma.notification.update.mockResolvedValue(updated);

      const result = await markAsRead({ userId: 'user-1', data: { id: 'notif-1' } });

      expect(result).toEqual(updated);
      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { isRead: true },
      });
    });
  });

  describe('markAllAsRead', () => {
    it('returns count of updated notifications', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 3 });

      const result = await markAllAsRead({ userId: 'user-1' });

      expect(result).toEqual({ count: 3 });
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRead: false },
        data: { isRead: true },
      });
    });
  });
});
