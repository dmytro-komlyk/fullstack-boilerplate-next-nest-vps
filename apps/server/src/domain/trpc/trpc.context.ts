import { INestApplicationContext } from '@nestjs/common';
import { prisma } from '@package/prisma';
import { inferAsyncReturnType } from '@trpc/server';
import { FastifyReply, FastifyRequest } from 'fastify';
import Redis from 'ioredis';
import { JwtPayload } from 'jsonwebtoken';
import { Logger, PinoLogger } from 'nestjs-pino';

import { verifyToken } from '../auth/jwt.service';

export type Domain = {
  host: string | null;
  origin: string | null;
  userAgent: string | null;
  clientId: string | null;
  locale: string;
};

// ---- Context SSR / Next.js ----
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

// ---- Context NestJS ----
export type FullServerContext = ServerContext & {
  logger: Logger;
  domain: Domain;
  redis: Redis;
};

// ---- NestJS / Fastify ----
export interface FastifyContextOptions {
  app: INestApplicationContext;
  logger: Logger;
  req?: FastifyRequest;
  res?: FastifyReply;
  connection?: {
    headers: Record<string, string | string[] | undefined>;
  };
}

function normalizeIp(rawIp: string | undefined | null): string {
  const ipParts = rawIp ? rawIp.split(',') : ['127.0.0.1'];
  let ip = (ipParts[0] || '127.0.0.1').trim().replace(/^.*:ffff:/, '');

  if (ip === '::1') {
    ip = '127.0.0.1';
  }
  return ip;
}

export async function createContext({
  app,
  req,
  connection,
  logger,
}: FastifyContextOptions): Promise<FullServerContext> {
  const redis = app.get<Redis>('REDIS');
  const loggerContext =
    logger ??
    new PinoLogger({
      pinoHttp: {
        transport: { target: 'pino-pretty', options: { colorize: true } },
      },
    });

  const headers = req?.headers || connection?.headers || {};
  let query = (req?.query as Record<string, string>) || {};
  if (Object.keys(query).length === 0 && req?.url) {
    const url = new URL(req.url, `http://${headers.host || 'localhost'}`);
    query = Object.fromEntries(url.searchParams.entries());
  }

  const host = (headers['host'] as string) || null;
  const origin = (headers['origin'] as string) || null;
  const userAgent = (headers['user-agent'] as string) || null;
  const rawIp =
    (headers['x-forwarded-for'] as string) ||
    (headers['x-real-ip'] as string) ||
    req?.ip ||
    '127.0.0.1';
  const ip = normalizeIp(rawIp);

  const clientId = (headers['x-client-id'] as string) || query['clientId'] || null;
  const locale = (headers['x-locale'] as string) || query['locale'] || 'uk';

  // if (!clientId && userAgent) {
  //   clientId = crypto.createHash('md5').update(`${userAgent}-${ip}`).digest('hex');
  // }

  const cleanHost = host?.split(':')[0] || null;

  let user: ServerContext['user'] = null;
  const sessionToken = (headers['x-session-token'] as string) || query['sessionToken'] || null;

  // Web
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

        await prisma.session.update({
          where: { sessionToken },
          data: {
            lastActiveAt: new Date(),
            clientId: dbSession.clientId || clientId,
            userAgent: dbSession.userAgent || userAgent,
            ipAddress: ip,
          },
        });

        await prisma.user.update({
          where: { id: dbSession.userId },
          data: {
            lastActiveAt: new Date(),
            isOnline: true,
          },
        });

        logger.log({ userId: dbSession.userId }, 'Session confirmed');
      } else {
        logger.warn('Session not found or expired');
      }
    } catch (err) {
      logger.error('Error checking session', err);
    }
  } else {
    logger.debug('No session token provided');
  }

  // Mobile
  const authHeader =
    (headers.authorization as string) || (query['token'] ? `Bearer ${query['token']}` : undefined);

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
      logger.warn('Invalid JWT provided in Authorization header', err);
    }
  }

  return {
    sessionToken,
    user,
    logger: loggerContext,
    redis,
    domain: {
      host: cleanHost,
      origin: origin,
      userAgent: userAgent,
      clientId: clientId,
      locale: locale,
    },
  };
}

// ---- Context ----
export type Context = inferAsyncReturnType<typeof createContext>;
