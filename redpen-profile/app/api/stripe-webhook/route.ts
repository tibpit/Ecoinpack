import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, stripeCryptoProvider } from "@/lib/stripe";
import { readProfile, deleteProfile, saveResult } from "@/lib/storage";
import { analyzeProfile } from "@/lib/claude";
import { sendResultEmail } from "@/lib/email";

export const runtime = "nodejs";

/**
 * POST /api/stripe-webhook
 * 1. Verifies the Stripe signature against the raw body (async SubtleCrypto,
 *    required on Cloudflare Workers).
 * 2. On checkout.session.completed: re-runs the FULL analysis from the
 *    profile stored in KV (id in the session metadata).
 * 3. Stores the result JSON in KV (keyed by session id, native 24h TTL)
 *    so /success can display it without a database.
 * 4. Emails all copy-paste blocks + application guide via Resend.
 * 5. Deletes the uploaded profile entry.
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
    event = await getStripe().webhooks.constructEventAsync(
      rawBody,
      signature,
      secret,
      undefined,
      stripeCryptoProvider
    );
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

  const blobId = session.metadata?.blobId;
  const customerEmail = session.customer_details?.email;
  if (!blobId || !customerEmail) {
    console.error(`Session ${session.id}: missing blobId or customer email`);
    // Nothing retryable here — acknowledge so Stripe stops retrying.
    return NextResponse.json({ received: true });
  }

  const profileText = await readProfile(blobId);
  if (profileText === null) {
    // Expired (24h TTL) or already delivered — retrying won't bring it back.
    console.error(`Session ${session.id}: profile entry missing or expired`);
    return NextResponse.json({ received: true });
  }

  try {
    const audit = await analyzeProfile(profileText);

    await saveResult(session.id, JSON.stringify(audit));

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const successUrl = `${appUrl}/success?session_id=${session.id}`;
    await sendResultEmail(customerEmail, audit, successUrl);

    await deleteProfile(blobId);

    return NextResponse.json({ received: true });
  } catch (err) {
    // Analysis or email failed: return 500 so Stripe retries the webhook.
    // The profile entry is kept (still within its 24h TTL) for the retry.
    console.error(`Session ${session.id}: delivery failed`, err);
    return NextResponse.json({ error: "Delivery failed" }, { status: 500 });
  }
}
