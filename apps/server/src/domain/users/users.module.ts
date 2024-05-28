import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TrpcService } from '../trpc/trpc.service';
import { UserRouter } from './users.router';
import { UserService } from './users.service';

@Module({
  imports: [PrismaModule],
  providers: [UserService, UserRouter, TrpcService],
  exports: [UserService],
})
export class UsersModule {}
