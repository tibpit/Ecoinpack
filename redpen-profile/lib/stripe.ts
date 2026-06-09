import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key);
  }
  return _stripe;
}

export const PRICE_USD_CENTS = 1900; // $19, one-time payment
export const PRODUCT_NAME = "RedPen Profile — Full LinkedIn Rewrite";
