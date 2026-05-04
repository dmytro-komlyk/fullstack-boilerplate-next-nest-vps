import { prisma } from '@package/prisma';
import { TRPCError } from '@trpc/server';

export const findUser = async ({ email }: { email: string }) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      role: true,
      nickName: true,
      status: true,
      lastActiveAt: true,
    },
  });

  if (!user) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'userNotFound',
    });
  }

  return user;
};

export const banUser = async ({ userId }: { userId: string }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'userNotFound',
    });
  }

  if (user.status === 'BANNED') {
    return {
      message: 'alreadyBanned',
      id: userId,
      isInfo: true,
    };
  }

  await prisma.user.update({ where: { id: userId }, data: { status: 'BANNED' } });

  return {
    message: 'bannedSuccess',
    id: userId,
  };
};

export const unbanUser = async ({ userId }: { userId: string }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'userNotFound',
    });
  }

  if (user.status === 'ACTIVE') {
    return {
      message: 'alreadyActive',
      id: userId,
      isInfo: true,
    };
  }

  await prisma.user.update({ where: { id: userId }, data: { status: 'ACTIVE' } });

  return {
    message: 'unbannedSuccess',
    id: userId,
  };
};
