import { prisma } from '@package/prisma';
import { TRPCError } from '@trpc/server';
import { hash } from 'bcryptjs';
import type { Logger } from 'nestjs-pino';

import { env } from '../../config/env';
import { mailer } from '../../utils/mailer';
import { Domain } from '../trpc/trpc.context';
import { RATE_LIMIT_COOLDOWN_MINUTES } from './auth.constants';
import {
  ChangeForcedPasswordData,
  ForgotPasswordFormData,
  ForgotPasswordOutputData,
  ResetPasswordData,
  ResetPasswordOutputData,
} from './auth.schema';
import { issueVerificationToken, revokeVerificationTokens } from './token.helper';

export const receivePasswordResetLink = async ({
  data,
  domain,
  logger,
}: {
  data: ForgotPasswordFormData;
  domain: Domain;
  logger: Logger;
}): Promise<ForgotPasswordOutputData> => {
  const SUCCESS_RESPONSE = { success: true, message: 'recoveryEmailSent' } as const;

  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: {
      verificationTokens: {
        where: { type: 'PASSWORD_RESET' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!user) return SUCCESS_RESPONSE;

  const isAdminHost = domain.origin?.includes('admin');
  const isAdminRole = ['ADMIN', 'SUPER_ADMIN'].includes(user.role);

  if (isAdminRole && !isAdminHost) {
    logger.warn({ userId: user.id }, 'Admin tried to reset password via public site');
    return SUCCESS_RESPONSE;
  }

  if (!isAdminRole && isAdminHost) {
    logger.warn({ userId: user.id }, 'User tried to reset password via admin panel');
    return SUCCESS_RESPONSE;
  }

  const lastToken = user.verificationTokens?.[0];

  if (lastToken) {
    const diffInMinutes = (Date.now() - lastToken.createdAt.getTime()) / 60_000;

    if (diffInMinutes < RATE_LIMIT_COOLDOWN_MINUTES) {
      const waitSeconds = Math.ceil((RATE_LIMIT_COOLDOWN_MINUTES - diffInMinutes) * 60);
      throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: `tooManyRequests|${waitSeconds}` });
    }
  }

  const token = await issueVerificationToken({
    email: data.email,
    userId: user.id,
    type: 'PASSWORD_RESET',
  });
  const link = `${domain.origin || env.APP_WEBSITE_URL}/auth/reset-password?token=${token}&email=${data.email}`;
  await mailer.sendPasswordReset({
    to: data.email,
    name: user.nickName,
    link,
    locale: domain.locale,
  });

  return SUCCESS_RESPONSE;
};

export const resetPassword = async ({
  data,
  domain,
}: {
  data: ResetPasswordData;
  domain: Domain;
}): Promise<ResetPasswordOutputData> => {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: { verificationTokens: { where: { token: data.token, type: 'PASSWORD_RESET' } } },
  });

  const isAdminHost = domain.origin?.includes('admin');

  if (user && isAdminHost && user.role === 'USER') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'accessDenied' });
  }

  const tokenRecord = user?.verificationTokens[0];

  if (!user || !tokenRecord || tokenRecord.expiresAt < new Date()) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'invalidResetLink' });
  }

  const hashedPassword = await hash(data.password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword, failedLoginAttempts: 0, lockedUntil: null },
  });

  await revokeVerificationTokens({ email: data.email, type: 'PASSWORD_RESET' });

  const link = `${domain.origin}/auth/sign-in`;
  await mailer.sendPasswordChanged({
    to: data.email,
    name: user.nickName || user.firstName,
    link,
    locale: domain.locale,
  });

  return { success: true, message: 'passwordUpdated' };
};

export const changeForcedPassword = async ({
  data,
  domain,
}: {
  data: ChangeForcedPasswordData & { userId: string };
  domain: Domain;
}): Promise<ResetPasswordOutputData> => {
  const user = await prisma.user.findUnique({ where: { id: data.userId } });

  if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'userSessionNotFound' });

  const isAdminHost = domain.origin?.includes('admin');

  if (isAdminHost && user.role === 'USER') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'accessDenied' });
  }

  const hashedPassword = await hash(data.password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      forcePasswordChange: false,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  await revokeVerificationTokens({ email: user.email!, type: 'PASSWORD_RESET' });

  const link = `${domain.origin}/auth/sign-in`;
  await mailer.sendPasswordChanged({
    to: user.email!,
    name: user.nickName || user.firstName || 'Admin',
    link,
    locale: domain.locale,
  });

  return { success: true, message: 'securityProtocolInitialized' };
};
