import fastifyCors, { FastifyCorsOptions } from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import ws from '@fastify/websocket';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { fastifyTRPCPlugin, FastifyTRPCPluginOptions } from '@trpc/server/adapters/fastify';
import { Logger, PinoLogger } from 'nestjs-pino';

import { env } from './config/env';
import { AppModule } from './domain/app.module';
import { openApiDocument } from './domain/trpc/openapi.plugin';
import { createContext, FastifyContextOptions } from './domain/trpc/trpc.context';
import { appRouter } from './domain/trpc/trpc.router';

async function bootstrap() {
  const bootstrapLogger = new PinoLogger({
    pinoHttp: {
      level: 'debug',
      transport: { target: 'pino-pretty', options: { colorize: true } },
    },
  });

  const adapter = new FastifyAdapter({ trustProxy: true });

  try {
    const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, {
      bufferLogs: true,
    });

    const logger = app.get(Logger);
    app.useLogger(logger);

    await app.register(fastifyRateLimit, { max: 1000, timeWindow: '15 minutes' });
    logger.log('Rate limit middleware registered');

    await app.register<FastifyCorsOptions>(fastifyCors, {
      origin: [env.APP_WEBSITE_URL, env.APP_ADMIN_URL],
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Accept',
        'Authorization',
        'x-session-token',
        'x-client-id',
        'x-locale',
      ],
      credentials: true,
    });
    logger.log('CORS middleware registered');

    await app.register(fastifyHelmet, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          connectSrc: [
            "'self'",
            'ws:',
            'wss:',
            env.APP_WEBSITE_URL,
            env.APP_ADMIN_URL,
            env.APP_HTTP_URL ?? '',
            env.APP_SOCKET_URL ?? '',
          ].filter(Boolean),
        },
      },
    });
    logger.log('Helmet middleware registered with CSP');

    await app.register(ws, {
      options: { maxPayload: 1048576, clientTracking: true, perMessageDeflate: false },
    });
    logger.log('WebSocket middleware registered');

    await app.register(fastifyTRPCPlugin, {
      prefix: '/trpc',
      useWSS: true,
      trpcOptions: {
        router: appRouter,
        createContext: (opts: Omit<FastifyContextOptions, 'app' | 'logger'>) =>
          createContext({ ...opts, app, logger }),
      },
    } satisfies FastifyTRPCPluginOptions<typeof appRouter>);
    logger.log('tRPC middleware registered');

    await app.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'tRPC OpenAPI',
          description: 'tRPC + OpenAPI documentation',
          version: '1.0.0',
        },
        servers: [{ url: env.APP_HTTP_URL ?? '' }],
      },
      hideUntagged: true,
    });

    await app.register(fastifySwaggerUi, {
      routePrefix: `/${env.APP_SWAGGER}`,
      transformSpecification: () => openApiDocument,
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
        tryItOutEnabled: true,
        url: `/${env.APP_SWAGGER}/json`,
      },
      staticCSP: true,
    });

    logger.log(`Swagger UI available at ${env.APP_BASE_URL ?? ''}/${env.APP_SWAGGER}`);
    logger.log(`OpenAPI JSON available at ${env.APP_BASE_URL ?? ''}/${env.APP_SWAGGER}/json`);

    const staticPath = `${process.cwd()}/${env.APP_STATIC_ASSETS}`;
    const staticPrefix = `/${env.APP_STATIC_ASSETS}`;

    app.useStaticAssets({
      root: staticPath,
      prefix: staticPrefix,
      setHeaders: (res) => {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      },
      decorateReply: false,
    });
    logger.log(`Static assets served from "${staticPath}" at prefix "${staticPrefix}"`);

    app.useStaticAssets({
      root: `${staticPath}/.well-known`,
      prefix: '/.well-known/',
      decorateReply: false,
      wildcard: true,
      dotfiles: 'allow',
      setHeaders: (res, path) => {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        if (path.endsWith('apple-app-site-association')) {
          res.setHeader('Content-Type', 'application/json');
        }
      },
    });
    logger.log('Deep Linking verification files served at "/.well-known/"');

    await app.listen(env.APP_PORT, '0.0.0.0');
    logger.log(`Fastify Server is running on port ${env.APP_PORT}`);

    const shutdown = async (signal: string) => {
      logger.log(`Received ${signal}. Closing server...`);
      await app.close();
      logger.log('Server closed');
      process.exit(0);
    };

    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    bootstrapLogger.error(`Failed to start server on port ${env.APP_PORT}: ${message}`, stack);
    process.exit(1);
  }
}

bootstrap().catch((err: unknown) => {
  const finalLogger = new PinoLogger({
    pinoHttp: { transport: { target: 'pino-pretty', options: { colorize: true } } },
  });
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  finalLogger.error(`Bootstrap error: ${message}`, stack);
  process.exit(1);
});
