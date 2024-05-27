import { INestApplication, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthRouter } from '@server/domain/auth/auth.router';
import { ExampleRouter } from '@server/domain/example/example.router';
import { ExampleService } from '@server/domain/example/example.service';
import { PrismaService } from '@server/domain/prisma/prisma.service';
import { TrpcService } from '@server/domain/trpc/trpc.service';
import { UserRouter } from '@server/domain/users/users.router';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import express from 'express';
import { OpenAPIV3 } from 'openapi-types';
import swaggerUi from 'swagger-ui-express';
import { generateOpenApiDocument } from 'trpc-openapi';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../users/users.service';

@Injectable()
export class TrpcRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly example: ExampleRouter,
    private readonly users: UserRouter,
    private readonly auth: AuthRouter,
  ) {}
  appRouter = this.trpc.router({
    // Add all routes
    example: this.example.exampleRouter,
    users: this.users.usersRouter,
    auth: this.auth.authRouter,
  });

  openApiDocument: OpenAPIV3.Document = generateOpenApiDocument(
    this.appRouter,
    {
      title: 'tRPC OpenAPI',
      version: '1.0.0',
      baseUrl: process.env.APP_BASE_URL as string,
      tags: ['auth', 'users', 'example'], //add all tags for swager
    },
  );

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  static getAppRouter() {
    const prismaService = new PrismaService(); /* Init Prisma service */
    const jwtService = new JwtService(); /* Init Trpc service */
    const trpcService = new TrpcService(prismaService, jwtService);

    const trpcRouter = new TrpcRouter(
      trpcService,
      // Init all routes that have been added
      new ExampleRouter(trpcService, new ExampleService(prismaService)),
      new UserRouter(trpcService, new UserService(prismaService)),
      new AuthRouter(
        trpcService,
        new UserService(prismaService),
        new AuthService(prismaService, jwtService),
      ),
    );
    return {
      appRouter: trpcRouter.appRouter,
      createCallerFactory: trpcRouter.trpc.createCallerFactory,
    };
  }

  async applyMiddleware(app: INestApplication) {
    app.use(express.json());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    app.use((req: any, _res: any, next: any) => {
      // API request logger
      console.log('⬅️ ', req.method, req.path, req.body, req.query);

      next();
    });

    app.use(
      `/${process.env.APP_API}/${process.env.APP_TRPC}`,
      createExpressMiddleware({
        router: this.appRouter,
        createContext: this.trpc.createContext,
      }),
    );
    app.use(
      `/${process.env.APP_SWAGER}`,
      swaggerUi.serve,
      swaggerUi.setup(this.openApiDocument),
    );
  }
}

export const { appRouter, createCallerFactory } = TrpcRouter.getAppRouter();
export type AppRouter = TrpcRouter['appRouter'];
