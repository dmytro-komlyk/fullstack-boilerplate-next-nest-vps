import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).nullable().optional(),
  lastName: z.string().min(1).nullable().optional(),
  nickName: z.string().min(1).nullable().optional(),
  avatarUrl: z
    .union([z.string().url(), z.literal('')])
    .nullable()
    .optional(),
});

export const updateContactsSchema = z.object({
  telegramChatId: z.string().nullable().optional(),
  slackWebhookUrl: z.string().url().nullable().optional(),
  discordWebhookUrl: z.string().url().nullable().optional(),
});

export const outputUserProfileSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  nickName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  telegramChatId: z.string().nullable(),
  slackWebhookUrl: z.string().nullable(),
  discordWebhookUrl: z.string().nullable(),
});

const sessionUserSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
});

const recentSessionSchema = z.object({
  id: z.string(),
  userAgent: z.string().nullable(),
  ipAddress: z.string().nullable(),
  lastActiveAt: z.date(),
  expiresAt: z.date(),
  isTwoFactorVerified: z.boolean(),
  user: sessionUserSchema,
});

export const outputDashboardStatsSchema = z.object({
  users: z.object({
    total: z.number(),
    online: z.number(),
    newThisWeek: z.number(),
    newThisMonth: z.number(),
    byRole: z.array(z.object({ role: z.string(), count: z.number() })),
    byStatus: z.array(z.object({ status: z.string(), count: z.number() })),
  }),
  sessions: z.object({
    total: z.number(),
    active: z.number(),
    recent: z.array(recentSessionSchema),
    userAgents: z.array(z.string()),
  }),
  invites: z.object({
    total: z.number(),
    accepted: z.number(),
    pending: z.number(),
    expired: z.number(),
  }),
});
