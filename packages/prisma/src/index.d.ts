import { PrismaClient } from './generated/client/client';
export declare const prisma: PrismaClient;
export declare const connectPrisma: () => Promise<void>;
export declare const disconnectPrisma: () => Promise<void>;
export type {
  Account,
  Invite,
  PrismaClient,
  Session,
  Token,
  User,
  VerificationToken,
} from './generated/client/client';
//# sourceMappingURL=index.d.ts.map
