import { Router, type IRouter } from "express";
import { CreateCheckoutSessionBody, CreateCheckoutSessionResponse } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { createStripeCheckoutSession } from "../lib/stripe";

const router: IRouter = Router();
router.post("/payments/checkout-session", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateCheckoutSessionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  try {
    const session = await createStripeCheckoutSession(parsed.data);
    res.json(CreateCheckoutSessionResponse.parse(session));
  } catch (error) {
    req.log.error({ error }, "Unable to create Stripe Checkout session");
    res.status(502).json({ error: "Stripe Checkout is temporarily unavailable." });
  }
});
export default router;