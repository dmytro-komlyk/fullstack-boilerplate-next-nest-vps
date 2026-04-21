import { tool } from 'ai';
import z from 'zod';

import { User } from '@package/prisma';

import { invitesTools } from './invites.tools';
import { securityTools } from './security.tools';
import { statsTools } from './stats.tools';
import { systemTools } from './system.tools';
import { usersTools } from './users.tools';

export const getTools = (isAdmin: boolean) => {
  const publicTools = {
    getWelcomeMessage: tool({
      description:
        'Get welcome message and assistant capabilities. Call this when the user says "hello" or asks what you can do.',
      parameters: z.object({}),
      execute: async () => await systemTools.getWelcomeMessage(),
    } as any),

    getSystemStatus: tool({
      description:
        'Check system health, database connection, and support response time. Use this to answer questions about platform stability.',
      parameters: z.object({}),
      execute: async () => await systemTools.getSystemStatus(),
    } as any),
  };

  if (!isAdmin) return publicTools;

  return {
    ...publicTools,
    // --- INVITES ---
    createInvite: tool({
      description:
        'Create a new invitation. IMPORTANT: You must always show the full generated URL to the user.',
      parameters: z.object({
        email: z.email(),
        role: z.enum(['ADMIN', 'MODERATOR', 'USER']),
      }),
      execute: async ({ email, role }: { email: string; role: User['role'] }) =>
        await invitesTools.createInvite({ email, role }),
    } as any),
    getPendingInvites: tool({
      description:
        'Get a list of all pending invites. IMPORTANT: You must display the full output exactly as provided, including links and expiration dates.',
      parameters: z.object({}),
      execute: async () => await invitesTools.getPendingInvites(),
    } as any),

    // --- STATISTICS & EXPORT ---
    getUserCounts: tool({
      description:
        'Get the total number of users and their distribution by roles (ADMIN, MODERATOR, USER). Use for queries like "how many users are there in total" or "what is the distribution of roles".',
      parameters: z.object({}),
      execute: async () => await statsTools.getUserCounts(),
    } as any),
    getActiveUsers: tool({
      description:
        'Get the number of unique users who were active in the last 7 days. Useful for evaluating platform activity.',
      parameters: z.object({}),
      execute: async () => await statsTools.getActiveUsers(),
    } as any),
    getRegistrationsByDay: tool({
      description:
        'Get historical registration trend for the last month. Do NOT use for "today" or "24h" queries.',
      parameters: z.object({}),
      execute: async () => await statsTools.getRegistrationsByDay(),
    } as any),
    getTopUsers: tool({
      description:
        'Get a list of the 10 users who have logged in recently. Shows email, nickname and exact time of last activity.',
      parameters: z.object({}),
      execute: async () => await statsTools.getTopUsers(),
    } as any),
    getGrowthRate: tool({
      description:
        'Use this ONLY to answer questions about registrations TODAY, in the LAST 24 HOURS, or CURRENT GROWTH. Returns the exact number of new users.',
      parameters: z.object({}),
      execute: async () => await statsTools.getGrowthRate(),
    } as any),
    exportUsers: tool({
      description:
        'Export users to CSV. Call this tool FIRST if the query contains the word "report" or "CSV".',
      parameters: z.object({
        type: z.enum(['ALL', 'EMPLOYEES', 'ACTIVE', 'BY_ROLE']).default('ALL'),
        role: z.enum(['ADMIN', 'USER', 'MODERATOR', 'SUPER_ADMIN']).optional(),
      }),
      execute: async (args: {
        type?: 'ALL' | 'EMPLOYEES' | 'ACTIVE' | 'BY_ROLE';
        role?: User['role'];
      }) => await statsTools.exportUsers(args),
    } as any),
    getUserSessions: tool({
      description: `
      Get a list of recent user sessions. 
      Returns IP addresses, device types, and time of last activity. 
      Use to check for suspicious logins to a user account.
      `,
      parameters: z.object({ email: z.string().email() }),
      execute: async ({ email }: { email: string }) =>
        await securityTools.getUserSessions({ email }),
    } as any),
    unlockUser: tool({
      description: `
      Unlock user account. 
      Resets failed login attempts counter and removes login time limit. 
      Use ONLY at the direct request of the administrator to unlock a specific email.
      `,
      parameters: z.object({ email: z.string().email() }),
      execute: async ({ email }: { email: string }) => await securityTools.unlockUser({ email }),
    } as any),
    getSecurityAlerts: tool({
      description: `
      Scan the system for threats. 
      Returns a list of users who have had more than 3 failed login attempts. 
      Use when the administrator asks "are there any security issues" or "who is trying to hack the system".
      `,
      parameters: z.object({}),
      execute: async () => await securityTools.getSecurityAlerts(),
    } as any),

    // --- USER MANAGEMENT ---
    getAdminList: tool({
      description:
        'Get a list of all system administrators and moderators. Use when you need to know who has elevated access rights.',
      parameters: z.object({}),
      execute: async () => await usersTools.getAdminList(),
    } as any),
    getRecentUsers: tool({
      description:
        'Show a list of the last registered users. MUST use the limit parameter if the user specified a number.',
      parameters: z.object({
        limit: z.number().min(1).max(50).optional().default(5),
      }),
      execute: async ({ limit }: { limit: number }) => await usersTools.getRecentUsers({ limit }),
    } as any),
    findUser: tool({
      description:
        'Find complete information about a specific user by their email. Returns nickname, role, status and registration date.',
      parameters: z.object({
        email: z.string().email(),
      }),
      execute: async ({ email }: { email: string }) => await usersTools.findUser({ email }),
    } as any),
    banUser: tool({
      description:
        'BLOCK access to a user. Use only if there is a direct instruction to ban or block a specific email.',
      parameters: z.object({
        userId: z.string().uuid(),
      }),
      execute: async ({ userId }: { userId: string }) => await usersTools.banUser({ userId }),
    } as any),
    unbanUser: tool({
      description: 'Restore access to a blocked user. Use to unban after email verification.',
      parameters: z.object({
        userId: z.string().uuid(),
      }),
      execute: async ({ userId }: { userId: string }) => await usersTools.unbanUser({ userId }),
    } as any),
    deleteUser: tool({
      description:
        'IRREVERSIBLE deletion of a user account from the database. Use with caution and only delete a user upon direct request.',
      parameters: z.object({
        userId: z.string().uuid(),
      }),
      execute: async ({ userId }: { userId: string }) => await usersTools.deleteUser({ userId }),
    } as any),
    updateUserRole: tool({
      description:
        'Change user access level. Allows you to assign the role ADMIN, MODERATOR, USER or SUPER_ADMIN.',
      parameters: z.object({
        userId: z.string().uuid(),
        newRole: z.enum(['ADMIN', 'USER', 'MODERATOR', 'SUPER_ADMIN']),
      }),
      execute: async ({
        userId,
        newRole,
      }: {
        userId: string;
        newRole: 'ADMIN' | 'USER' | 'MODERATOR' | 'SUPER_ADMIN';
      }) => await usersTools.updateUserRole({ userId, newRole }),
    } as any),
  };
};
