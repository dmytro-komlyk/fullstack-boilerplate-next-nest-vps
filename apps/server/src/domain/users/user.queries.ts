import { prisma } from '@package/prisma';
import { TRPCError } from '@trpc/server';

const USER_PROFILE_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  nickName: true,
  avatarUrl: true,
  telegramChatId: true,
  slackWebhookUrl: true,
  discordWebhookUrl: true,
} as const;

export const getDashboardStats = async () => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [counts, usersByRole, usersByStatus, recentSessions, userAgentGroups] = await Promise.all([
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
    prisma.session.groupBy({
      by: ['userAgent'],
      where: { userAgent: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { userAgent: 'desc' } },
      take: 50,
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

  const userAgents = userAgentGroups
    .map((g: { userAgent: string | null }) => g.userAgent)
    .filter((ua: string | null): ua is string => ua !== null);

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
    sessions: { total: totalSessions, active: activeSessions, recent: recentSessions, userAgents },
    invites: {
      total: totalInvites,
      accepted: acceptedInvites,
      pending: pendingInvites,
      expired: expiredInvites,
    },
  };
};

export const getProfile = async ({ userId }: { userId: string }) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: USER_PROFILE_SELECT });

  if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'userNotFound' });

  return user;
};

export const findUser = async ({ email }: { email: string }) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true, nickName: true, status: true, lastActiveAt: true },
  });

  if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'userNotFound' });

  return user;
};
