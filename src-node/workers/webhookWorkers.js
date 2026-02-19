import redis from "../config/redis";
import {WEBHOOK_QUEUE_NAME} from "../config/queue.js";
import { UserService } from "../service/index.js";

export const webhookWorker = new Worker(WEBHOOK_QUEUE_NAME, async job => {
    const { type, data, eventid } = job.data;
    try {
    switch (type) {
        case 'user.created':
            await UserService.handleUserCreateEvent(data);
            break;
        case 'user.updated':
            await UserService.handleUserUpdateEvent(data);
            break;
        case 'user.deleted':
            await UserService.handleUserDeleteEvent(data);
            break;
        default:
            console.warn(`Unhandled webhook event type: ${type}`);
 
        }
}catch(err) {
        console.error(`Error processing webhook event: ${err.message}`);
    }
}, {
    connection: redis,
    concurrency: 5
});