import { NextResponse } from "next/server";
import { getStripe, PRICE_USD_CENTS, PRODUCT_NAME } from "@/lib/stripe";

export const runtime = "nodejs";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/checkout
 * Body: { blobId } — identifies the uploaded profile in Cloudflare KV.
 * Creates a one-time $19 Stripe Checkout session. The blob id rides in the
 * session metadata so the webhook can regenerate the full analysis.
 */
export async function POST(request: Request) {
  let blobId: unknown;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    blobId = body.blobId;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof blobId !== "string" || !UUID_RE.test(blobId)) {
    return NextResponse.json({ error: "Missing blob reference" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return NextResponse.json({ error: "Server misconfigured (NEXT_PUBLIC_APP_URL)" }, { status: 500 });
  }

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: PRICE_USD_CENTS,
            product_data: {
              name: PRODUCT_NAME,
              description:
                "Full AI rewrite of your LinkedIn profile: headline, About, every experience, plus a quick-wins checklist. Delivered by email and online.",
            },
          },
        },
      ],
      metadata: { blobId },
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/audit`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("checkout failed:", err);
    return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
  }
}
