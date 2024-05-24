import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { TrpcService } from '../trpc/trpc.service';
import { ExampleService } from './example.service';

@Module({
  imports: [PrismaModule],
  providers: [ExampleService, TrpcService], // Import routers if need which we use services it
  exports: [ExampleService],
})
export class ExampleModule {}
