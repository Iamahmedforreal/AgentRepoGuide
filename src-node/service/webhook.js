import prisma from '../lib/prisma.js';
class WebhookService {

    async recordIfnew(eventId , type, payload) {
        try{
            const event = await prisma.WebhookEvent.create({
                data: {
                    clerkId: eventId,
                    type: type,
                    payload: payload,
                    createdAt: new Date(),
                }

            })
            return{created: true, event};

        }catch(err) {
            if (err.code === 'P2002') {
                return {created: false, message: 'Event already exists'};
            }
            throw err;
    }
}

    async markWebhookAsProcessed(eventId) {
        return prisma.WebhookEvent.update({
            where: { clerkId: eventId },
            data: { processed: true }
        });
    }
}

export default new WebhookService();