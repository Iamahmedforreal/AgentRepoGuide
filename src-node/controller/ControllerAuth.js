import { Webhook } from "svix";
import config from "../config/env.js";

export const clerkWebhookHandler = async (req, res) => {
  try {
    // Verify webhook signature using Clerk's Svix
    const wh = new Webhook(config.CLERK_WEBHOOK_SIGNING_SECRET);
    
    // Get the raw body (must be Buffer, not parsed JSON)
    const payload = typeof req.body === 'string' 
      ? req.body 
      : JSON.stringify(req.body);
    
    const headers = req.headers;
    const evt = wh.verify(payload, headers);

    // Safely extract event data
    const eventType = evt.type;
    const eventData = evt.data || {};
    const userId = eventData.id || eventData.user_id;
    const webhookId = headers['svix-id'] 

    const alreadyProcessed = await WebhookService.isWebhookbeenProcessed(webhookId);
    
    if (alreadyProcessed){
        console.log(`Webhook event ${webhookId} has already been processed. Skipping.`);
    }

    await WebhookService.saveWebhookEvent(webhookId, eventType, eventData);
 
    // Example: Handle specific event types
    switch (eventType) {
      case 'user.created':
       await userService.handleUserCreated(eventData);
        break;
      case 'user.updated':
        console.log(`User updated: ${userId}`);
        break;
      case 'user.deleted':
        console.log(`User deleted: ${userId}`);
        break;
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    res.status(200).json({ success: true, message: "Event received" });

  } catch (err) {
    console.error("Error verifying webhook:", err.message);
    return res.status(400).json({ 
      error: "Webhook Error",
      message: err.message 
    });
  }
}