import { INestApplicationContext } from '@nestjs/common';
import { prisma } from '@package/prisma';
import { inferAsyncReturnType } from '@trpc/server';
import { FastifyReply, FastifyRequest } from 'fastify';
import Redis from 'ioredis';
import { JwtPayload } from 'jsonwebtoken';
import { Logger } from 'nestjs-pino';

import { verifyToken } from '../auth/jwt.service';

export type Domain = {
  host: string | null;
  origin: string | null;
  userAgent: string | null;
  clientId: string | null;
  locale: string;
};

export type ServerContext = {
  user: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    nickName: string | null;
    avatarUrl: string | null;
    emailVerified: Date | null;
    isTwoFactorEnabled: boolean;
  } | null;
  sessionToken: string | null;
};

export type FullServerContext = ServerContext & {
  logger: Logger;
  domain: Domain;
  redis: Redis;
};

export interface FastifyContextOptions {
  app: INestApplicationContext;
  logger: Logger;
  req?: FastifyRequest;
  res?: FastifyReply;
  connection?: {
    headers: Record<string, string | string[] | undefined>;
  };
}

const normalizeIp = (rawIp: string | undefined | null): string => {
  const ipParts = rawIp ? rawIp.split(',') : ['127.0.0.1'];
  let ip = (ipParts[0] ?? '127.0.0.1').trim().replace(/^.*:ffff:/, '');
  if (ip === '::1') ip = '127.0.0.1';
  return ip;
};

const getHeader = (
  headers: Record<string, string | string[] | undefined>,
  name: string
): string | null => {
  const value = headers[name];
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
};

export async function createContext({
  app,
  req,
  connection,
  logger,
}: FastifyContextOptions): Promise<FullServerContext> {
  const redis = app.get<Redis>('REDIS');

  const headers = req?.headers ?? connection?.headers ?? {};
  let query = (req?.query as Record<string, string>) ?? {};
  if (Object.keys(query).length === 0 && req?.url) {
    const url = new URL(req.url, `http://${headers['host'] ?? 'localhost'}`);
    query = Object.fromEntries(url.searchParams.entries());
  }

  const host = getHeader(headers, 'host');
  const origin = getHeader(headers, 'origin');
  const userAgent = getHeader(headers, 'user-agent');
  const rawIp =
    getHeader(headers, 'x-forwarded-for') ??
    getHeader(headers, 'x-real-ip') ??
    req?.ip ??
    '127.0.0.1';
  const ip = normalizeIp(rawIp);

  const clientId = getHeader(headers, 'x-client-id') ?? query['clientId'] ?? null;
  const locale = getHeader(headers, 'x-locale') ?? query['locale'] ?? 'uk';
  const cleanHost = host?.split(':')[0] ?? null;

  let user: ServerContext['user'] = null;
  // Session token must come from the header only — query params leak to logs/CDN/Referer
  const sessionToken = getHeader(headers, 'x-session-token');

  if (sessionToken) {
    logger.debug({ sessionToken: sessionToken.substring(0, 10) + '...' }, 'Session check');

    try {
      const dbSession = await prisma.session.findUnique({
        where: { sessionToken },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              nickName: true,
              avatarUrl: true,
              emailVerified: true,
              isTwoFactorEnabled: true,
              failedLoginAttempts: true,
              lockedUntil: true,
            },
          },
        },
      });

      if (dbSession && dbSession.expiresAt > new Date()) {
        user = dbSession.user;

        // Fire-and-forget — activity updates are non-critical for the response
        void prisma.session
          .update({
            where: { sessionToken },
            data: {
              lastActiveAt: new Date(),
              clientId: dbSession.clientId || clientId,
              userAgent: dbSession.userAgent || userAgent,
              ipAddress: ip,
            },
          })
          .catch(() => void 0);

        void prisma.user
          .update({
            where: { id: dbSession.userId },
            data: { lastActiveAt: new Date(), isOnline: true },
          })
          .catch(() => void 0);

        logger.log({ userId: dbSession.userId }, 'Session confirmed');
      } else {
        logger.warn('Session not found or expired');
      }
    } catch (err) {
      logger.error({ err }, 'Error checking session');
    }
  } else {
    logger.debug('No session token provided');
  }

  const authHeader =
    getHeader(headers, 'authorization') ?? (query['token'] ? `Bearer ${query['token']}` : null);

  if (!user && authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    logger.debug({ token: token.substring(0, 10) + '...' }, 'Checking JWT as fallback');

    try {
      const payload: JwtPayload = await verifyToken({ token, type: 'access' });

      if (payload.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: payload.sub },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            nickName: true,
            avatarUrl: true,
            emailVerified: true,
            isTwoFactorEnabled: true,
            failedLoginAttempts: true,
            lockedUntil: true,
          },
        });

        if (dbUser) {
          user = dbUser;
          logger.log({ userId: dbUser.id }, 'Authenticated via JWT (Mobile)');
        }
      }
    } catch (err) {
      logger.warn({ err }, 'Invalid JWT provided in Authorization header');
    }
  }

  return {
    sessionToken,
    user,
    logger,
    redis,
    domain: { host: cleanHost, origin, userAgent, clientId, locale },
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
