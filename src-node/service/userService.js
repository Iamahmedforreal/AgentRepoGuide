import prisma from '../lib/prisma.js';
import { createClerkClient } from '@clerk/express';
import config from '../config/env.js';

const clerkClient = createClerkClient({ secretKey: config.CLERK_SECRET_KEY });

class UserService {
    async handleUserCreateEvent(eventData) {
        const userId = eventData.id;
        let email = eventData.email_addresses?.[0]?.email_address;

        // Fallback for private OAuth emails
        if (!email) {
            try {
                const user = await clerkClient.users.getUser(userId);
                email = user.emailAddresses?.[0]?.emailAddress;
            } catch (err) {
                console.warn(`[UserService] Could not fetch user ${userId} from Clerk API:`, err.message);
            }
        }

        return prisma.User.upsert({
            where: { clerkId: userId },
            update: {
                email: email,
                firstName: eventData.first_name,
                lastName: eventData.last_name,
                username: eventData.username,
                profileImageUrl: eventData.profile_image_url,
            },
            create: {
                clerkId: userId,
                email: email,
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