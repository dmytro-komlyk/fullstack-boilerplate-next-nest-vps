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
      description: 'Get a welcome message in the specified language',
      parameters: z.object(),
      execute: async () => await systemTools.getWelcomeMessage(),
    } as any),
    getSystemStatus: tool({
      description: 'Check current system operational status and support time',
      parameters: z.object({}),
      execute: async () => await systemTools.getSystemStatus(),
    } as any),
  };

  if (!isAdmin) return publicTools;

  return {
    ...publicTools,
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
    getUserCounts: tool({
      description: 'Get counts of users grouped by their roles',
      parameters: z.object({}),
      execute: async () => await statsTools.getUserCounts(),
    } as any),
    getActiveUsers: tool({
      description: 'Get the number of active users in the last 7 days',
      parameters: z.object({}),
      execute: async () => await statsTools.getActiveUsers(),
    } as any),
    getRegistrationsByDay: tool({
      description: 'Get daily user registration counts for the last month',
      parameters: z.object({}),
      execute: async () => await statsTools.getRegistrationsByDay(),
    } as any),
    getTopUsers: tool({
      description: 'Get a list of top 10 most recently active users',
      parameters: z.object({}),
      execute: async () => await statsTools.getTopUsers(),
    } as any),
    getGrowthRate: tool({
      description: 'Get user growth statistics (total and last 24h)',
      parameters: z.object({}),
      execute: async () => await statsTools.getGrowthRate(),
    } as any),
    getRoleDistribution: tool({
      description: 'Get a list of all roles and how many users each has',
      parameters: z.object({}),
      execute: async () => await statsTools.getRoleDistribution(),
    } as any),
    exportUsersToCSV: tool({
      description: `
    Export users to CSV.

    CRITICAL:
    - You MUST call this tool when user asks about exporting users
    - DO NOT explain manually
    - DO NOT give instructions
    `,
      parameters: z.object({}),
      execute: async () => await statsTools.exportUsersToCSV(),
    } as any),
    getUserSessions: tool({
      description: 'Get list of active user sessions with IP and device info',
      parameters: z.object({ email: z.email() }),
      execute: async ({ email }: { email: string }) =>
        await securityTools.getUserSessions({ email }),
    } as any),
    unlockUser: tool({
      description: 'Unlock user account by resetting failed login attempts',
      parameters: z.object({ email: z.email() }),
      execute: async ({ email }: { email: string }) => await securityTools.unlockUser({ email }),
    } as any),
    getSecurityAlerts: tool({
      description: 'Check for users with multiple failed login attempts',
      parameters: z.object({}),
      execute: async () => await securityTools.getSecurityAlerts(),
    } as any),
    getAdminList: tool({
      description: 'Get a formatted list of all administrators',
      parameters: z.object({}),
      execute: async () => await usersTools.getAdminList(),
    } as any),
    getUsersByRole: tool({
      description: 'Get a list of users filtered by a specific role',
      parameters: z.object({
        role: z.enum(['ADMIN', 'USER', 'MODERATOR', 'SUPER_ADMIN']),
      }),
      execute: async ({ role }: { role: string }) => await usersTools.getUsersByRole({ role }),
    } as any),
    getRecentUsers: tool({
      description: 'Get a list of recently registered users in CSV format',
      parameters: z.object({
        limit: z.number().min(1).max(50).optional().default(5),
      }),
      execute: async ({ limit }: { limit: number }) => await usersTools.getRecentUsers({ limit }),
    } as any),
    findUser: tool({
      description: 'Find a specific user by their email address',
      parameters: z.object({
        email: z.email(),
      }),
      execute: async ({ email }: { email: string }) => await usersTools.findUser({ email }),
    } as any),
    banUser: tool({
      description: 'Ban a specific user by their email address',
      parameters: z.object({
        email: z.email(),
      }),
      execute: async ({ email }: { email: string }) => await usersTools.banUser({ email }),
    } as any),
    unbanUser: tool({
      description: 'Unban a specific user by their email address',
      parameters: z.object({
        email: z.email(),
      }),
      execute: async ({ email }: { email: string }) => await usersTools.unbanUser({ email }),
    } as any),
    deleteUser: tool({
      description: 'Delete a specific user by their email address',
      parameters: z.object({
        email: z.email(),
      }),
      execute: async ({ email }: { email: string }) => await usersTools.deleteUser({ email }),
    } as any),
    updateUserRole: tool({
      description: 'Update a user role by their email address',
      parameters: z.object({
        email: z.email(),
        newRole: z.enum(['ADMIN', 'USER', 'MODERATOR', 'SUPER_ADMIN']),
      }),
      execute: async ({ email, newRole }: { email: string; newRole: string }) =>
        await usersTools.updateUserRole({ email, newRole }),
    } as any),
  };
};
