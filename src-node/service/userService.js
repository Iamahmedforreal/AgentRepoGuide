import parisma from '../lib/parisma.js';
class UserService {

    async handleUserCreateEvent(eventData) {
      return parisma.User.create({
        data: {
            clerkId: eventData.id,
            firstname: eventData.first_name,
            lastname: eventData.last_name,
            email: eventData.email_addresses[0].email_address,
        }
      });
}
async handleUserUpdateEvent(eventData) {
    return parisma.User.update({
        where: { clerkId: eventData.id },
        update: {
            firstname: eventData.first_name,
            lastname: eventData.last_name,
            email: eventData.email_addresses[0].email_address,
        }
    })
}
}