import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@package/prisma', () => ({
  prisma: {
    user: {
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    session: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    invite: {
      count: vi.fn(),
    },
  },
}));

import { prisma } from '@package/prisma';

import { getDashboardStats } from './user.service';

const mockPrisma = prisma as unknown as {
  user: { count: ReturnType<typeof vi.fn>; groupBy: ReturnType<typeof vi.fn> };
  session: { count: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> };
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

      mockPrisma.session.findMany
        .mockResolvedValueOnce([]) // recentSessions
        .mockResolvedValueOnce([]); // allUserAgents

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
});
