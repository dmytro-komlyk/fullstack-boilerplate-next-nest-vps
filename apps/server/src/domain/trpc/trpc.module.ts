import { Module } from '@nestjs/common';
import { PrismaModule } from '@server/domain/prisma/prisma.module';
import { TrpcRouter } from '@server/domain/trpc/trpc.router';
import { TrpcService } from '@server/domain/trpc/trpc.service';
import { ExampleRouter } from '../example/example.router';
import { ExampleService } from '../example/example.service';

@Module({
  imports: [PrismaModule],
  providers: [TrpcService, TrpcRouter, ExampleService, ExampleRouter], // Add all services and routers which we use
  exports: [TrpcService],
})
export class TrpcModule {}
