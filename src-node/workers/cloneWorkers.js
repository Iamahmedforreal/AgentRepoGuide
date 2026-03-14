import redis from "../config/redis.js";
import { REPO_CLONE_QUEUE_NAME } from "../config/queue.js";
import { Worker } from "bullmq";
import prisma from "../lib/prisma.js";
import urlService from "../service/urlService.js";

// Worker to process repository cloning jobs
export const cloneWorker = new Worker(
  REPO_CLONE_QUEUE_NAME,
  async (job) => {
    const { jobId, repoId, githubUrl, repoOwner, repoName } = job.data;

    try {
      // Mark job + repo as running
      await prisma.ingestionJob.update({
        where: { id: jobId },
        data: { status: 'RUNNING', startedAt: new Date() },
      });

      await prisma.repository.update({
        where: { id: repoId },
        data: { status: 'PROCESSING' },
      });

      const localPath = await urlService._cloneRepository(
        githubUrl,
        repoOwner,
        repoName
      );

      // Mark job + repo as completed
      await prisma.ingestionJob.update({
        where: { id: jobId },
        data: { status: 'COMPLETED', finishedAt: new Date() },
      });

      await prisma.repository.update({
        where: { id: repoId },
        data: { status: 'READY' },
      });

      console.log(`[cloneWorker] cloned to: ${localPath}`);
      return localPath;
    } catch (err) {
      await prisma.ingestionJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          finishedAt: new Date(),
          errorMessage: err.message,
        },
      });

      await prisma.repository.update({
        where: { id: repoId },
        data: { status: 'FAILED' },
      });

      throw err; // let BullMQ handle retries
    }
  },
  {
    connection: redis,
  }
);

cloneWorker.on('completed', (job) => console.log(`[cloneWorker] done: ${job.id}`));
cloneWorker.on('failed', (job, err) => console.error(`[cloneWorker] failed: ${job.id}`, err));