import { NextResponse } from "next/server";
import { analyzeProfile, ProfileTooShortError, MIN_PROFILE_CHARS } from "@/lib/claude";
import { extractPdfText, UnreadablePdfError } from "@/lib/pdf";
import { saveProfile } from "@/lib/storage";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { toFreeResult } from "@/lib/schema";

export const runtime = "nodejs";

/**
 * POST /api/analyze
 * Accepts multipart/form-data with either:
 *   - file: a LinkedIn "Save to PDF" export, or
 *   - text: pasted profile text.
 * Returns the FREE tier only (score + headline rewrite + teaser counts).
 * The raw profile text is stored in Cloudflare KV (24h TTL) so the Stripe
 * webhook can regenerate the full analysis after payment.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Free limit reached: 3 analyses per day. Come back tomorrow." },
      { status: 429 }
    );
  }

  let profileText: string;
  try {
    const form = await request.formData();
    const file = form.get("file");
    const text = form.get("text");

    if (file instanceof File && file.size > 0) {
      if (file.type && file.type !== "application/pdf") {
        return NextResponse.json(
          { error: "Only PDF files are accepted. Use LinkedIn's \"Save to PDF\" export." },
          { status: 400 }
        );
      }
      profileText = await extractPdfText(await file.arrayBuffer());
    } else if (typeof text === "string" && text.trim().length > 0) {
      profileText = text.trim();
    } else {
      return NextResponse.json(
        { error: "Provide a PDF file or pasted profile text." },
        { status: 400 }
      );
    }
  } catch (err) {
    if (err instanceof UnreadablePdfError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    return NextResponse.json({ error: "Could not read the request." }, { status: 400 });
  }

  if (profileText.length < MIN_PROFILE_CHARS) {
    return NextResponse.json(
      {
        error: `That looks too short to be a full profile (minimum ${MIN_PROFILE_CHARS} characters). Paste your whole profile, including About and Experience.`,
      },
      { status: 422 }
    );
  }

  try {
    const blobId = await saveProfile(profileText);
    const audit = await analyzeProfile(profileText);
    return NextResponse.json(toFreeResult(audit, blobId));
  } catch (err) {
    if (err instanceof ProfileTooShortError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    console.error("analyze failed:", err);
    return NextResponse.json(
      { error: "Analysis failed. Please try again in a minute." },
      { status: 500 }
    );
  }
}
