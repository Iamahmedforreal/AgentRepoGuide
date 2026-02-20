import { Webhook } from "svix";
import config from "../config/env.js";
import { UserService, WebhookService } from "../service/index.js";
import { AppError } from "../utils/AppError.js";
import { webhookQueue } from "../config/queue.js";


export const clerkWebhookHandler = async (req, res) => {
  const headers = req.headers;

  try {
    const wh = new Webhook(config.CLERK_WEBHOOK_SIGNING_SECRET);

    const payload = req.rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}));

    let evt;
    try {
      evt = wh.verify(payload, headers);
    } catch (verifyErr) {
      throw new AppError(`Webhook signature verification failed: ${verifyErr.message}`, 400);
    }

    const eventType = evt.type;
    const eventData = evt.data || {};
    const clerkEventId = evt.id || headers['svix-id'] || null;
    
      const alreadyProcessed = await WebhookService.isWebhookbeenProcessed(clerkEventId);
      if (alreadyProcessed) {
        return res.status(200).json({ success: true, message: "Already processed" });
      }

      // Record the webhook (store full event for later inspection)
    await WebhookService.recordWebhookEvent(clerkEventId, eventType, evt);

    // Enqueue the event for processing by workers
    await webhookQueue.add({ type: eventType, data: eventData, eventId: clerkEventId });
    

    // Acknowledge quickly
    res.status(200).json({ success: true, message: "Webhook received" });


  } catch (err) {
    if (err instanceof AppError) throw err;{
      throw new AppError(`Error handling webhook: ${err.message}`, err.statusCode || 500);
    }
  }
};
