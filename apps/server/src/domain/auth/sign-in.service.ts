import { prisma, type PrismaClient } from '@package/prisma';
import { TRPCError } from '@trpc/server';
import { compare } from 'bcryptjs';

import { env } from '../../config/env';
import { mailer } from '../../utils/mailer';
import { Domain } from '../trpc/trpc.context';
import { LOCK_BASE_MINUTES, MAX_FAILED_LOGIN_ATTEMPTS, MAX_LOCK_MINUTES } from './auth.constants';
import {
  InputBackendTokens,
  OutputAccessToken,
  OutputAuthData,
  OutputAuthProviderData,
  OutputSignOutData,
  SignInData,
  SignInProviderData,
  SignOutData,
} from './auth.schema';
import { generateBackendTokens } from './jwt.service';
import { createUserSession } from './session.helper';
import { issueVerificationToken } from './token.helper';

type TxClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export const signIn = async ({
  data,
  domain,
}: {
  data: SignInData;
  domain: Domain;
}): Promise<OutputAuthData> => {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: { accounts: true },
  });

  if (!user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'invalidCredentials',
      cause: 'User not found',
    });
  }

  if (user.status === 'BANNED') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'accountBanned' });
  }

  const isAdminHost = domain.origin?.includes('admin');
  const isAdminRole = ['ADMIN', 'SUPER_ADMIN'].includes(user.role);

  if (isAdminHost && !isAdminRole) throw new TRPCError({ code: 'FORBIDDEN', message: 'adminOnly' });
  if (!isAdminHost && isAdminRole)
    throw new TRPCError({ code: 'FORBIDDEN', message: 'mustLoginAsAdmin' });

  if (!user.password) {
    const providerNames = user.accounts
      .map(
        ({ provider }: { provider: string }) => provider.charAt(0).toUpperCase() + provider.slice(1)
      )
      .join(', ');
    throw new TRPCError({ code: 'BAD_REQUEST', message: `socialAccountFound|${providerNames}` });
  }

  if (!user.emailVerified) {
    const token = await issueVerificationToken({
      email: data.email,
      userId: user.id,
      type: 'EMAIL_VERIFICATION',
    });
    const link = `${domain.origin || env.APP_WEBSITE_URL}/auth/verify-email?token=${token}&email=${data.email}`;
    await mailer.sendVerificationEmail({
      to: data.email,
      name: user.nickName,
      link,
      locale: domain.locale,
    });
    throw new TRPCError({ code: 'FORBIDDEN', message: 'emailNotVerified' });
  }

  const isPasswordValid = await compare(data.password, user.password);

  if (!isPasswordValid) {
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000);
      throw new TRPCError({ code: 'FORBIDDEN', message: `accountRemaining|${remainingMinutes}` });
    }

    const { failedAttempts, lockedUntil } = await prisma.$transaction(async (tx: TxClient) => {
      const updated = await tx.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: { increment: 1 } },
        select: { failedLoginAttempts: true },
      });

      if (updated.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
        const lockMinutes = Math.min(
          LOCK_BASE_MINUTES * Math.pow(2, updated.failedLoginAttempts - MAX_FAILED_LOGIN_ATTEMPTS),
          MAX_LOCK_MINUTES
        );
        const locked = new Date(Date.now() + lockMinutes * 60_000);
        await tx.user.update({ where: { id: user.id }, data: { lockedUntil: locked } });
        return { failedAttempts: updated.failedLoginAttempts, lockedUntil: locked };
      }

      return { failedAttempts: updated.failedLoginAttempts, lockedUntil: null };
    });

    if (lockedUntil) {
      const lockedMinutes = Math.ceil((lockedUntil.getTime() - Date.now()) / 60_000);
      throw new TRPCError({ code: 'FORBIDDEN', message: `accountSuspended|${lockedMinutes}` });
    }

    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: `incorrectPasswordAttempts|${MAX_FAILED_LOGIN_ATTEMPTS - failedAttempts}`,
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastActiveAt: new Date(), isOnline: true, failedLoginAttempts: 0, lockedUntil: null },
  });

  if (user.isTwoFactorEnabled) {
    const { accessToken: mfaToken } = await generateBackendTokens(
      { sub: user.id, email: user.email as string, type: '2FA_PENDING' },
      { updateAccess: true, updateRefresh: false, clientId: domain.clientId ?? 'unknown' }
    );

    return {
      status: 'REQUIRES_2FA',
      mfaToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        nickName: user.nickName,
        avatarUrl: user.avatarUrl,
        forcePasswordChange: user.forcePasswordChange,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
        twoFactorSetupPending: user.twoFactorSetupPending,
      },
    };
  }

  const { accessToken, refreshToken, accessTokenExp, refreshTokenExp } =
    await generateBackendTokens(
      { sub: user.id, email: user.email as string },
      {
        updateAccess: true,
        updateRefresh: true,
        clientId: domain.clientId ?? 'unknown',
        ...(domain.userAgent !== null && { userAgent: domain.userAgent }),
      }
    );

  const { sessionToken } = await createUserSession({
    userId: user.id,
    refreshToken: refreshToken!,
    refreshTokenExp: refreshTokenExp!,
    domain,
  });

  return {
    status: 'SUCCESS',
    accessToken,
    refreshToken,
    accessTokenExp,
    refreshTokenExp: refreshTokenExp!,
    sessionToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      nickName: user.nickName,
      avatarUrl: user.avatarUrl,
      forcePasswordChange: user.forcePasswordChange,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
      twoFactorSetupPending: user.twoFactorSetupPending,
    },
  };
};

