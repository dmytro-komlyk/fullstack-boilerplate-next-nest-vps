import { Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { createUserSchema, outputUserSchema } from './schemas/user.schema';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(data: createUserSchema): Promise<outputUserSchema> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (user) {
      throw new TRPCError({
        message: `User with email "${data.email}" already exists`,
        code: 'FORBIDDEN',
      });
    }

    const newUser = await this.prisma.user.create({
      data: {
        ...data,
        password: await hash(data.password, 10),
        token: '',
        accessToken: '',
        accessTokenExpires: 0,
        refreshToken: '',
      },
    });

    return newUser;
  }

  async findByEmail(email: string): Promise<outputUserSchema> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) {
      throw new TRPCError({
        message: `User with email ${email} was not found`,
        code: 'NOT_FOUND',
      });
    }

    return user;
  }

  async findById(id: string): Promise<outputUserSchema> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: id,
      },
    });

    if (!user) {
      throw new TRPCError({
        message: `User with ID ${id} was not found`,
        code: 'NOT_FOUND',
      });
    }
    return user;
  }
}
