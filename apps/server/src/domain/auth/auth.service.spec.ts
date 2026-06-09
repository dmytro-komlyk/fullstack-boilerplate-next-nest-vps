import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@package/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    session: {
      create: vi.fn(),
    },
    verificationToken: {
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
    token: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  compare: vi.fn(),
  hash: vi.fn(),
}));

vi.mock('./jwt.service', () => ({
  generateBackendTokens: vi.fn(),
  verifyToken: vi.fn(),
}));

vi.mock('@package/i18n', () => ({
  getEmailTranslations: vi.fn().mockResolvedValue({ subject: 'Test' }),
}));

vi.mock('../../utils/nodemailer/sendEmail', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from '@package/prisma';
import { compare } from 'bcryptjs';

import { generateBackendTokens } from './jwt.service';
import { signIn, updateAccessBackendToken } from './sign-in.service';

const mockPrisma = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  session: { create: ReturnType<typeof vi.fn> };
  verificationToken: {
    deleteMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
};

const mockCompare = compare as ReturnType<typeof vi.fn>;
const mockGenerateBackendTokens = generateBackendTokens as ReturnType<typeof vi.fn>;

const domain = {
  host: null,
  origin: 'http://localhost:3001',
  userAgent: 'test-agent',
  clientId: 'client-1',
  locale: 'en',
};

const baseUser = {
  id: 'user-1',
  email: 'test@example.com',
  password: 'hashed-password',
  role: 'USER',
  status: 'ACTIVE',
  emailVerified: new Date(),
  isTwoFactorEnabled: false,
  twoFactorSetupPending: false,
  forcePasswordChange: false,
  nickName: 'tester',
  avatarUrl: null,
  failedLoginAttempts: 0,
  lockedUntil: null,
  accounts: [],
};

const backendTokens = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  accessTokenExp: new Date(),
  refreshTokenExp: new Date(),
};

describe('auth.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.user.update.mockResolvedValue(baseUser);
    mockPrisma.session.create.mockResolvedValue({});
  });

  describe('signIn', () => {
    it('throws UNAUTHORIZED when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        signIn({ data: { email: 'missing@test.com', password: 'pass' }, domain })
      ).rejects.toThrow(TRPCError);

      const err = await signIn({
        data: { email: 'missing@test.com', password: 'pass' },
        domain,
      }).catch((e) => e);
      expect(err.code).toBe('UNAUTHORIZED');
      expect(err.message).toBe('invalidCredentials');
    });

    it('throws UNAUTHORIZED when password is wrong', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(baseUser);
      mockCompare.mockResolvedValue(false);
      mockPrisma.user.update.mockResolvedValue({ ...baseUser, failedLoginAttempts: 1 });

      const err = await signIn({
        data: { email: 'test@example.com', password: 'wrong' },
        domain,
      }).catch((e) => e);

      expect(err).toBeInstanceOf(TRPCError);
      expect(err.code).toBe('UNAUTHORIZED');
    });

    it('returns SUCCESS with tokens on valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(baseUser);
      mockCompare.mockResolvedValue(true);
      mockGenerateBackendTokens.mockResolvedValue(backendTokens);

      const result = await signIn({
        data: { email: 'test@example.com', password: 'correct' },
        domain,
      });

      expect(result.status).toBe('SUCCESS');
      if (result.status !== 'SUCCESS') throw new Error('Expected SUCCESS');
      expect(result.accessToken).toBe('access-token');
      expect(result.user.id).toBe('user-1');
    });
  });

  describe('updateAccessBackendToken', () => {
    it('returns new access token', async () => {
      mockGenerateBackendTokens.mockResolvedValue({
        accessToken: 'new-access-token',
        accessTokenExp: new Date(),
      });

      const result = await updateAccessBackendToken({
        payload: { sub: 'user-1', email: 'test@example.com' },
        domain,
      });

      expect(result.accessToken).toBe('new-access-token');
      expect(mockGenerateBackendTokens).toHaveBeenCalledWith(
        { sub: 'user-1', email: 'test@example.com' },
        expect.objectContaining({ updateAccess: true, updateRefresh: false })
      );
    });
  });
});
