/*
  Warnings:

  - You are about to drop the column `name` on the `RepoFile` table. All the data in the column will be lost.
  - You are about to drop the column `path` on the `RepoFile` table. All the data in the column will be lost.
  - You are about to drop the `RepoStructure` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[repositoryId,filePath]` on the table `RepoFile` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,githubUrl]` on the table `Repository` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fileName` to the `RepoFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `filePath` to the `RepoFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `RepoFile` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('PENDING', 'PROCESSING', 'EMBEDDED', 'SKIPPED', 'FAILED');

-- DropForeignKey
ALTER TABLE "RepoFile" DROP CONSTRAINT "RepoFile_repositoryId_fkey";

-- DropForeignKey
ALTER TABLE "RepoStructure" DROP CONSTRAINT "RepoStructure_repositoryId_fkey";

-- AlterTable
ALTER TABLE "RepoFile" DROP COLUMN "name",
DROP COLUMN "path",
ADD COLUMN     "contentHash" TEXT,
ADD COLUMN     "fileName" TEXT NOT NULL,
ADD COLUMN     "filePath" TEXT NOT NULL,
ADD COLUMN     "isEntryPoint" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isGenerated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isTest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lineCount" INTEGER,
ADD COLUMN     "rawContent" TEXT,
ADD COLUMN     "skippedReason" TEXT,
ADD COLUMN     "status" "FileStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Repository" ADD COLUMN     "description" TEXT,
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "license" TEXT,
ADD COLUMN     "repoCreatedAt" TIMESTAMP(3),
ADD COLUMN     "repoUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "stars" INTEGER,
ADD COLUMN     "topics" TEXT[];

-- DropTable
DROP TABLE "RepoStructure";

-- CreateIndex
CREATE INDEX "RepoFile_status_idx" ON "RepoFile"("status");

-- CreateIndex
CREATE INDEX "RepoFile_language_idx" ON "RepoFile"("language");

-- CreateIndex
CREATE INDEX "RepoFile_extension_idx" ON "RepoFile"("extension");

-- CreateIndex
CREATE UNIQUE INDEX "RepoFile_repositoryId_filePath_key" ON "RepoFile"("repositoryId", "filePath");

-- CreateIndex
CREATE INDEX "Repository_userId_idx" ON "Repository"("userId");

-- CreateIndex
CREATE INDEX "Repository_language_idx" ON "Repository"("language");

-- CreateIndex
CREATE INDEX "Repository_status_idx" ON "Repository"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Repository_userId_githubUrl_key" ON "Repository"("userId", "githubUrl");

-- AddForeignKey
ALTER TABLE "RepoFile" ADD CONSTRAINT "RepoFile_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;
