import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { readResult } from "@/lib/storage";
import { AuditSchema } from "@/lib/schema";

export const runtime = "nodejs";

/**
 * GET /api/session-result?session_id=cs_...
 * Backs the /success page. Verifies with Stripe that the checkout session is
 * paid, then returns the full analysis stored by the webhook.
 * Returns 202 while the webhook is still processing (client polls).
 */
export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("session_id");
  if (!sessionId || !sessionId.startsWith("cs_")) {
    return NextResponse.json({ error: "Invalid session id" }, { status: 400 });
  }

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 402 });
    }
  } catch {
    return NextResponse.json({ error: "Unknown session" }, { status: 404 });
  }

  const raw = await readResult(sessionId);
  if (!raw) {
    // Webhook hasn't finished (or result expired after 24h)
    return NextResponse.json({ status: "pending" }, { status: 202 });
  }

  const parsed = AuditSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    console.error(`Session ${sessionId}: stored result failed schema validation`);
    return NextResponse.json({ error: "Stored result is corrupted" }, { status: 500 });
  }

  return NextResponse.json({ status: "ready", audit: parsed.data });
}
