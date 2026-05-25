/**
 * Simple in-memory rate limiter for public endpoints.
 *
 * Note: this is per-process — in a multi-instance deployment (Vercel edge,
 * multiple Node workers) consider switching to Redis / Upstash. Good enough
 * to stop casual spam on a single Node instance.
 */
import { NextResponse } from "next/server";
import { headers } from "next/headers";

type Entry = number[];
const buckets = new Map<string, Entry>();

export async function getClientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

/**
 * Returns `null` if the request is allowed, or a 429 NextResponse if not.
 * @param key   bucket key, e.g. `quote:${ip}`
 * @param limit max requests within window
 * @param windowMs window in ms
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): NextResponse | null {
  const now = Date.now();
  const entries = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (entries.length >= limit) {
    const retryAfter = Math.ceil((windowMs - (now - entries[0])) / 1000);
    return NextResponse.json(
      { error: "rate_limited", retryAfter },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }
  entries.push(now);
  buckets.set(key, entries);
  return null;
}

// Periodic cleanup so the map doesn't grow forever
if (typeof globalThis !== "undefined" && !(globalThis as { __rlInterval?: NodeJS.Timeout }).__rlInterval) {
  (globalThis as { __rlInterval?: NodeJS.Timeout }).__rlInterval = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of buckets.entries()) {
      const fresh = v.filter((t) => now - t < 60 * 60 * 1000);
      if (fresh.length === 0) buckets.delete(k);
      else buckets.set(k, fresh);
    }
  }, 5 * 60 * 1000);
}
