import { prisma } from '@package/prisma';
import { TRPCError } from '@trpc/server';
import { type z } from 'zod';

import { type updateContactsSchema, type updateProfileSchema } from './user.schema';

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

const handleNotFound = (e: unknown): never => {
  if (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    (e as { code: unknown }).code === 'P2025'
  ) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'userNotFound' });
  }
  throw e as Error;
};

export const updateProfile = async ({
  userId,
  data,
}: {
  userId: string;
  data: z.infer<typeof updateProfileSchema>;
}) => {
  return prisma.user
    .update({
      where: { id: userId },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.nickName !== undefined && { nickName: data.nickName }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl || null }),
      },
      select: USER_PROFILE_SELECT,
    })
    .catch(handleNotFound);
};

export const updateContacts = async ({
  userId,
  data,
}: {
  userId: string;
  data: z.infer<typeof updateContactsSchema>;
}) => {
  return prisma.user
    .update({
      where: { id: userId },
      data: {
        ...(data.telegramChatId !== undefined && { telegramChatId: data.telegramChatId }),
        ...(data.slackWebhookUrl !== undefined && { slackWebhookUrl: data.slackWebhookUrl }),
        ...(data.discordWebhookUrl !== undefined && { discordWebhookUrl: data.discordWebhookUrl }),
      },
      select: USER_PROFILE_SELECT,
    })
    .catch(handleNotFound);
};

export const banUser = async ({ userId }: { userId: string }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'userNotFound' });

  if (user.status === 'BANNED') {
    return { message: 'alreadyBanned', id: userId, isInfo: true };
  }

  await prisma.user.update({ where: { id: userId }, data: { status: 'BANNED' } });

  return { message: 'bannedSuccess', id: userId };
};

export const unbanUser = async ({ userId }: { userId: string }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'userNotFound' });

  if (user.status === 'ACTIVE') {
    return { message: 'alreadyActive', id: userId, isInfo: true };
  }

  await prisma.user.update({ where: { id: userId }, data: { status: 'ACTIVE' } });

  return { message: 'unbannedSuccess', id: userId };
};
