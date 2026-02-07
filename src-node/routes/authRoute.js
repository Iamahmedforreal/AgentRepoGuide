import express from "express";
const router = express.Router();
import { clerkWebhookHandler } from "../controller/ControllerAuth.js";

// Webhook route for Clerk events
router.post("/webhook/clerk", clerkWebhookHandler);

export default router;