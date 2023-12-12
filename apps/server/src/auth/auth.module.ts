import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@server/prisma/prisma.service';
import { UserService } from '@server/user/user.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, UserService, PrismaService, JwtService],
})
export class AuthModule {}
