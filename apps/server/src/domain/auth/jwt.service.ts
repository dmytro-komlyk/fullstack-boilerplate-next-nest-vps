import { prisma } from '@package/prisma';
import { TRPCError } from '@trpc/server';
import { addDays, addHours, addMinutes } from 'date-fns';
import jwt from 'jsonwebtoken';

import { env } from '../../config/env';
import {
  ACCESS_TOKEN_TTL_HOURS,
  MFA_TOKEN_TTL_MINUTES,
  REFRESH_TOKEN_TTL_DAYS,
} from './auth.constants';
import { GenerateOptions, InputBackendTokens, OutputBackendTokens } from './auth.schema';

const getJwtSecret = (type: 'access' | 'refresh' | 'reset' | '2fa'): string => {
  if (type === 'access' || type === '2fa') return env.JWT_ACCESS_TOKEN;
  if (type === 'refresh') return env.JWT_REFRESH_TOKEN;
  return env.JWT_RESET_TOKEN;
};

export const verifyToken = async ({
  type,
  token,
}: {
  type: 'access' | 'refresh' | 'reset' | '2fa';
  token: string;
}): Promise<jwt.JwtPayload> => {
  const secret = getJwtSecret(type);

  try {
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'tokenExpired',
        cause: error.expiredAt,
      });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'invalidToken' });
    }
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'invalidOrExpiredToken' });
  }
};

export async function generateBackendTokens(
  payload: InputBackendTokens & { type?: '2FA_PENDING' },
  options: GenerateOptions & { clientId?: string; userAgent?: string } = {
    updateAccess: true,
    updateRefresh: false,
  }
): Promise<OutputBackendTokens> {
  const now = new Date();
  const result: Partial<OutputBackendTokens> = {};
  const userId = payload.sub;
  const clientId = options.clientId || 'unknown';

  if (payload.type === '2FA_PENDING') {
    const mfaExpDate = addMinutes(now, MFA_TOKEN_TTL_MINUTES);
    const mfaExpUnix = Math.floor(mfaExpDate.getTime() / 1000);
    const mfaToken = jwt.sign({ ...payload, exp: mfaExpUnix }, env.JWT_ACCESS_TOKEN);
    return { accessToken: mfaToken, accessTokenExp: mfaExpDate } as OutputBackendTokens;
  }

  if (options.updateAccess) {
    let accessExpDate = addHours(now, ACCESS_TOKEN_TTL_HOURS);

    if (!options.updateRefresh) {
      const currentRefreshToken = await prisma.token.findUnique({
        where: { userId_type_clientId: { userId, type: 'REFRESH', clientId } },
      });

      if (currentRefreshToken && currentRefreshToken.expiresAt < accessExpDate) {
        accessExpDate = currentRefreshToken.expiresAt;
      }
    }

    const accessExpUnix = Math.floor(accessExpDate.getTime() / 1000);
    const accessPayload = { ...payload, iat: Math.floor(now.getTime() / 1000), exp: accessExpUnix };
    const accessToken = jwt.sign(accessPayload, env.JWT_ACCESS_TOKEN);

    await prisma.token
      .upsert({
        where: { userId_type_clientId: { userId, type: 'ACCESS', clientId } },
        update: {
          token: accessToken,
          expiresAt: accessExpDate,
          userAgent: options.userAgent ?? null,
        },
        create: {
          userId,
          type: 'ACCESS',
          token: accessToken,
          expiresAt: accessExpDate,
          clientId,
          userAgent: options.userAgent ?? null,
        },
      })
      .catch((err: unknown) => {
        console.warn('[jwt] Failed to persist access token — token still issued:', err);
      });

    result.accessToken = accessToken;
    result.accessTokenExp = accessExpDate;
  }

  if (options.updateRefresh) {
    const refreshExpDate = addDays(now, REFRESH_TOKEN_TTL_DAYS);
    const refreshExpUnix = Math.floor(refreshExpDate.getTime() / 1000);
    const refreshPayload = {
      ...payload,
      iat: Math.floor(now.getTime() / 1000),
      exp: refreshExpUnix,
    };
    const refreshToken = jwt.sign(refreshPayload, env.JWT_REFRESH_TOKEN);

    await prisma.token.upsert({
      where: { userId_type_clientId: { userId, type: 'REFRESH', clientId } },
      update: {
        token: refreshToken,
        expiresAt: refreshExpDate,
        userAgent: options.userAgent ?? null,
      },
      create: {
        userId,
        type: 'REFRESH',
        token: refreshToken,
        expiresAt: refreshExpDate,
        clientId,
        userAgent: options.userAgent ?? null,
      },
    });

    result.refreshToken = refreshToken;
    result.refreshTokenExp = refreshExpDate;
  }

  return result as OutputBackendTokens;
}
