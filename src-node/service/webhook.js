import { Webhook } from 'svix';
import parisma from '../lib/parisma.js';
class WebhookService {
    async isWebhookbeenProcessed(eventId) {
        const existing = await parisma.WebhookEvent.findUnique({
            where: { clerkId: eventId }
        });
        return !!existing;
    }
}
  
export default new WebhookService();