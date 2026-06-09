import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    // Fetch-based HTTP client: required on Cloudflare Workers (no raw sockets)
    _stripe = new Stripe(key, { httpClient: Stripe.createFetchHttpClient() });
  }
  return _stripe;
}

// Webhook signature verification on Workers must go through SubtleCrypto
// (async) instead of Node's synchronous crypto.
export const stripeCryptoProvider = Stripe.createSubtleCryptoProvider();

export const PRICE_USD_CENTS = 1900; // $19, one-time payment
export const PRODUCT_NAME = "RedPen Profile — Full LinkedIn Rewrite";
