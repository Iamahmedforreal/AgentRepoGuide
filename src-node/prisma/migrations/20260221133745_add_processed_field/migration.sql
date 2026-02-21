/*
  Warnings:

  - You are about to drop the column `processed` on the `WebhookEvent` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "WebhookEvent" DROP COLUMN "processed";
