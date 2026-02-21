import {Queue} from "bullmq";
import redis from "./redis.js";

export const WEBHOOK_QUEUE_NAME = "webhook-processing";

export const webhookQueue = new Queue(WEBHOOK_QUEUE_NAME,  {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    }
});

console.log(`Queue ${WEBHOOK_QUEUE_NAME} initialized`);
