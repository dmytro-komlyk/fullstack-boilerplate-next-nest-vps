import { Invite, prisma, User } from '@package/prisma';
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
    return `Invite created for ${invite.email}. Role: ${invite.role}. URL: ${inviteUrl}`;
  },
  getPendingInvites: async () => {
    const invites = await prisma.invite.findMany({
      where: { isAccepted: false, expiresAt: { gte: new Date() } },
    });

    if (invites.length === 0) return 'No pending invites.';

    const baseUrl = process.env.APP_BASE_URL;

    return invites
      .map((i: Invite) => {
        const url = `${baseUrl}/auth/sign-up?token=${i.token}`;
        const expiry = i.expiresAt.toLocaleString();

        return `### Invite for ${i.email}\n- **Role**: ${i.role}\n- **Link**: \`${url}\` \n- **Expires**: ${expiry}`;
      })
      .join('\n\n---\n\n');
  },
};
