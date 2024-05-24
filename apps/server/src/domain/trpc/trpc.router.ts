import { INestApplication, Injectable } from '@nestjs/common';
import { PrismaService } from '@server/domain/prisma/prisma.service';
import { TrpcService } from '@server/domain/trpc/trpc.service';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { OpenAPIV3 } from 'openapi-types';
import swaggerUi from 'swagger-ui-express';
import {
  createOpenApiExpressMiddleware,
  generateOpenApiDocument,
} from 'trpc-openapi';
import { ExampleRouter } from '../example/example.router';
import { ExampleService } from '../example/example.service';

@Injectable()
export class TrpcRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly example: ExampleRouter,
  ) {}
  appRouter = this.trpc.router({
    // Add all routes
    example: this.example.exampleRouter,
  });

  openApiDocument: OpenAPIV3.Document = generateOpenApiDocument(
    this.appRouter,
    {
      title: 'tRPC OpenAPI',
      version: '1.0.0',
      baseUrl: process.env.APP_BASE_URL as string,
    },
  );

  static getAppRouter(): AppRouter {
    const prismaService = new PrismaService({}); /* Init Prisma service */
    const trpcService = new TrpcService(); /* Init Trpc service */

    const trpcRouter = new TrpcRouter(
      trpcService,
      // Init all routes that have been added
      new ExampleRouter(trpcService, new ExampleService(prismaService)),
    );
    return trpcRouter.appRouter;
  }

  async applyMiddleware(app: INestApplication) {
    app.use(
      process.env.APP_TRPC,
      createExpressMiddleware({
        router: this.appRouter,
        createContext: this.trpc.createContext,
      }),
    );
    app.use(
      process.env.APP_API,
      createOpenApiExpressMiddleware({
        router: this.appRouter,
        createContext: undefined,
        responseMeta: undefined,
        onError: undefined,
        maxBodySize: undefined,
      }),
    );
    app.use(
      process.env.APP_SWAGER,
      swaggerUi.serve,
      swaggerUi.setup(this.openApiDocument),
    );
  }
}

export const appRouter = TrpcRouter.getAppRouter();
export type AppRouter = TrpcRouter['appRouter'];
