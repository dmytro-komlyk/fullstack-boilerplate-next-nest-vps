import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { PrismaService } from '@server/domain/prisma/prisma.service';
import { expiresInToMilliseconds } from '@server/helpers/time-converted.helper';
import { TRPCError } from '@trpc/server';
import { compare } from 'bcryptjs';
import {
  loginSchema,
  outputAuthSchema,
  tokenSchema,
} from './schemas/auth.schema';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async isExistAdmin(): Promise<void> {
    const users = await this.prisma.user.findMany();
    if (users.length > 0) {
      throw new TRPCError({
        message: 'Вже є зареєстрований адмін',
        code: 'NOT_FOUND',
      });
    }
  }

  async login(data: loginSchema): Promise<outputAuthSchema> {
    const { id, ...userData } = await this.validateUser(data);

    const payload = {
      sub: id,
    };
    const accessToken = await this.refreshToken(payload);

    const { name, email, token } = await this.prisma.user.update({
      where: { email: userData.email },
      data: {
        ...userData,
        ...accessToken,
      },
    });

    return { id, name, email, token, ...accessToken };
  }

  async signUp(userData: outputAuthSchema): Promise<outputAuthSchema> {
    const { id, ...restUserData } = userData;
    const token = await this.jwt.signAsync(
      { id: id },
      {
        secret: process.env.JWT_SECRET_KEY,
      },
    );

    return await this.prisma.user.update({
      where: { id: id },
      data: {
        ...restUserData,
        token,
      },
    });
  }

  async validateUser(data: loginSchema): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (!user) {
      throw new TRPCError({
        message: `User with email ${data.email} was not found`,
        code: 'NOT_FOUND',
      });
    }

    if (user && (await compare(data.password, user.password as string))) {
      return user;
    }

    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  async refreshToken(payload: { sub: string }): Promise<tokenSchema> {
    return {
      accessToken: await this.jwt.signAsync(payload, {
        expiresIn: '1d',
        secret: process.env.JWT_ACCESS_TOKEN_KEY,
      }),
      accessTokenExpires: expiresInToMilliseconds('1d') as number,
      refreshToken: await this.jwt.signAsync(payload, {
        expiresIn: '7h',
        secret: process.env.JWT_REFRESH_TOKEN_KEY,
      }),
    };
  }
}
