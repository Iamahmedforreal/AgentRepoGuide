import { Webhook } from "svix";
import config from "../config/env.js";
import { UserService, WebhookService } from "../service/index.js";

export const clerkWebhookHandler = async (req, res) => {
  const headers = req.headers;

  try {
    const wh = new Webhook(config.CLERK_WEBHOOK_SIGNING_SECRET);

    // Prefer rawBody (set in express.json verify) otherwise fallback to body string
    const payload = req.rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}));

    let evt;
    try {
      evt = wh.verify(payload, headers);
    } catch (verifyErr) {
      console.error("Webhook verification failed:", verifyErr.message);
      return res.status(400).json({ error: "Invalid signature" });
    }

    // Debugging helpful when adding new webhook types
    console.log('=== CLERK WEBHOOK DEBUG ===');
    console.log('Event Type:', evt.type);
    console.log('Full Event Data:', JSON.stringify(evt.data || {}, null, 2));
    console.log('===========================');

    const eventType = evt.type;
    const eventData = evt.data || {};

    // Use Clerk's event id when present, otherwise fallback to svix-id header
    const clerkEventId = evt.id || headers['svix-id'] || null;
    if (!clerkEventId) {
      console.warn('No event id available for dedupe; processing anyway');
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

    // Process asynchronously so we don't block the response
    (async () => {
      try {
        console.log(`Processing webhook ${clerkEventId} (${eventType})`);

        switch (eventType) {
          case 'user.created':
          case 'user.updated':
            // eventData may be the user object or contain nested user
            await UserService.handleUserCreateEvent(eventData);
            break;
          case 'user.deleted':
            await UserService.handleUserDeleteEvent(eventData);
            break;
          case 'session.created':
            // session events include `user` object inside eventData
            // upsert the user if present
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
        console.error(`Error processing webhook ${clerkEventId}:`, procErr);
      }
    })();

  } catch (err) {
    console.error("Internal Webhook Error:", err);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
};
