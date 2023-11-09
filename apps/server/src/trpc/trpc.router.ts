import { INestApplication, Injectable } from '@nestjs/common';
import { TrpcService } from '@server/trpc/trpc.service';
import * as trpcExpress from '@trpc/server/adapters/express';
import { z } from 'zod';

@Injectable()
export class TrpcRouter {
  constructor(private readonly trpc: TrpcService) {}

  // Merge routers together
  appRouter = this.trpc.router({
    by: this.trpc.procedure
      .input(z.object({ name: z.string().optional() }))
      .query(({ input }) => {
        return `FullStack Boilerplate by ${
          input.name ? input.name : `Dmytro Komlyk`
        }`;
      }),
  });

  async applyMiddleware(app: INestApplication) {
    app.use(
      process.env.TRPC,
      trpcExpress.createExpressMiddleware({ router: this.appRouter }),
    );
  }
}

export type AppRouter = TrpcRouter['appRouter'];