export const signOut = async ({
  userId,
  clientId,
  sessionToken,
}: SignOutData): Promise<OutputSignOutData> => {
  if (sessionToken) {
    await prisma.session.deleteMany({ where: { sessionToken } });
  }

  if (clientId) {
    await prisma.token.deleteMany({
      where: { userId, clientId, type: { in: ['ACCESS', 'REFRESH'] } },
    });
  }

  const activeSessionsCount = await prisma.session.count({
    where: { userId, expiresAt: { gt: new Date() } },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { isOnline: activeSessionsCount > 0, lastActiveAt: new Date() },
  });

  return { userId, success: true, message: 'logoutSuccess', isLogined: false };
};

export const signInProvider = async ({
  data,
  domain,
}: {
  data: SignInProviderData;
  domain: Domain;
}): Promise<OutputAuthProviderData> => {
  const existingAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: data.provider,
        providerAccountId: data.providerAccountId,
      },
    },
    include: { user: true },
  });

  let user = existingAccount?.user || null;

  if (!user && data.email) {
    user = await prisma.user.findUnique({ where: { email: data.email } });
  }

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        nickName: data.nickName,
        emailVerified: new Date(),
        status: 'ACTIVE',
      },
    });
  }

  if (!existingAccount) {
    await prisma.account.create({
      data: {
        userId: user.id,
        type: 'oauth',
        provider: data.provider,
        providerAccountId: data.providerAccountId,
        avatarUrl: data.avatarUrl,
      },
    });
  } else {
    await prisma.account.update({
      where: { id: existingAccount.id },
      data: { avatarUrl: data.avatarUrl },
    });
  }

  user = await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName: user.firstName ?? data.firstName,
      lastName: user.lastName ?? data.lastName,
      lastActiveAt: new Date(),
      isOnline: true,
    },
  });

  const finalClientId = data.clientId || domain.clientId || 'unknown';

  const { accessToken, refreshToken, accessTokenExp, refreshTokenExp } =
    await generateBackendTokens(
      { sub: user.id, email: user.email || '' },
      {
        updateAccess: true,
        updateRefresh: true,
        clientId: finalClientId,
        ...(domain.userAgent !== null && { userAgent: domain.userAgent }),
      }
    );

  const { sessionToken } = await createUserSession({
    userId: user.id,
    refreshToken: refreshToken!,
    refreshTokenExp: refreshTokenExp!,
    domain: { ...domain, clientId: finalClientId },
  });

  return {
    status: 'SUCCESS',
    accessToken,
    refreshToken,
    accessTokenExp,
    refreshTokenExp: refreshTokenExp!,
    sessionToken,
    user: {
      id: user.id,
      role: user.role,
      email: user.email,
      nickName: user.nickName,
      avatarUrl: user.avatarUrl || data.avatarUrl,
      forcePasswordChange: user.forcePasswordChange,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
      twoFactorSetupPending: user.twoFactorSetupPending,
    },
  };
};

export const updateAccessBackendToken = async ({
  payload,
  domain,
}: {
  payload: InputBackendTokens;
  domain: Domain;
}): Promise<OutputAccessToken> => {
  const { accessToken, accessTokenExp } = await generateBackendTokens(payload, {
    updateAccess: true,
    updateRefresh: false,
    clientId: domain.clientId ?? 'unknown',
    ...(domain.userAgent !== null && { userAgent: domain.userAgent }),
  });

  return { accessToken, accessTokenExp };
};
