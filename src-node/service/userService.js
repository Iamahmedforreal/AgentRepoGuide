import prisma from '../lib/prisma.js';
import { clerkClient } from '@clerk/express';
class UserService {
    async handleUserCreateEvent(eventData) {
        return prisma.User.upsert({
            where: { clerkId: userId },
            update: {
                email: eventData.email_addresses?.[0]?.email_address,
                firstName: eventData.first_name,
                lastName: eventData.last_name,
                username: eventData.username,
                profileImageUrl: eventData.profile_image_url,
            },
            create: {
                clerkId: userId,
                email: eventData.email_addresses?.[0]?.email_address,
                firstName: eventData.first_name,
                lastName: eventData.last_name,
                username: eventData.username,
                profileImageUrl: eventData.profile_image_url,
            }
        });
    }

    async handleUserUpdateEvent(eventData) {
        return this.handleUserCreateEvent(eventData); 
    }

    async handleUserDeleteEvent(eventData) {
        const clerkId = typeof eventData === 'string' ? eventData : eventData.id;
        return prisma.User.update({
            where: { clerkId },
            data: { deletedAt: new Date() }
        });
    }
}
export default new UserService();