import { prisma, Session, User } from '@package/prisma';

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

    if (!user || user.sessions.length === 0) return 'No active sessions found for this user.';

    return user.sessions
      .map(
        (s: Session) =>
          `💻 IP: ${s.ipAddress || 'Unknown'} | Device: ${s.userAgent?.slice(0, 30)}... | Last Active: ${s.lastActiveAt.toISOString()}`
      )
      .join('\n');
  },

  unlockUser: async ({ email }: { email: string }) => {
    const user = await prisma.user.findUnique({ where: { email: email.trim() } });
    if (!user) return 'User not found.';

    await prisma.user.update({
      where: { email: email.trim() },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    return `Account for ${email} has been unlocked and attempts reset.`;
  },

  getSecurityAlerts: async () => {
    const suspiciousUsers = await prisma.user.findMany({
      where: { failedLoginAttempts: { gt: 3 } },
      select: { email: true, failedLoginAttempts: true, lockedUntil: true },
    });

    if (suspiciousUsers.length === 0) return 'No security alerts at the moment.';

    return suspiciousUsers
      .map(
        (u: Pick<User, 'email' | 'failedLoginAttempts' | 'lockedUntil'>) =>
          `🚨 ${u.email}: ${u.failedLoginAttempts} attempts. Locked until: ${u.lockedUntil || 'Not locked'}`
      )
      .join('\n');
  },
};
