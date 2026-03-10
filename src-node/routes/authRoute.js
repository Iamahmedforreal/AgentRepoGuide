import express from "express";
const router = express.Router();
import { clerkWebhookHandler } from "../controller/ControllerAuth.js";
import { urlValidator } from "../utils/urlValidator.js";
import {validateRequest} from "../middleware/validator.js";

// Webhook route for Clerk events
router.post("/webhook/clerk", validateRequest(urlValidator), clerkWebhookHandler);

export default router;