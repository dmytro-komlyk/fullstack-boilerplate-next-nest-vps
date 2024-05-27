import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TrpcService } from '../trpc/trpc.service';
import { UserService } from '../users/users.service';
import { AuthRouter } from './auth.router';
import { AuthService } from './auth.service';

@Module({
  imports: [PrismaModule],
  providers: [AuthService, AuthRouter, UserService, TrpcService],
  exports: [AuthService],
})
export class AuthModule {}
