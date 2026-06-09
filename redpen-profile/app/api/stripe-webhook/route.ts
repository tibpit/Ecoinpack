import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { readProfileBlob, deleteBlob, saveResultBlob, BlobExpiredError } from "@/lib/blob";
import { analyzeProfile } from "@/lib/claude";
import { sendResultEmail } from "@/lib/email";

export const runtime = "nodejs";
export const maxDuration = 300; // full re-analysis + email

/**
 * POST /api/stripe-webhook
 * 1. Verifies the Stripe signature against the raw body.
 * 2. On checkout.session.completed: re-runs the FULL analysis from the
 *    profile blob referenced in the session metadata.
 * 3. Stores the result JSON in Vercel Blob (keyed by session id, 24h TTL)
 *    so /success can display it without a database.
 * 4. Emails all copy-paste blocks + application guide via Resend.
 * 5. Deletes the uploaded profile blob.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true });
  }

  const blobUrl = session.metadata?.blobUrl;
  const customerEmail = session.customer_details?.email;
  if (!blobUrl || !customerEmail) {
    console.error(`Session ${session.id}: missing blobUrl or customer email`);
    // Nothing retryable here — acknowledge so Stripe stops retrying.
    return NextResponse.json({ received: true });
  }

  let profileText: string;
  try {
    profileText = await readProfileBlob(blobUrl);
  } catch (err) {
    if (err instanceof BlobExpiredError) {
      console.error(`Session ${session.id}: profile blob expired before delivery`);
      return NextResponse.json({ received: true });
    }
    console.error(`Session ${session.id}: blob read failed`, err);
    return NextResponse.json({ error: "Blob unavailable" }, { status: 500 }); // let Stripe retry
  }

  try {
    const audit = await analyzeProfile(profileText);

    await saveResultBlob(session.id, JSON.stringify(audit));

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const successUrl = `${appUrl}/success?session_id=${session.id}`;
    await sendResultEmail(customerEmail, audit, successUrl);

    await deleteBlob(blobUrl);

    return NextResponse.json({ received: true });
  } catch (err) {
    // Analysis or email failed: return 500 so Stripe retries the webhook.
    // The profile blob is kept (still within its 24h TTL) for the retry.
    console.error(`Session ${session.id}: delivery failed`, err);
    return NextResponse.json({ error: "Delivery failed" }, { status: 500 });
  }
}
