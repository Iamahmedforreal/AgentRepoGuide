import { verifyWebhook } from "@clerk/express/webhooks";

export const clerkWebhookHandler = async (req, res) => {
    try{
    const evt = verifyWebhook(req, process.env.CLERK_WEBHOOK_SIGNING_SECRET);

    const {id} = evt.data;
    const eventType = evt.type;

    console.log(`Received event ${eventType} for user ${id}`);
    res.status(200).send("Event received");
    
    } catch (err) {
        console.error("Error verifying webhook:", err);
        return res.status(400).send("Webhook Error");
    } 

}