import { INestApplication, Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { TrpcService } from '@server/trpc/trpc.service';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { OpenAPIV3 } from 'openapi-types';
import swaggerUi from 'swagger-ui-express';
import {
  createOpenApiExpressMiddleware,
  generateOpenApiDocument,
} from 'trpc-openapi';
import { z } from 'zod';

@Injectable()
export class TrpcRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly prisma: PrismaService,
  ) {}
  appRouter = this.trpc.router({
    getExampleTrpc: this.trpc.procedure
      .meta({
        openapi: {
          method: 'GET',
          path: '/getExampleTrpc',
          tags: ['trpc'],
          summary: 'Get trpc example',
        },
      })
      .input(z.object({ id: z.string() }))
      .output(z.object({ text: z.string() }))
      .query(async ({ input }) => {
        const res = await this.prisma.text.findUnique({
          where: { id: input.id },
        });

        return { text: res!.text };
      }),
    editExampleTrpc: this.trpc.procedure
      .meta({
        openapi: {
          method: 'POST',
          path: '/editExampleTrpc',
          tags: ['trpc'],
          summary: 'Edit trpc example',
        },
      })
      .input(z.object({ id: z.string(), text: z.string().min(1) }))
      .output(z.object({ text: z.string() }))
      .mutation(async ({ input }) => {
        // use your ORM of choice
        const res = await this.prisma.text.update({
          where: { id: input.id },
          data: {
            text: input.text,
          },
        });
        return { text: res.text };
      }),
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
    const trpcRouter = new TrpcRouter(new TrpcService(), new PrismaService()); // Подставьте свои сервисы
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
