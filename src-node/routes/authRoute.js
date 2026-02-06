import express from "express";
const router = express.Router();
import { clerkWebhookHandler } from "../controller/ControllerAuth.js";

// Webhook route for Clerk events
router.post("/webhook/clerk", 
    express.raw({ type: "application/json" }),
    clerkWebhookHandler
);

export default router;