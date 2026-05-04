import { prisma, User } from '@package/prisma';
import crypto from 'node:crypto';

export const invitesTools = {
  createInvite: async ({ email, role }: { email: string; role: User['role'] }) => {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours expiration

    const invite = await prisma.invite.create({
      data: {
        email: email.trim(),
        role,
        token,
        expiresAt,
      },
    });

    const inviteUrl = `${process.env.APP_BASE_URL}/auth/sign-up?token=${invite.token}`;
    return {
      success: true,
      email: invite.email,
      role: invite.role,
      inviteUrl,
      expiresAt: invite.expiresAt.toISOString(),
    };
  },
  getPendingInvites: async () => {
    const invites = await prisma.invite.findMany({
      where: { isAccepted: false, expiresAt: { gte: new Date() } },
    });

    if (invites.length === 0) return { message: 'No pending invites.' };

    const baseUrl = process.env.APP_BASE_URL;

    return invites.map((i) => ({
      email: i.email,
      role: i.role,
      url: `${baseUrl}/auth/sign-up?token=${i.token}`,
      expires: i.expiresAt,
    }));
  },
};
