/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[clerkId]` on the table `WebhookEvent` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "updatedAt";

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_clerkId_key" ON "WebhookEvent"("clerkId");
