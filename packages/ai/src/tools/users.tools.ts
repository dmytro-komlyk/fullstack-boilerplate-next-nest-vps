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
      return { error: 'User not found' };
    }

    return user;
  },
  banUser: async ({ userId }: { userId: string }) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { error: 'User not found' };
    }

    if (user.status === 'BANNED') {
      return { message: `User ${user.email} is already banned.` };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status: 'BANNED' },
    });

    return { message: `User ${user.email} banned` };
  },
  unbanUser: async ({ userId }: { userId: string }) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { error: 'User not found' };
    }

    if (user.status === 'ACTIVE') {
      return { message: `User ${user.email} is already active.` };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' },
    });

    return { message: `User ${user.email} unbanned` };
  },
  deleteUser: async ({ userId }: { userId: string }) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { error: 'User not found' };
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return { message: `User ${user.email} deleted` };
  },
  updateUserRole: async ({ userId, newRole }: { userId: string; newRole: User['role'] }) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { error: 'User not found' };
    }

    const normalizedRole = newRole.toUpperCase() as User['role'];

    if (!['ADMIN', 'USER', 'MODERATOR', 'SUPER_ADMIN'].includes(normalizedRole)) {
      return { error: 'Invalid role specified' };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: normalizedRole },
    });

    return { message: `User ${user.email} role updated to ${normalizedRole}` };
  },
};
