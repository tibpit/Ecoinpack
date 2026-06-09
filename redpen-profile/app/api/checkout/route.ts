import { NextResponse } from "next/server";
import { getStripe, PRICE_USD_CENTS, PRODUCT_NAME } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * POST /api/checkout
 * Body: { blobId, blobUrl } — identifies the uploaded profile in Vercel Blob.
 * Creates a one-time $19 Stripe Checkout session. The blob reference rides
 * in the session metadata so the webhook can regenerate the full analysis.
 */
export async function POST(request: Request) {
  let blobId: unknown, blobUrl: unknown;
  try {
    ({ blobId, blobUrl } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof blobId !== "string" || typeof blobUrl !== "string" || !blobUrl.startsWith("https://")) {
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
      metadata: { blobId, blobUrl },
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/audit`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("checkout failed:", err);
    return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
  }
}
