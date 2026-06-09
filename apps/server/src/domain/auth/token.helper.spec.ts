import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@package/prisma', () => ({
  prisma: {
    verificationToken: {
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      create: vi.fn().mockResolvedValue({}),
    },
  },
}));

vi.mock('node:crypto', () => ({
  default: { randomUUID: vi.fn().mockReturnValue('mock-uuid-1234') },
}));

import { prisma } from '@package/prisma';

import { issueVerificationToken, revokeVerificationTokens } from './token.helper';

const mockPrisma = prisma as unknown as {
  verificationToken: {
    deleteMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
};

describe('token.helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.verificationToken.deleteMany.mockResolvedValue({ count: 1 });
    mockPrisma.verificationToken.create.mockResolvedValue({});
  });

  describe('issueVerificationToken', () => {
    it('deletes existing tokens before creating a new one', async () => {
      await issueVerificationToken({
        email: 'user@example.com',
        userId: 'user-1',
        type: 'EMAIL_VERIFICATION',
      });

      expect(mockPrisma.verificationToken.deleteMany).toHaveBeenCalledWith({
        where: { identifier: 'user@example.com', type: 'EMAIL_VERIFICATION' },
      });
      expect(mockPrisma.verificationToken.deleteMany).toHaveBeenCalledTimes(1);
    });

    it('creates a new token with correct data', async () => {
      await issueVerificationToken({
        email: 'user@example.com',
        userId: 'user-1',
        type: 'EMAIL_VERIFICATION',
      });

      expect(mockPrisma.verificationToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            identifier: 'user@example.com',
            token: 'mock-uuid-1234',
            type: 'EMAIL_VERIFICATION',
            userId: 'user-1',
          }),
        })
      );
    });

    it('returns the generated token string', async () => {
      const token = await issueVerificationToken({
        email: 'user@example.com',
        userId: 'user-1',
        type: 'EMAIL_VERIFICATION',
      });

      expect(token).toBe('mock-uuid-1234');
    });

    it('works for PASSWORD_RESET type', async () => {
      const token = await issueVerificationToken({
        email: 'admin@example.com',
        userId: 'user-2',
        type: 'PASSWORD_RESET',
      });

      expect(mockPrisma.verificationToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: 'PASSWORD_RESET' }),
        })
      );
      expect(token).toBe('mock-uuid-1234');
    });
  });

  describe('revokeVerificationTokens', () => {
    it('deletes tokens matching email and type', async () => {
      await revokeVerificationTokens({ email: 'user@example.com', type: 'PASSWORD_RESET' });

      expect(mockPrisma.verificationToken.deleteMany).toHaveBeenCalledWith({
        where: { identifier: 'user@example.com', type: 'PASSWORD_RESET' },
      });
    });

    it('does not call create', async () => {
      await revokeVerificationTokens({ email: 'user@example.com', type: 'EMAIL_VERIFICATION' });

      expect(mockPrisma.verificationToken.create).not.toHaveBeenCalled();
    });
  });
});
