-- AlterTable
ALTER TABLE "users" ADD COLUMN     "twoFactorSetupPending" BOOLEAN NOT NULL DEFAULT false;
