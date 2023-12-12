import { Module } from '@nestjs/common';
import { PrismaModule } from '@server/prisma/prisma.module';
import { TrpcRouter } from '@server/trpc/trpc.router';
import { TrpcService } from '@server/trpc/trpc.service';

@Module({
  providers: [TrpcService, TrpcRouter],
  imports: [PrismaModule],
})
export class TrpcModule {}
