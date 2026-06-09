import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * No database in V1: the uploaded profile text and the paid result live
 * temporarily in Cloudflare KV. The 24h TTL is enforced natively by KV
 * (expirationTtl), and the profile entry is deleted by the Stripe webhook
 * as soon as the paid analysis is delivered. Keys use a UUID / the Stripe
 * checkout session id, so they are unguessable.
 */
export const TTL_SECONDS = 24 * 60 * 60;

const PROFILE_PREFIX = "profile:";
const RESULT_PREFIX = "result:";

function kv(): KVNamespace {
  return getCloudflareContext().env.REDPEN_KV;
}

export async function saveProfile(text: string): Promise<string> {
  const blobId = crypto.randomUUID();
  await kv().put(PROFILE_PREFIX + blobId, text, { expirationTtl: TTL_SECONDS });
  return blobId;
}

/** Returns null when the entry expired (24h TTL) or was already delivered. */
export async function readProfile(blobId: string): Promise<string | null> {
  return kv().get(PROFILE_PREFIX + blobId);
}

export async function deleteProfile(blobId: string): Promise<void> {
  await kv().delete(PROFILE_PREFIX + blobId);
}

/** Stores the full paid analysis so /success can display it without a DB. */
export async function saveResult(checkoutSessionId: string, json: string): Promise<void> {
  await kv().put(RESULT_PREFIX + checkoutSessionId, json, { expirationTtl: TTL_SECONDS });
}

export async function readResult(checkoutSessionId: string): Promise<string | null> {
  return kv().get(RESULT_PREFIX + checkoutSessionId);
}
