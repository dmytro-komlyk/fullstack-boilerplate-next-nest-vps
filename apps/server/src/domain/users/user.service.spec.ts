import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@package/prisma', () => ({
  prisma: {
    user: {
      count: vi.fn(),
      groupBy: vi.fn(),
      findUnique: vi.fn(),
    },
    session: {
      count: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    invite: {
      count: vi.fn(),
    },
  },
}));

import { prisma } from '@package/prisma';
import { TRPCError } from '@trpc/server';

import { findUser, getDashboardStats, getProfile } from './user.queries';

const mockPrisma = prisma as unknown as {
  user: {
    count: ReturnType<typeof vi.fn>;
    groupBy: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
  };
  session: {
    count: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    groupBy: ReturnType<typeof vi.fn>;
  };
  invite: { count: ReturnType<typeof vi.fn> };
};

describe('user.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('returns the correct stats shape', async () => {
      mockPrisma.user.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(10) // online
        .mockResolvedValueOnce(5) // newThisWeek
        .mockResolvedValueOnce(20); // newThisMonth

      mockPrisma.session.count
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(30); // active

      mockPrisma.invite.count
        .mockResolvedValueOnce(15) // total
        .mockResolvedValueOnce(10) // accepted
        .mockResolvedValueOnce(3) // pending
        .mockResolvedValueOnce(2); // expired

      mockPrisma.user.groupBy
        .mockResolvedValueOnce([{ role: 'USER', _count: { _all: 80 } }]) // byRole
        .mockResolvedValueOnce([{ status: 'ACTIVE', _count: { _all: 90 } }]); // byStatus

      mockPrisma.session.findMany.mockResolvedValueOnce([]); // recentSessions
      mockPrisma.session.groupBy.mockResolvedValueOnce([]); // userAgentGroups

      const result = await getDashboardStats();

      expect(result.users.total).toBe(100);
      expect(result.users.online).toBe(10);
      expect(result.users.newThisWeek).toBe(5);
      expect(result.users.newThisMonth).toBe(20);
      expect(result.users.byRole).toEqual([{ role: 'USER', count: 80 }]);
      expect(result.users.byStatus).toEqual([{ status: 'ACTIVE', count: 90 }]);
      expect(result.sessions.total).toBe(50);
      expect(result.sessions.active).toBe(30);
      expect(result.invites.total).toBe(15);
      expect(result.invites.accepted).toBe(10);
      expect(result.invites.pending).toBe(3);
      expect(result.invites.expired).toBe(2);
    });
  });

  describe('getProfile', () => {
    const profileUser = {
      id: 'user-1',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      nickName: 'johnd',
      avatarUrl: null,
      telegramChatId: null,
      slackWebhookUrl: null,
      discordWebhookUrl: null,
    };

    it('returns the user profile when found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(profileUser);

      const result = await getProfile({ userId: 'user-1' });

      expect(result).toEqual(profileUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-1' } })
      );
    });

    it('throws NOT_FOUND when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const err = await getProfile({ userId: 'missing' }).catch((e) => e);

      expect(err).toBeInstanceOf(TRPCError);
      expect(err.code).toBe('NOT_FOUND');
      expect(err.message).toBe('userNotFound');
    });
  });

  describe('findUser', () => {
    it('returns user summary when found', async () => {
      const summary = {
        id: 'user-1',
        email: 'user@example.com',
        role: 'USER',
        nickName: 'johnd',
        status: 'ACTIVE',
        lastActiveAt: new Date(),
      };
      mockPrisma.user.findUnique.mockResolvedValue(summary);

      const result = await findUser({ email: 'user@example.com' });

      expect(result.id).toBe('user-1');
      expect(result.email).toBe('user@example.com');
    });

    it('throws NOT_FOUND when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const err = await findUser({ email: 'ghost@example.com' }).catch((e) => e);

      expect(err).toBeInstanceOf(TRPCError);
      expect(err.code).toBe('NOT_FOUND');
    });
  });
});
