/**
 * Simple in-memory IP rate limiter: 3 free analyses per IP per UTC day.
 *
 * V1 caveat (documented in the README): on Cloudflare Workers, isolates do
 * not share memory across colos/instances, so the limit applies per isolate.
 * Good enough as an abuse brake for launch; move the counter to KV or a
 * Durable Object for a hard guarantee.
 */
const DAILY_LIMIT = 3;

interface Entry {
  day: string;
  count: number;
}

// Survive dev-server HMR by stashing on globalThis.
const store: Map<string, Entry> =
  (globalThis as Record<string, unknown>).__redpenRateLimit instanceof Map
    ? ((globalThis as Record<string, unknown>).__redpenRateLimit as Map<string, Entry>)
    : new Map();
(globalThis as Record<string, unknown>).__redpenRateLimit = store;

function currentDay(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getClientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const day = currentDay();
  const entry = store.get(ip);
  if (!entry || entry.day !== day) {
    store.set(ip, { day, count: 1 });
    return { allowed: true, remaining: DAILY_LIMIT - 1 };
  }
  if (entry.count >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  entry.count += 1;
  return { allowed: true, remaining: DAILY_LIMIT - entry.count };
}
