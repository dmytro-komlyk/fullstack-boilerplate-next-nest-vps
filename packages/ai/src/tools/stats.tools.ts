import { prisma, User } from '@package/prisma';
import fs from 'fs';
import path from 'path';

function saveAndGetDownloadUrl(fileName: string, content: string): string {
  const assetsDir = process.env.APP_STATIC_ASSETS || 'static';
  const filePath = path.join(process.cwd(), assetsDir, 'exports', fileName);

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);

  const url = `${process.env.APP_BASE_URL}/${assetsDir}/exports/${fileName}`;
  return `[📥 ${fileName}](${url})`;
}

export const statsTools = {
  getUserCounts: async () => {
    const counts = await prisma.user.groupBy({
      by: ['role'],
      _count: { _all: true },
    });
    return counts.map((c) => ({ role: c.role, count: c._count._all }));
  },
  getActiveUsers: async () => {
    const activeSince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // last 7 days

    const activeUsers = await prisma.user.count({
      where: { lastActiveAt: { gte: activeSince } },
    });

    return {
      activeUsersLast7Days: activeUsers,
      since: activeSince.toISOString(),
    };
  },
  getRegistrationsByDay: async () => {
    const registrations = await prisma.user.groupBy({
      by: ['createdAt'],
      _count: { _all: true },
    });

    return registrations.map((r) => ({
      date: r.createdAt.toISOString().split('T')[0],
      count: r._count._all,
    }));
  },
  getTopUsers: async () => {
    const topUsers = await prisma.user.findMany({
      orderBy: { lastActiveAt: 'desc' },
      take: 10,
      select: { email: true, nickName: true, lastActiveAt: true },
    });

    return topUsers;
  },
  getGrowthRate: async () => {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [total, newUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: dayAgo } } }),
    ]);

    return {
      totalUsers: total,
      newUsers24h: newUsers,
      period: '24h',
    };
  },
  exportUsers: async ({
    type = 'ALL',
    role,
  }: {
    type?: 'ALL' | 'EMPLOYEES' | 'ACTIVE' | 'BY_ROLE';
    role?: User['role'];
  }) => {
    let where: any = {};

    if (type === 'EMPLOYEES') {
      where.role = { in: ['ADMIN', 'MODERATOR', 'SUPER_ADMIN'] }; // Додай SUPER_ADMIN сюди
    } else if (type === 'ACTIVE') {
      const activeSince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      where.lastActiveAt = { gte: activeSince };
    } else if (type === 'BY_ROLE' && role) {
      where.role = role;
    } else if (type === 'ALL') {
      where = {};
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        email: true,
        nickName: true,
        role: true,
        status: true,
        createdAt: true,
        lastActiveAt: true,
      },
    });

    if (users.length === 0) return { error: 'No users found for this criteria' };

    const header = 'NickName,Email,Role,Status,RegisteredAt,LastActiveAt\n';
    const rows = users
      .map(
        (u) =>
          `${u.nickName || 'User'},${u.email},${u.role},${u.status},${u.createdAt.toISOString()},${u.lastActiveAt?.toISOString() || 'N/A'}`
      )
      .join('\n');

    const fileName = `export_${type.toLowerCase()}_${Date.now()}.csv`;
    return saveAndGetDownloadUrl(fileName, header + rows);
  },
};
