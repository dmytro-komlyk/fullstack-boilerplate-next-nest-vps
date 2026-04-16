import { prisma, User } from '@package/prisma';

export const usersTools = {
  getUserList: async () => {
    const users = await prisma.user.findMany({
      where: { role: { in: ['USER'] } },
      select: { email: true, role: true, nickName: true, lastActiveAt: true },
    });

    return users;
  },
  getAdminList: async () => {
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
      select: { email: true, role: true, nickName: true, lastActiveAt: true },
    });

    return admins;
  },
  getRecentUsers: async ({ limit }: { limit: number }) => {
    const take = Math.min(limit ?? 5, 50);

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      select: { email: true, nickName: true, role: true, createdAt: true },
    });

    return users;
  },
  findUser: async ({ email }: { email: string }) => {
    const user = await prisma.user.findUnique({
      where: { email: email.trim() },
      select: { email: true, role: true, nickName: true, lastActiveAt: true },
    });

    return user || { error: 'User not found' };
  },
  banUser: async ({ email }: { email: string }) => {
    const user = await prisma.user.findUnique({
      where: { email: email.trim() },
    });

    if (!user) {
      return { error: 'User not found' };
    }

    await prisma.user.update({
      where: { email: email.trim() },
      data: { status: 'BANNED' },
    });

    return { message: `User ${email} banned` };
  },
  unbanUser: async ({ email }: { email: string }) => {
    const user = await prisma.user.findUnique({
      where: { email: email.trim() },
    });

    if (!user) {
      return { error: 'User not found' };
    }

    await prisma.user.update({
      where: { email: email.trim() },
      data: { status: 'ACTIVE' },
    });

    return { message: `User ${email} unbanned` };
  },
  deleteUser: async ({ email }: { email: string }) => {
    const user = await prisma.user.findUnique({
      where: { email: email.trim() },
    });

    if (!user) {
      return { error: 'User not found' };
    }

    await prisma.user.delete({
      where: { email: email.trim() },
    });

    return { message: `User ${email} deleted` };
  },
  updateUserRole: async ({ email, newRole }: { email: string; newRole: User['role'] }) => {
    const user = await prisma.user.findUnique({
      where: { email: email.trim() },
    });

    if (!user) {
      return { error: 'User not found' };
    }

    const normalizedRole = newRole.toUpperCase() as User['role'];

    if (!['ADMIN', 'USER', 'MODERATOR', 'SUPER_ADMIN'].includes(normalizedRole)) {
      return { error: 'Invalid role specified' };
    }

    await prisma.user.update({
      where: { email: email.trim() },
      data: { role: normalizedRole },
    });

    return { message: `User ${email} role updated to ${normalizedRole}` };
  },
};
