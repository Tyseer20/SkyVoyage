import { ReplitConnectors } from "@replit/connectors-sdk";

const connectors = new ReplitConnectors();

export function buildStripeCheckoutParams(input: {
  title: string;
  amount: number;
  successUrl: string;
  cancelUrl: string;
  referenceId: string;
}, productId: string, priceId: string) {
  return {
    product: new URLSearchParams({
      name: input.title,
      "metadata[reference_id]": input.referenceId,
    }),
    price: new URLSearchParams({
      product: productId,
      currency: "usd",
      unit_amount: String(Math.round(input.amount * 100)),
    }),
    session: new URLSearchParams({
      mode: "payment",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      client_reference_id: input.referenceId,
    }),
  };
}

async function stripeRequest(path: string, params: URLSearchParams) {
  const response = await connectors.proxy("stripe", path, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!response.ok) throw new Error(`Stripe request failed with ${response.status}`);
  return response.json() as Promise<Record<string, unknown>>;
}

export async function createStripeCheckoutSession(input: {
  title: string;
  amount: number;
  successUrl: string;
  cancelUrl: string;
  referenceId: string;
}) {
  const params = buildStripeCheckoutParams(input, "", "");
  const product = await stripeRequest("/v1/products", params.product);
  const productId = String(product.id);
  const price = await stripeRequest("/v1/prices", new URLSearchParams({ ...Object.fromEntries(params.price), product: productId }));
  const session = await stripeRequest("/v1/checkout/sessions", new URLSearchParams({
    ...Object.fromEntries(buildStripeCheckoutParams(input, productId, String(price.id)).session),
  }));
  return { sessionId: String(session.id), url: String(session.url) };
}