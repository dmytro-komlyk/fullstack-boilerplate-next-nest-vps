import { Injectable } from '@nestjs/common';
import { TrpcService } from '@server/domain/trpc/trpc.service';
import { UserService } from '@server/domain/users/users.service';
import z from 'zod';
import { AuthService } from './auth.service';
import {
  loginSchema,
  outputAuthSchema,
  signUpSchema,
} from './schemas/auth.schema';

@Injectable()
export class AuthRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly usersService: UserService,
    private readonly authService: AuthService,
  ) {}

  authRouter = this.trpc.router({
    register: this.trpc.procedure
      .meta({
        openapi: {
          method: 'POST',
          path: '/register',
          tags: ['auth'],
          summary: 'Register new user',
        },
      })
      .input(signUpSchema)
      .output(z.void())
      .mutation(async ({ input }: any) => {
        await this.authService.isExistAdmin();
        const newUser = await this.usersService.create({ ...input });
        await this.authService.signUp(newUser);
      }),
    login: this.trpc.procedure
      .meta({
        openapi: {
          method: 'POST',
          path: '/login',
          tags: ['auth'],
          summary: 'Login user',
        },
      })
      .input(loginSchema)
      .output(outputAuthSchema)
      .mutation(async ({ input }: any) => {
        return await this.authService.login({ ...input });
      }),
  });
}
