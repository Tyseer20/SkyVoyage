import test from "node:test";
import assert from "node:assert/strict";
import { buildStripeCheckoutParams } from "./stripe";

test("Stripe checkout uses a real price ID and preserves payment return URLs", () => {
  const params = buildStripeCheckoutParams({
    title: "Emirates BOM to DXB",
    amount: 338,
    successUrl: "https://skyvoyage.test/dashboard",
    cancelUrl: "https://skyvoyage.test/checkout",
    referenceId: "SV123",
  }, "prod_test", "price_test");
  assert.equal(params.session.get("line_items[0][price]"), "price_test");
  assert.equal(params.session.get("line_items[0][quantity]"), "1");
  assert.equal(params.session.get("client_reference_id"), "SV123");
  assert.equal(params.price.get("unit_amount"), "33800");
});