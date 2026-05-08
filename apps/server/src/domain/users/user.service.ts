import { prisma } from '@package/prisma';
import { TRPCError } from '@trpc/server';
import { type z } from 'zod';

import { type updateContactsSchema, type updateProfileSchema } from './user.schema';

export const getDashboardStats = async () => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [counts, usersByRole, usersByStatus, recentSessions, allUserAgents] = await Promise.all([
    Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isOnline: true } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.session.count(),
      prisma.session.count({ where: { expiresAt: { gt: now } } }),
      prisma.invite.count(),
      prisma.invite.count({ where: { isAccepted: true } }),
      prisma.invite.count({ where: { isAccepted: false, expiresAt: { gt: now } } }),
      prisma.invite.count({ where: { isAccepted: false, expiresAt: { lte: now } } }),
    ]),
    prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
    prisma.user.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.session.findMany({
      take: 20,
      orderBy: { lastActiveAt: 'desc' },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        lastActiveAt: true,
        expiresAt: true,
        isTwoFactorVerified: true,
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    }),
    prisma.session.findMany({
      where: { userAgent: { not: null } },
      select: { userAgent: true },
      take: 1000,
    }),
  ]);

  const [
    totalUsers,
    onlineUsers,
    newThisWeek,
    newThisMonth,
    totalSessions,
    activeSessions,
    totalInvites,
    acceptedInvites,
    pendingInvites,
    expiredInvites,
  ] = counts;

  return {
    users: {
      total: totalUsers,
      online: onlineUsers,
      newThisWeek,
      newThisMonth,
      byRole: usersByRole.map((r: { role: string; _count: { _all: number } }) => ({
        role: r.role,
        count: r._count._all,
      })),
      byStatus: usersByStatus.map((s: { status: string; _count: { _all: number } }) => ({
        status: s.status,
        count: s._count._all,
      })),
    },
    sessions: {
      total: totalSessions,
      active: activeSessions,
      recent: recentSessions,
      userAgents: allUserAgents
        .map((s: { userAgent: string | null }) => s.userAgent)
        .filter((ua: string | null): ua is string => ua !== null),
    },
    invites: {
      total: totalInvites,
      accepted: acceptedInvites,
      pending: pendingInvites,
      expired: expiredInvites,
    },
  };
};

export const getProfile = async ({ userId }: { userId: string }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      nickName: true,
      avatarUrl: true,
      telegramChatId: true,
      slackWebhookUrl: true,
      discordWebhookUrl: true,
    },
  });

  if (!user) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'userNotFound' });
  }

  return user;
};

export const updateProfile = async ({
  userId,
  data,
}: {
  userId: string;
  data: z.infer<typeof updateProfileSchema>;
}) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'userNotFound' });
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.firstName !== undefined && { firstName: data.firstName }),
      ...(data.lastName !== undefined && { lastName: data.lastName }),
      ...(data.nickName !== undefined && { nickName: data.nickName }),
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl || null }),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      nickName: true,
      avatarUrl: true,
      telegramChatId: true,
      slackWebhookUrl: true,
      discordWebhookUrl: true,
    },
  });
};

export const updateContacts = async ({
  userId,
  data,
}: {
  userId: string;
  data: z.infer<typeof updateContactsSchema>;
}) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'userNotFound' });
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.telegramChatId !== undefined && { telegramChatId: data.telegramChatId }),
      ...(data.slackWebhookUrl !== undefined && { slackWebhookUrl: data.slackWebhookUrl }),
      ...(data.discordWebhookUrl !== undefined && { discordWebhookUrl: data.discordWebhookUrl }),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      nickName: true,
      avatarUrl: true,
      telegramChatId: true,
      slackWebhookUrl: true,
      discordWebhookUrl: true,
    },
  });
};

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
