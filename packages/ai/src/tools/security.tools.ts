import { prisma, Session } from '@package/prisma';

export const securityTools = {
  getUserSessions: async ({ email }: { email: string }) => {
    const user = await prisma.user.findUnique({
      where: { email: email.trim() },
      include: {
        sessions: {
          orderBy: { lastActiveAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!user) return { error: 'User not found' };
    if (user.sessions.length === 0) return { sessions: [], message: 'No active sessions' };

    const sessions = user.sessions.map((s: Session) => ({
      ip: s.ipAddress || 'Unknown',
      device: s.userAgent || 'Unknown',
      lastActive: s.lastActiveAt.toISOString(),
    }));

    return {
      email: email,
      totalActiveSessions: sessions.length,
      sessions: sessions,
    };
  },

  unlockUser: async ({ email }: { email: string }) => {
    const user = await prisma.user.findUnique({ where: { email: email.trim() } });
    if (!user) return { error: 'User not found' };

    await prisma.user.update({
      where: { email: email.trim() },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    return {
      success: true,
      message: `Account for ${email} has been unlocked`,
      resetAttempts: 0,
    };
  },

  getSecurityAlerts: async () => {
    const suspiciousUsers = await prisma.user.findMany({
      where: { failedLoginAttempts: { gt: 3 } },
      select: { email: true, failedLoginAttempts: true, lockedUntil: true },
    });

    if (suspiciousUsers.length === 0) return { message: 'No security alerts at the moment.' };

    return suspiciousUsers.map((u) => ({
      email: u.email,
      attempts: u.failedLoginAttempts,
      isLocked: u.lockedUntil ? u.lockedUntil > new Date() : false,
      lockedUntil: u.lockedUntil?.toISOString() || null,
    }));
  },
};
