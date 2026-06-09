import { prisma } from '@package/prisma';
import { TRPCError } from '@trpc/server';
import { hash } from 'bcryptjs';
import { generateSecret, generateURI, verify } from 'otplib';
import QRCode from 'qrcode';

import { env } from '../../config/env';
import { Domain } from '../trpc/trpc.context';
import {
  ActiveTwoFactorData,
  OutputActiveTwoFactorData,
  OutputAuthData,
  OutputSetupTwoFactorData,
  TwoFactorData,
} from './auth.schema';
import { generateBackendTokens, verifyToken as verifyJWTToken } from './jwt.service';
import { createUserSession } from './session.helper';

export const generateTwoFactorSecret = async (
  userEmail: string
): Promise<OutputSetupTwoFactorData> => {
  const secret = generateSecret();
  const otpauthUrl = generateURI({ issuer: env.APP_NAME, label: userEmail, secret });
  const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);
  return { secret, qrCodeUrl };
};

export const verifyTwoFactorToken = async (token: string, secret: string): Promise<boolean> => {
  try {
    const response = await verify({ token, secret });
    return response.valid;
  } catch {
    return false;
  }
};

export const generateBackupCodes = async () => {
  const crypto = await import('node:crypto');
  const codes = Array.from({ length: 10 }, () =>
    crypto.randomBytes(4).toString('hex').toUpperCase()
  );
  const hashedCodes = await Promise.all(codes.map((code) => hash(code, 12)));
  return { plain: codes, hashed: hashedCodes };
};

export const setup2FALogin = async ({
  user,
}: {
  user: TwoFactorData;
  domain: Domain;
}): Promise<OutputSetupTwoFactorData> => {
  const currentUser = await prisma.user.findUnique({ where: { id: user.id } });

  if (currentUser?.isTwoFactorEnabled) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'twoFactorAlreadyEnabled' });
  }

  const { secret, qrCodeUrl } = await generateTwoFactorSecret(user.email);

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorSecret: secret, isTwoFactorEnabled: false },
  });

  return { secret, qrCodeUrl };
};

export const verify2FALogin = async ({
  data,
  domain,
}: {
  data: { mfaToken: string; code: string };
  domain: Domain;
}): Promise<OutputAuthData> => {
  const payload = await verifyJWTToken({ type: '2fa', token: data.mfaToken });

  if (!payload.sub) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'twoFactorVerifyToken' });
  }

  if (payload.type !== '2FA_PENDING') {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'twoFactorInvalidToken' });
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });

  if (!user || !user.twoFactorSecret) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'twoFactorNotConfigured' });
  }

  const isValid = await verifyTwoFactorToken(data.code, user.twoFactorSecret);

  if (!isValid) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'twoFactorInvalidCode' });

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
    isTwoFactorVerified: true,
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

export const activate2FA = async ({
  data,
}: {
  data: ActiveTwoFactorData & { userId: string };
  domain: Domain;
}): Promise<OutputActiveTwoFactorData> => {
  const user = await prisma.user.findUnique({
    where: { id: data.userId },
    select: { id: true, twoFactorSecret: true, isTwoFactorEnabled: true },
  });

  if (!user || !user.twoFactorSecret) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'twoFactorSecretNotFound' });
  }

  const isValid = await verifyTwoFactorToken(data.code, user.twoFactorSecret);

  if (!isValid)
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'twoFactorInvalidVerificationCode' });

  const { plain, hashed } = await generateBackupCodes();

  await prisma.user.update({
    where: { id: user.id },
    data: { isTwoFactorEnabled: true, twoFactorSetupPending: false, twoFactorBackupCodes: hashed },
  });

  await prisma.session.updateMany({
    where: { userId: user.id },
    data: { isTwoFactorVerified: true },
  });

  return { success: true, backupCodes: plain };
};
