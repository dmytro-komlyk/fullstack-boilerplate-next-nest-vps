import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { TRPCError, inferAsyncReturnType, initTRPC } from '@trpc/server';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { OpenApiMeta } from 'trpc-openapi';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TrpcService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  decodeAndVerifyJwtToken = async (token: string) => {
    try {
      const decodedToken = await this.jwt.verifyAsync(token, {
        secret: process.env.JWT_ACCESS_TOKEN_KEY,
      });

      const user = this.prisma.user.findUnique({
        where: {
          id: decodedToken.sub,
        },
      });

      return user;
    } catch (error) {
      // Token verification failed
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Error decoding or verifying JWT token',
      });
    }
  };

  getUserFromHeader = async (req: any): Promise<User | null> => {
    if (req.headers.authorization) {
      const user = await this.decodeAndVerifyJwtToken(
        req.headers.authorization.split(' ')[1],
      );
      return user;
    }
    return null;
  };

  createContext = async (opts?: CreateExpressContextOptions) => {
    // Create your context based on the request object
    // Will be available as `ctx` in all your resolvers
    // This is just an example of something you might want to do in your ctx fn
    const user = await this.getUserFromHeader(opts?.req);

    const userContext = user
      ? {
          id: user.id,
          name: user.name,
          email: user.email,
          accessToken: user.accessToken,
          accessTokenExpires: user.accessTokenExpires,
        }
      : null;

    return {
      user: userContext,
    };
  };
  trpc = initTRPC
    .meta<OpenApiMeta>()
    .context<inferAsyncReturnType<typeof this.createContext>>()
    .create();
  procedure = this.trpc.procedure;
  authorised = this.trpc.middleware(async ({ ctx, next }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

    return next();
  });
  protectedProcedure = this.trpc.procedure.use(this.authorised);
  router = this.trpc.router;
  createCallerFactory = this.trpc.createCallerFactory;
  mergeRouters = this.trpc.mergeRouters;
}
