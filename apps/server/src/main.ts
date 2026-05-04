import fastifyCors, { FastifyCorsOptions } from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import ws from '@fastify/websocket';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { fastifyTRPCPlugin, FastifyTRPCPluginOptions } from '@trpc/server/adapters/fastify';
import * as dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import { Logger, PinoLogger } from 'nestjs-pino';

import { AppModule } from './domain/app.module';
import { openApiDocument } from './domain/trpc/openapi.plugin';
import { createContext } from './domain/trpc/trpc.context';
import { appRouter } from './domain/trpc/trpc.router';

expand(dotenv.config());

async function bootstrap() {
  const port = process.env.APP_PORT as string;

  const bootstrapLogger = new PinoLogger({
    pinoHttp: {
      level: 'debug',
      transport: { target: 'pino-pretty', options: { colorize: true } },
    },
  });

  const adapter = new FastifyAdapter({
    trustProxy: true,
  });

  try {
    const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, {
      bufferLogs: true,
    });

    const logger = app.get(Logger);
    app.useLogger(logger);

    await app.register(fastifyRateLimit, {
      max: 1000,
      timeWindow: '15 minutes',
    });

    logger.log('Rate limit middleware registered');

    await app.register<FastifyCorsOptions>(fastifyCors, {
      origin: [process.env.APP_WEBSITE_URL as string, process.env.APP_ADMIN_URL as string].filter(
        Boolean
      ),
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
            process.env.APP_WEBSITE_URL as string,
            process.env.APP_ADMIN_URL as string,
            process.env.APP_HTTP_URL as string,
            process.env.APP_SOCKET_URL as string,
          ].filter(Boolean),
        },
      },
    });
    logger.log('Helmet middleware registered with CSP');

    await app.register(ws, {
      options: {
        maxPayload: 1048576,
        clientTracking: true,
        perMessageDeflate: false,
        // verifyClient: (info, cb) => {
        //   const allowedOrigins = [
        //     process.env.APP_WEBSITE_URL as string,
        //     process.env.APP_ADMIN_URL as string,
        //   ].filter(Boolean);

        //   if (allowedOrigins.some((origin) => info.origin.startsWith(origin as string))) {
        //     cb(true);
        //   } else {
        //     cb(false, 401, 'Unauthorized origin');
        //   }
        // },
      },
    });

    logger.log('WebSocket middleware registered');

    await app.register(fastifyTRPCPlugin, {
      prefix: '/trpc',
      useWSS: true,
      trpcOptions: {
        router: appRouter,
        createContext: (opts: any) => {
          return createContext({
            req: opts.req,
            res: opts.res,
            connection: opts.connection,
            app,
            logger,
          });
        },
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
        servers: [{ url: process.env.APP_HTTP_URL as string }],
      },
      hideUntagged: true,
    });

    await app.register(fastifySwaggerUi, {
      routePrefix: `/${process.env.APP_SWAGGER}`,
      transformSpecification: () => {
        return openApiDocument;
      },
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
        tryItOutEnabled: true,
        url: `/${process.env.APP_SWAGGER}/json`,
      },
      staticCSP: true,
    });

    logger.log(`Swagger UI available at ${process.env.APP_BASE_URL}/${process.env.APP_SWAGGER}`);
    logger.log(
      `OpenAPI JSON available at ${process.env.APP_BASE_URL}/${process.env.APP_SWAGGER}/json`
    );

    const staticPath = `${process.cwd()}/${process.env.APP_STATIC_ASSETS as string}`;
    const staticPrefix = `/${process.env.APP_STATIC_ASSETS as string}`;

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
    logger.log(`Deep Linking verification files served at "/.well-known/"`);

    await app.listen(port, '0.0.0.0');
    logger.log(`Fastify Server is running on port ${port}`);

    const shutdown = async (signal: string) => {
      logger.log(`Received ${signal}. Closing server...`);
      await app.close();
      logger.log('Server closed');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error: any) {
    bootstrapLogger.error(`Failed to start server on port ${port}: ${error.message}`, error.stack);
    process.exit(1);
  }
}

bootstrap().catch((err) => {
  const finalLogger = new PinoLogger({
    pinoHttp: { transport: { target: 'pino-pretty', options: { colorize: true } } },
  });
  finalLogger.error(`Bootstrap error: ${err.message}`, err.stack);
  process.exit(1);
});
