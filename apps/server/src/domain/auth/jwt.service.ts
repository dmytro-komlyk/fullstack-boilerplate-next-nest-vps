import { prisma } from '@package/prisma';
import { TRPCError } from '@trpc/server';
import { addDays, addHours, addMinutes } from 'date-fns';
import jwt from 'jsonwebtoken';

import { GenerateOptions, InputBackendTokens, OutputBackendTokens } from './auth.schema';

export const verifyToken = async ({
  type,
  token,
}: {
  type: 'access' | 'refresh' | 'reset' | '2fa';
  token: string;
}): Promise<jwt.JwtPayload> => {
  const secret =
    type === 'access' || type === '2fa'
      ? (process.env.JWT_ACCESS_TOKEN as string)
      : type === 'refresh'
        ? (process.env.JWT_REFRESH_TOKEN as string)
        : (process.env.JWT_RESET_TOKEN as string);

  try {
    const decoded: jwt.JwtPayload = jwt.verify(token, secret) as jwt.JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.error('Token expired at:', error.expiredAt);
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'tokenExpired',
        cause: error.expiredAt,
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.error('JWT error:', error.message);
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'invalidToken',
      });
    }
    console.error('Unexpected error:', error);
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'invalidOrExpiredToken',
    });
  }
};

export async function generateBackendTokens(
  payload: InputBackendTokens & { type?: '2FA_PENDING' },
  options: GenerateOptions & { clientId?: string | undefined; userAgent?: string | undefined } = {
    updateAccess: true,
    updateRefresh: false,
  }
): Promise<OutputBackendTokens> {
  const now = new Date();
  const result: Partial<OutputBackendTokens> = {};
  const userId = payload.sub;
  const clientId = options.clientId || 'unknown';

  // 1. 2FA token
  if (payload.type === '2FA_PENDING') {
    const mfaExpDate = addMinutes(now, 10);
    const mfaExpUnix = Math.floor(mfaExpDate.getTime() / 1000);

    const mfaToken = jwt.sign(
      { ...payload, exp: mfaExpUnix },
      process.env.JWT_ACCESS_TOKEN as string
    );

    return {
      accessToken: mfaToken,
      accessTokenExp: mfaExpDate,
    } as OutputBackendTokens;
  }

  // 2. Access token
  if (options.updateAccess) {
    const accessExpDate = addHours(now, 1);
    // const accessExpDate = addMinutes(now, 2); // for test
    const accessExpUnix = Math.floor(accessExpDate.getTime() / 1000);

    const accessPayload = {
      ...payload,
      iat: Math.floor(now.getTime() / 1000),
      exp: accessExpUnix,
    };

    const accessToken = jwt.sign(accessPayload, process.env.JWT_ACCESS_TOKEN as string);

    await prisma.token
      .upsert({
        where: {
          userId_type_clientId: {
            userId,
            type: 'ACCESS',
            clientId,
          },
        },
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
      .catch(() => {
        // Fallback если upsert по токену невозможен
      });

    result.accessToken = accessToken;
    result.accessTokenExp = accessExpDate;
  }

  // 3. Refresh token
  if (options.updateRefresh) {
    const refreshExpDate = addDays(now, 7);
    // const refreshExpDate = addMinutes(now, 10); // for test
    const refreshExpUnix = Math.floor(refreshExpDate.getTime() / 1000);

    const refreshPayload = {
      ...payload,
      iat: Math.floor(now.getTime() / 1000),
      exp: refreshExpUnix,
    };

    const refreshToken = jwt.sign(refreshPayload, process.env.JWT_REFRESH_TOKEN as string);

    await prisma.token.upsert({
      where: {
        userId_type_clientId: {
          userId,
          type: 'REFRESH',
          clientId,
        },
      },
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
