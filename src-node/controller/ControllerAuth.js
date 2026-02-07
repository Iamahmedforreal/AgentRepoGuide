import { Webhook } from "svix";
import config from "../config/env.js";
import { UserService, WebhookService } from "../service/index.js";

export const clerkWebhookHandler = async (req, res) => {
  const headers = req.headers;
  const svix_id = headers["svix-id"];
  const svix_timestamp = headers["svix-timestamp"];
  const svix_signature = headers["svix-signature"];

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: "Missing svix headers" });
  }

  try {
    const wh = new Webhook(config.CLERK_WEBHOOK_SIGNING_SECRET);




    // Clerk sends raw body as a buffer if using express.raw middleware
    const payload = req.rawBody

    let evt;
    try {
      evt = wh.verify(payload, headers);
      // 🔍 Log everything
      console.log('=== CLERK WEBHOOK DEBUG ===');
      console.log('Event Type:', evt.type);
      console.log('Full Event Data:', JSON.stringify(evt.data, null, 2));
      console.log('Email Addresses:', evt.data.email_addresses);
      console.log('===========================');
    } catch (verifyErr) {
      console.error("Webhook verification failed:", verifyErr.message);
      return res.status(400).json({ error: "Invalid signature" });
    }

    const eventType = evt.type;
    const eventData = evt.data;

    // 1. Check for duplicate processing using svix-id
    const alreadyProcessed = await WebhookService.isWebhookbeenProcessed(svix_id);
    if (alreadyProcessed) {
      return res.status(200).json({ success: true, message: "Already processed" });
    }

    
    await WebhookService.recordWebhookEvent(svix_id, eventType, eventData);


    res.status(200).json({ success: true, message: "Webhook received" });

    (async () => {
      try {
        console.log(`Processing webhook ${svix_id} (${eventType})`);

        switch (eventType) {
          case 'session.created':
            await UserService.handleUserCreateEvent(eventData);
            break;
          case 'session.updated':
            await UserService.handleUserUpdateEvent(eventData);
            break;
          case 'session.deleted':
            await UserService.handleUserDeleteEvent(eventData);
            break;
          default:
            console.warn(`Unhandled Clerk event type: ${eventType}`);
        }

        await WebhookService.markWebhookAsProcessed(svix_id);
      } catch (procErr) {
        console.error(`Error processing webhook ${svix_id}:`, procErr.message);
        // Here you would typically implement a retry or error logging
      }
    })();

  } catch (err) {
    console.error("Internal Webhook Error:", err.message);
    // Don't leak internals, but acknowledge error if it happened before response
    if (!res.headersSent) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
}
