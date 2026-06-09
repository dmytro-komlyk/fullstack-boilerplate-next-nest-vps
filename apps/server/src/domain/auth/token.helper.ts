import crypto from 'node:crypto';

import { prisma } from '@package/prisma';

import { EMAIL_TOKEN_TTL_MS, PASSWORD_RESET_TTL_MS } from './auth.constants';

type VerificationTokenType = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';

const TOKEN_TTL: Record<VerificationTokenType, number> = {
  EMAIL_VERIFICATION: EMAIL_TOKEN_TTL_MS,
  PASSWORD_RESET: PASSWORD_RESET_TTL_MS,
};

export const issueVerificationToken = async ({
  email,
  userId,
  type,
}: {
  email: string;
  userId: string;
  type: VerificationTokenType;
}): Promise<string> => {
  await prisma.verificationToken.deleteMany({ where: { identifier: email, type } });
  const token = crypto.randomUUID();
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      type,
      expiresAt: new Date(Date.now() + TOKEN_TTL[type]),
      userId,
    },
  });
  return token;
};

export const revokeVerificationTokens = async ({
  email,
  type,
}: {
  email: string;
  type: VerificationTokenType;
}): Promise<void> => {
  await prisma.verificationToken.deleteMany({ where: { identifier: email, type } });
};
