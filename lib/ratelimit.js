import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limiting with two-tier strategy:
 *   1. Upstash Redis (preferred) — survives restarts, multi-instance safe.
 *   2. In-memory fallback — single-process, resets on deploy. Good enough
 *      for single-instance Render deploys pre-launch. Swap in UPSTASH_* env
 *      vars to auto-upgrade with zero code change.
 */

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

// ========== LIMITS (shared by both tiers) ==========

const LIMITS = {
  register: { max: 5, windowMs: 60_000 },
  login: { max: 10, windowMs: 60_000 },
  quiz: { max: 30, windowMs: 60_000 },
  mock: { max: 10, windowMs: 60_000 },
  admin: { max: 100, windowMs: 60_000 },
};

// ========== UPSTASH TIER ==========

const redis = hasUpstash
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

function buildUpstash(limit, windowSeconds, prefix) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
    analytics: false,
    prefix: `rl:${prefix}`,
  });
}

const upstashLimiters = hasUpstash
  ? Object.fromEntries(
      Object.entries(LIMITS).map(([k, { max, windowMs }]) => [
        k,
        buildUpstash(max, windowMs / 1000, k),
      ])
    )
  : null;

// ========== IN-MEMORY TIER ==========

// Keyed by `${kind}:${id}` → { count, resetAt }
const buckets = new Map();

// Best-effort eviction to bound memory under attack.
// Scans when the Map grows past this threshold.
const MAX_BUCKETS = 10_000;

function evictExpired(now) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [k, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(k);
  }
  // If still too large after expiry sweep, drop oldest-by-reset entries.
  if (buckets.size >= MAX_BUCKETS) {
    const entries = [...buckets.entries()].sort(
      (a, b) => a[1].resetAt - b[1].resetAt
    );
    const toDrop = entries.slice(0, Math.floor(MAX_BUCKETS / 4));
    for (const [k] of toDrop) buckets.delete(k);
  }
}

function checkInMemory(kind, id) {
  const cfg = LIMITS[kind];
  if (!cfg) return { ok: true };
  const now = Date.now();
  evictExpired(now);

  const key = `${kind}:${id}`;
  const b = buckets.get(key);

  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + cfg.windowMs });
    return { ok: true };
  }
  if (b.count >= cfg.max) {
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((b.resetAt - now) / 1000)),
    };
  }
  b.count++;
  return { ok: true };
}

// ========== PUBLIC API ==========

// Extract client IP from Next.js req (proxy-aware; Render sets x-forwarded-for)
export function getClientIp(req) {
  const fwd =
    req.headers.get?.("x-forwarded-for") || req.headers.get?.("x-real-ip");
  if (fwd) return fwd.split(",")[0].trim();
  return "anon";
}

/**
 * Returns { ok: true } if allowed, or { ok: false, retryAfter } if rate-limited.
 * Uses Upstash when configured, otherwise in-memory.
 */
export async function checkLimit(limiterName, identifier) {
  if (!LIMITS[limiterName]) return { ok: true };

  if (upstashLimiters) {
    const limiter = upstashLimiters[limiterName];
    if (!limiter) return { ok: true };
    try {
      const { success, reset } = await limiter.limit(identifier);
      return success
        ? { ok: true }
        : {
            ok: false,
            retryAfter: Math.max(1, Math.ceil((reset - Date.now()) / 1000)),
          };
    } catch {
      // Upstash outage → fall through to in-memory so we never fail-open.
      return checkInMemory(limiterName, identifier);
    }
  }

  return checkInMemory(limiterName, identifier);
}

// Kept for backwards compat with any existing imports.
export const ratelimiters = upstashLimiters ?? {};
