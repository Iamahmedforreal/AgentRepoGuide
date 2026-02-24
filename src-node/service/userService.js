import prisma from '../lib/prisma.js';

class UserService {
    // Handles both user creation and updates by upserting the user record
    async handleUserCreateEvent(eventData) {
     
        const userId = eventData.id || eventData.user_id || eventData.user?.id;
        if (!userId) {
            throw new Error('Cannot determine user id from event payload');
        }

        const email = eventData.email_address || eventData.email_addresses?.[0]?.email_address || eventData.user?.email_addresses?.[0]?.email_address || null;
        const firstName = eventData.first_name || eventData.user?.first_name || null;
        const lastName = eventData.last_name || eventData.user?.last_name || null;
        const username = eventData.username || eventData.user?.username || null;
        const profileImageUrl = eventData.profile_image_url || eventData.user?.profile_image_url || eventData.user?.image_url || null;

        return prisma.User.upsert({
            where: { clerkId: userId },
            update: {
                email: email,
                firstName: firstName,
                lastName: lastName,
                username: username,
                profileImageUrl: profileImageUrl,
            },
            create: {
                clerkId: userId,
                email: email,
                firstName: firstName,
                lastName: lastName,
                username: username,
                profileImageUrl: profileImageUrl,
            }
        });
    }

    async handleUserUpdateEvent(eventData) {
        return this.handleUserCreateEvent(eventData); 
    }

    async handleUserDeleteEvent(eventData) {
        const clerkId = typeof eventData === 'string' ? eventData : eventData.id || eventData.user_id || eventData.user?.id;
        if (!clerkId) {
            throw new Error('Cannot determine user id from delete event');
        }
        return prisma.User.update({
            where: { clerkId },
            data: { deletedAt: new Date() }
        });
    }
}
export default new UserService();