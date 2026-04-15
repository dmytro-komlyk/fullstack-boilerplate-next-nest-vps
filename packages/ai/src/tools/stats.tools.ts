import { prisma, User } from '@package/prisma';
import fs from 'fs';
import path from 'path';

export const statsTools = {
  getUserCounts: async () => {
    const counts = await prisma.user.groupBy({
      by: ['role'],
      _count: { _all: true },
    });
    return JSON.stringify(counts);
  },
  getActiveUsers: async () => {
    const activeSince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // last 7 days

    const activeUsers = await prisma.user.count({
      where: { lastActiveAt: { gte: activeSince } },
    });

    return `Active users in the last 7 days: ${activeUsers}`;
  },
  getRegistrationsByDay: async () => {
    const registrations = await prisma.user.groupBy({
      by: ['createdAt'],
      _count: { _all: true },
    });

    return registrations
      .map((r: { createdAt: Date; _count: { _all: number } }) => {
        const date = r.createdAt.toISOString().split('T')[0];
        return `${date}: ${r._count._all}`;
      })
      .join('\n');
  },
  getTopUsers: async () => {
    const topUsers = await prisma.user.findMany({
      orderBy: { lastActiveAt: 'desc' },
      take: 10,
      select: { email: true, nickName: true, lastActiveAt: true },
    });

    return topUsers
      .map(
        (u: Pick<User, 'email' | 'nickName' | 'lastActiveAt'>) =>
          `${u.nickName} (${u.email}) - Last active: ${u.lastActiveAt ? u.lastActiveAt.toISOString() : 'N/A'}`
      )
      .join('\n');
  },
  getGrowthRate: async () => {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [total, newUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: dayAgo } } }),
    ]);

    return `Total users: ${total}
New users (24h): ${newUsers}`;
  },
  getRoleDistribution: async () => {
    const roles = await prisma.user.groupBy({
      by: ['role'],
      _count: { _all: true },
    });

    if (roles.length === 0) return 'Information not found in database';

    return roles
      .map((r: { role: User['role']; _count: { _all: number } }) => `${r.role}: ${r._count._all}`)
      .join('\n');
  },
  exportUsersToCSV: async () => {
    const users = await prisma.user.findMany({
      where: {
        role: { in: ['USER'] },
      },
      select: {
        email: true,
        nickName: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    if (users.length === 0) return 'Information not found in database';

    const header = 'NickName,Email,Role,Status,RegisteredAt\n';

    const rows = users
      .map(
        (u: Pick<User, 'nickName' | 'email' | 'role' | 'status' | 'createdAt'>) =>
          `${u.nickName || 'User'},${u.email},${u.role},${u.status},${u.createdAt.toISOString()}`
      )
      .join('\n');

    const fileName = `users_export_${Date.now()}.csv`;
    const assetsDir = process.env.APP_STATIC_ASSETS || 'static';
    const filePath = path.join(process.cwd(), assetsDir, 'exports', fileName);

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, header + rows);

    const url = `${process.env.APP_BASE_URL}/${assetsDir}/exports/${fileName}`;

    return `[📥 ${fileName}](${url})`;
  },
  exportEmployeesToCSV: async () => {
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'MODERATOR'] },
      },
      select: {
        email: true,
        nickName: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    if (admins.length === 0) return 'Information not found in database';

    const header = 'NickName,Email,Role,Status,RegisteredAt\n';

    const rows = admins
      .map(
        (u: Pick<User, 'nickName' | 'email' | 'role' | 'status' | 'createdAt'>) =>
          `${u.nickName || 'Admin'},${u.email},${u.role},${u.status},${u.createdAt.toISOString()}`
      )
      .join('\n');

    const fileName = `admins_export_${Date.now()}.csv`;
    const assetsDir = process.env.APP_STATIC_ASSETS || 'static';
    const filePath = path.join(process.cwd(), assetsDir, 'exports', fileName);

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, header + rows);

    const url = `${process.env.APP_BASE_URL}/${assetsDir}/exports/${fileName}`;

    return `[📥 ${fileName}](${url})`;
  },
  exportActiveUsersToCSV: async () => {
    const activeSince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // last 7 days

    const activeUsers = await prisma.user.findMany({
      where: { lastActiveAt: { gte: activeSince } },
      select: {
        email: true,
        nickName: true,
        role: true,
        status: true,
        createdAt: true,
        lastActiveAt: true,
      },
    });

    if (activeUsers.length === 0) return 'Information not found in database';

    const header = 'NickName,Email,Role,Status,RegisteredAt,LastActiveAt\n';

    const rows = activeUsers
      .map(
        (u: Pick<User, 'nickName' | 'email' | 'role' | 'status' | 'createdAt' | 'lastActiveAt'>) =>
          `${u.nickName || 'User'},${u.email},${u.role},${u.status},${u.createdAt.toISOString()},${u.lastActiveAt ? u.lastActiveAt.toISOString() : 'N/A'}`
      )
      .join('\n');

    const fileName = `active_users_export_${Date.now()}.csv`;
    const assetsDir = process.env.APP_STATIC_ASSETS || 'static';
    const filePath = path.join(process.cwd(), assetsDir, 'exports', fileName);

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, header + rows);

    const url = `${process.env.APP_BASE_URL}/${assetsDir}/exports/${fileName}`;

    return `[📥 ${fileName}](${url})`;
  },
  exportFilteredUsersToCSV: async ({ role }: { role: User['role'] }) => {
    const users = await prisma.user.findMany({
      where: { role },
      select: {
        email: true,
        nickName: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    if (users.length === 0) return 'Information not found in database';

    const header = 'NickName,Email,Role,Status,RegisteredAt\n';

    const rows = users
      .map(
        (u: Pick<User, 'nickName' | 'email' | 'role' | 'status' | 'createdAt'>) =>
          `${u.nickName || 'User'},${u.email},${u.role},${u.status},${u.createdAt.toISOString()}`
      )
      .join('\n');

    const fileName = `users_${role.toLowerCase()}_export_${Date.now()}.csv`;
    const assetsDir = process.env.APP_STATIC_ASSETS || 'static';
    const filePath = path.join(process.cwd(), assetsDir, 'exports', fileName);

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, header + rows);

    const url = `${process.env.APP_BASE_URL}/${assetsDir}/exports/${fileName}`;

    return `[📥 ${fileName}](${url})`;
  },
};
