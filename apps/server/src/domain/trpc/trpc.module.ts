import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthRouter } from '@server/domain/auth/auth.router';
import { AuthService } from '@server/domain/auth/auth.service';
import { ExampleRouter } from '@server/domain/example/example.router';
import { ExampleService } from '@server/domain/example/example.service';
import { PrismaModule } from '@server/domain/prisma/prisma.module';
import { TrpcRouter } from '@server/domain/trpc/trpc.router';
import { TrpcService } from '@server/domain/trpc/trpc.service';
import { UserRouter } from '@server/domain/users/users.router';
import { UserService } from '@server/domain/users/users.service';

@Module({
  imports: [PrismaModule],
  providers: [
    TrpcService,
    TrpcRouter,
    ExampleService,
    ExampleRouter,
    UserService,
    UserRouter,
    AuthService,
    AuthRouter,
    JwtService,
  ], // Add all services and routers which we use
  exports: [TrpcService],
})
export class TrpcModule {}
