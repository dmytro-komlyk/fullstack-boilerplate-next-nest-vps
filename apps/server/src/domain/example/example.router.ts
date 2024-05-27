import { Injectable } from '@nestjs/common';

import { z } from 'zod';

import { TrpcService } from '../trpc/trpc.service';
import { ExampleService } from './example.service';
import { updateExampleSchema } from './schemas/example.schema';

@Injectable()
export class ExampleRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly exampleService: ExampleService,
  ) {}

  exampleRouter = this.trpc.router({
    getAll: this.trpc.procedure.query(async () => {
      return await this.exampleService.findAll();
    }),
    getById: this.trpc.procedure.input(z.string()).query(async ({ input }) => {
      return await this.exampleService.findById(input);
    }),
    update: this.trpc.procedure
      .input(updateExampleSchema)
      .mutation(async ({ input }) => {
        return await this.exampleService.update(input);
      }),
  });
}
