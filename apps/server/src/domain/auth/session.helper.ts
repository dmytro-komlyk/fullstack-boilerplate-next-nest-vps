import crypto from 'node:crypto';

import { prisma } from '@package/prisma';

import type { Domain } from '../trpc/trpc.context';
import { SESSION_TTL_MS } from './auth.constants';

type CreateSessionInput = {
  userId: string;
  refreshToken: string;
  refreshTokenExp: Date;
  domain: Pick<Domain, 'origin' | 'clientId' | 'userAgent'>;
  isTwoFactorVerified?: boolean;
};

type SessionResult = {
  sessionToken: string;
  sessionExpires: Date;
};

export const createUserSession = async ({
  userId,
  refreshToken,
  refreshTokenExp,
  domain,
  isTwoFactorVerified = false,
}: CreateSessionInput): Promise<SessionResult> => {
  const isWeb = !!domain.origin;
  const sessionToken = isWeb ? crypto.randomUUID() : refreshToken;
  const sessionExpires = isWeb ? new Date(Date.now() + SESSION_TTL_MS) : refreshTokenExp;

  await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expiresAt: sessionExpires,
      isTwoFactorVerified,
      clientId: domain.clientId,
      userAgent: domain.userAgent,
    },
  });

  return { sessionToken, sessionExpires };
};
