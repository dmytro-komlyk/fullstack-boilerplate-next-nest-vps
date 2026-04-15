import { prisma, User } from '@package/prisma';

export const usersTools = {
  getUserList: async () => {
    const users = await prisma.user.findMany({
      where: { role: { in: ['USER'] } },
      select: { email: true, role: true, nickName: true },
    });

    return JSON.stringify(
      users.map(
        (a: Pick<User, 'email' | 'role' | 'nickName'>) => `${a.nickName}: ${a.email} [${a.role}]`
      )
    );
  },
  getAdminList: async () => {
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
      select: { email: true, role: true, nickName: true },
    });

    return JSON.stringify(
      admins.map((a: { email: string | null; role: string }) => `${a.email} (${a.role})`)
    );
  },
  getUsersByRole: async ({ role }: { role: string }) => {
    const normalizedRole = role.toUpperCase() as User['role'];
    const users = await prisma.user.findMany({
      where: { role: normalizedRole },
      select: { email: true, nickName: true },
      take: 20,
    });

    return JSON.stringify(
      users.map((u: Pick<User, 'email' | 'nickName'>) => `${u.nickName}: ${u.email}`)
    );
  },
  getRecentUsers: async ({ limit }: { limit: number }) => {
    const take = Math.min(limit ?? 5, 50);

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      select: { email: true, nickName: true, role: true, createdAt: true },
    });

    return JSON.stringify(
      users.map(
        (u: Pick<User, 'email' | 'nickName' | 'role' | 'createdAt'>) =>
          `${u.nickName} ${u.email} ${u.role} ${u.createdAt.toISOString().split('T')[0]}`
      )
    );
  },
  findUser: async ({ email }: { email: string }) => {
    const user = await prisma.user.findUnique({
      where: { email: email.trim() },
    });

    if (!user) {
      return 'User not found';
    }

    return JSON.stringify({
      email: user.email,
      role: user.role,
      status: user.status,
      nickName: user.nickName,
    });
  },
  banUser: async ({ email }: { email: string }) => {
    const user = await prisma.user.findUnique({
      where: { email: email.trim() },
    });

    if (!user) {
      return 'User not found';
    }

    await prisma.user.update({
      where: { email: email.trim() },
      data: { status: 'BANNED' },
    });

    return `User ${email} banned`;
  },
  unbanUser: async ({ email }: { email: string }) => {
    const user = await prisma.user.findUnique({
      where: { email: email.trim() },
    });

    if (!user) {
      return 'User not found';
    }

    await prisma.user.update({
      where: { email: email.trim() },
      data: { status: 'ACTIVE' },
    });

    return `User ${email} unbanned`;
  },
  deleteUser: async ({ email }: { email: string }) => {
    const user = await prisma.user.findUnique({
      where: { email: email.trim() },
    });

    if (!user) {
      return 'User not found';
    }

    await prisma.user.delete({
      where: { email: email.trim() },
    });

    return `User ${email} deleted`;
  },
  updateUserRole: async ({ email, newRole }: { email: string; newRole: string }) => {
    const user = await prisma.user.findUnique({
      where: { email: email.trim() },
    });

    if (!user) {
      return 'User not found';
    }

    const normalizedRole = newRole.toUpperCase() as User['role'];

    if (!['ADMIN', 'USER', 'MODERATOR', 'SUPER_ADMIN'].includes(normalizedRole)) {
      return 'Invalid role specified';
    }

    await prisma.user.update({
      where: { email: email.trim() },
      data: { role: normalizedRole },
    });

    return `User ${email} role updated to ${normalizedRole}`;
  },
};
