import { Webhook } from "svix";
import config from "../config/env.js";
import { UserService, WebhookService } from "../service/index.js";
import { AppError } from "../utils/AppError.js";

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

    // Use Clerk's event id when present, otherwise fallback to svix-id header
    const clerkEventId = evt.id || headers['svix-id'] || null;
    if (!clerkEventId) {
      throw new AppError("Missing event ID for webhook", 400);
    } else {
      const alreadyProcessed = await WebhookService.isWebhookbeenProcessed(clerkEventId);
      if (alreadyProcessed) {
        return res.status(200).json({ success: true, message: "Already processed" });
      }

      // Record the webhook (store full event for later inspection)
      await WebhookService.recordWebhookEvent(clerkEventId, eventType, evt);
    }

    // Acknowledge quickly
    res.status(200).json({ success: true, message: "Webhook received" });

    //async processing of the webhook event
    (async () => {
      try {
        console.log(`Processing webhook ${clerkEventId} (${eventType})`);

        switch (eventType) {
          case 'user.created':
          case 'user.updated':
            await UserService.handleUserCreateEvent(eventData);
            break;
          case 'user.deleted':
            await UserService.handleUserDeleteEvent(eventData);
            break;
          case 'session.created':
            if (eventData.user) {
              await UserService.handleUserCreateEvent(eventData.user);
            }
            break;
          default:
            console.warn(`Unhandled Clerk event type: ${eventType}`);
        }

        if (clerkEventId) {
          await WebhookService.markWebhookAsProcessed(clerkEventId);
        }
      } catch (procErr) {
        throw new AppError(`Error processing webhook: ${procErr.message}`, procErr.statusCode || 500);
      }
    })();

  } catch (err) {
    console.error("Internal Webhook Error:", err);
    if (!res.headersSent) {
      throw new AppError(`Webhook processing failed: ${err.message}`, err.statusCode || 500);
    }
  }
};
