import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasUpstash
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

function build(limit, window, prefix) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    analytics: false,
    prefix: `rl:${prefix}`,
  });
}

export const ratelimiters = {
  register: build(5, "60 s", "register"),
  login: build(10, "60 s", "login"),
  quiz: build(30, "60 s", "quiz"),
  mock: build(10, "60 s", "mock"),
  admin: build(100, "60 s", "admin"),
};

// Extract client IP from Next.js req (proxy-aware)
export function getClientIp(req) {
  const fwd = req.headers.get?.("x-forwarded-for") || req.headers.get?.("x-real-ip");
  if (fwd) return fwd.split(",")[0].trim();
  return "anon";
}

/**
 * Returns { ok: true } if allowed, or { ok: false, retryAfter } if rate-limited.
 * If Upstash not configured, always returns { ok: true } (fail-open for dev).
 */
export async function checkLimit(limiterName, identifier) {
  const limiter = ratelimiters[limiterName];
  if (!limiter) return { ok: true };
  const { success, reset } = await limiter.limit(identifier);
  return success
    ? { ok: true }
    : { ok: false, retryAfter: Math.max(1, Math.ceil((reset - Date.now()) / 1000)) };
}
