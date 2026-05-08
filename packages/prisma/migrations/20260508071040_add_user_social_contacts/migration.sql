-- AlterTable
ALTER TABLE "users" ADD COLUMN     "discordWebhookUrl" TEXT,
ADD COLUMN     "slackWebhookUrl" TEXT,
ADD COLUMN     "telegramChatId" TEXT;
