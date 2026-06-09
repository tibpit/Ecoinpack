import { put, del, list, head } from "@vercel/blob";

/**
 * No database in V1: the uploaded profile text lives temporarily in Vercel
 * Blob. Vercel Blob has no native TTL, so expiry is enforced on read
 * (24h window) and the blob is deleted by the Stripe webhook after the
 * paid analysis is delivered. Paths use a UUID so URLs are unguessable.
 */
export const BLOB_TTL_MS = 24 * 60 * 60 * 1000;

const PROFILE_PREFIX = "redpen/profiles/";
const RESULT_PREFIX = "redpen/results/";

export class BlobExpiredError extends Error {
  constructor() {
    super("Uploaded profile has expired (24h TTL)");
  }
}

export async function saveProfileBlob(text: string): Promise<{ blobId: string; blobUrl: string }> {
  const blobId = crypto.randomUUID();
  const blob = await put(`${PROFILE_PREFIX}${blobId}.txt`, text, {
    access: "public",
    addRandomSuffix: false,
    contentType: "text/plain; charset=utf-8",
  });
  return { blobId, blobUrl: blob.url };
}

export async function readProfileBlob(blobUrl: string): Promise<string> {
  const meta = await head(blobUrl); // throws BlobNotFoundError if deleted
  if (Date.now() - new Date(meta.uploadedAt).getTime() > BLOB_TTL_MS) {
    await del(blobUrl).catch(() => {});
    throw new BlobExpiredError();
  }
  const res = await fetch(blobUrl, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch blob (${res.status})`);
  return res.text();
}

export async function deleteBlob(blobUrl: string): Promise<void> {
  await del(blobUrl).catch(() => {});
}

/** Stores the full paid analysis so /success can display it without a DB. */
export async function saveResultBlob(checkoutSessionId: string, json: string): Promise<string> {
  const blob = await put(`${RESULT_PREFIX}${checkoutSessionId}.json`, json, {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json",
  });
  return blob.url;
}

export async function readResultBlob(checkoutSessionId: string): Promise<string | null> {
  const { blobs } = await list({ prefix: `${RESULT_PREFIX}${checkoutSessionId}.json`, limit: 1 });
  const match = blobs[0];
  if (!match) return null;
  if (Date.now() - new Date(match.uploadedAt).getTime() > BLOB_TTL_MS) {
    await del(match.url).catch(() => {});
    return null;
  }
  const res = await fetch(match.url, { cache: "no-store" });
  if (!res.ok) return null;
  return res.text();
}
