import { Webhook } from "svix";
import config from "../config/env.js";
import { UserService, WebhookService } from "../service/index.js";
import { AppError } from "../utils/AppError.js";
import { webhookQueue } from "../config/queue.js";


export const clerkWebhookHandler = async (req, res) => {
  try {
    const headers = req.headers;
    const rawBody = req.rawBody
    const wh = new Webhook(config.CLERK_WEBHOOK_SIGNING_SECRET);

    
    let evt;
    try {
      evt = wh.verify(rawBody, headers);
    } catch (verifyErr) {
      throw new AppError(`Webhook signature verification failed: ${verifyErr.message}`, 400);
    }

    const eventType = evt.type;
    const eventData = evt.data 
    const clerkEventId = evt.id || headers['svix-id'] || null;

    if (!clerkEventId) {
      throw new AppError('Cannot determine event ID from payload or headers', 400);
    }
    
      const {created} = await WebhookService.recordIfnew(clerkEventId, eventType, evt);
      if(!created) {
        return res.status(200).json({ success: true, message: "Event already processed" });
      }

    // Enqueue the event for processing by workers
    await webhookQueue.add("webhook-processing",{ type: eventType, data: eventData, eventId: clerkEventId });
    

    // Acknowledge quickly
    res.status(200).json({ success: true, message: "Webhook received" });


  } catch (err) {
    console.error(`Error handling webhook: ${err.message}`);
    res.status(err.statusCode || 500);
  }
};
