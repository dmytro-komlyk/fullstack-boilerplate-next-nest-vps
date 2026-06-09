import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@package/prisma', () => ({
  prisma: {
    session: {
      create: vi.fn().mockResolvedValue({}),
    },
  },
}));

vi.mock('node:crypto', () => ({
  default: { randomUUID: vi.fn().mockReturnValue('mock-session-uuid') },
}));

import { prisma } from '@package/prisma';

import { createUserSession } from './session.helper';

const mockPrisma = prisma as unknown as {
  session: { create: ReturnType<typeof vi.fn> };
};

const refreshTokenExp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

describe('session.helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.session.create.mockResolvedValue({});
  });

  describe('createUserSession', () => {
    it('creates a web session with a new UUID token when origin is set', async () => {
      const result = await createUserSession({
        userId: 'user-1',
        refreshToken: 'refresh-token',
        refreshTokenExp,
        domain: { origin: 'http://localhost:3001', clientId: 'client-1', userAgent: 'Mozilla/5.0' },
      });

      expect(result.sessionToken).toBe('mock-session-uuid');
      expect(mockPrisma.session.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sessionToken: 'mock-session-uuid',
            userId: 'user-1',
            clientId: 'client-1',
            userAgent: 'Mozilla/5.0',
          }),
        })
      );
    });

    it('uses the refreshToken as sessionToken when origin is null (mobile)', async () => {
      const result = await createUserSession({
        userId: 'user-1',
        refreshToken: 'mobile-refresh-token',
        refreshTokenExp,
        domain: { origin: null, clientId: 'mobile-client', userAgent: null },
      });

      expect(result.sessionToken).toBe('mobile-refresh-token');
      expect(mockPrisma.session.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ sessionToken: 'mobile-refresh-token' }),
        })
      );
    });

    it('sets isTwoFactorVerified to false by default', async () => {
      await createUserSession({
        userId: 'user-1',
        refreshToken: 'refresh-token',
        refreshTokenExp,
        domain: { origin: 'http://localhost:3001', clientId: null, userAgent: null },
      });

      expect(mockPrisma.session.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isTwoFactorVerified: false }),
        })
      );
    });

    it('passes isTwoFactorVerified when explicitly set', async () => {
      await createUserSession({
        userId: 'user-1',
        refreshToken: 'refresh-token',
        refreshTokenExp,
        domain: { origin: 'http://localhost:3001', clientId: null, userAgent: null },
        isTwoFactorVerified: true,
      });

      expect(mockPrisma.session.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isTwoFactorVerified: true }),
        })
      );
    });
  });
});
