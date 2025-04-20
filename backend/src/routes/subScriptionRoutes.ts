import express from "express";
import isAuth from "../middleware/isAuth";

import * as SubscriptionController from "../controllers/SubscriptionController";

const subscriptionRoutes = express.Router();

subscriptionRoutes.post("/subscription",isAuth,SubscriptionController.createSubscription);

subscriptionRoutes.post("/subscription/create/webhook",SubscriptionController.createWebhook);
subscriptionRoutes.delete("/subscription/create/webhook",isAuth,SubscriptionController.deleteWebhook);
subscriptionRoutes.post("/subscription/webhook/:type?", SubscriptionController.webhook);

export default subscriptionRoutes;
