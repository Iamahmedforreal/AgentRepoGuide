
import prisma from '../lib/prisma.js';
class WebhookService {
    async isWebhookbeenProcessed(eventId) {
        //return true if event with clerkId (eventId) exists, false otherwise
        const existing = await prisma.WebhookEvent.findUnique({
            where: { clerkId: eventId }
        });
        return !!existing;
    }

    async recordWebhookEvent(eventId, type, payload) {
        return prisma.WebhookEvent.create({
            data: {
                clerkId: eventId,
                type: type,
                payload: payload,
                processed: false
            }
        });
    }

    async markWebhookAsProcessed(eventId) {
        return prisma.WebhookEvent.update({
            where: { clerkId: eventId },
            data: { processed: true }
        });
    }
}

export default new WebhookService();