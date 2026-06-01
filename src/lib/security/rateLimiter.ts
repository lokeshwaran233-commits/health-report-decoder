/**
 * Client-side rate limiter using localStorage.
 *
 * NOTE: This is a best-effort UX guard against accidental abuse and rapid
 * brute-force attempts from a single browser. It is NOT a server-side
 * security control — a determined attacker can bypass it by clearing
 * storage. Server-side limits (e.g. Supabase Auth) remain the source of
 * truth.
 */

const STORAGE_PREFIX = "rx_rl_";

interface Bucket {
  /** Unix ms timestamps of recent attempts within the window. */
  attempts: number[];
  /** If set, requests are blocked until this Unix ms. */
  blockedUntil?: number;
}

export interface RateLimitConfig {
  /** Max attempts allowed within `windowMs`. */
  maxAttempts: number;
  /** Sliding window length in ms. */
  windowMs: number;
  /** Cool-down applied once the limit is hit. */
  blockMs: number;
}

export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  /** Seconds until the next attempt is allowed (0 if allowed now). */
  retryAfterSec: number;
}

function safeStorage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function readBucket(key: string): Bucket {
  const store = safeStorage();
  if (!store) return { attempts: [] };
  try {
    const raw = store.getItem(STORAGE_PREFIX + key);
    if (!raw) return { attempts: [] };
    const parsed = JSON.parse(raw) as Bucket;
    if (!Array.isArray(parsed.attempts)) return { attempts: [] };
    return parsed;
  } catch {
    return { attempts: [] };
  }
}

function writeBucket(key: string, bucket: Bucket): void {
  const store = safeStorage();
  if (!store) return;
  try {
    store.setItem(STORAGE_PREFIX + key, JSON.stringify(bucket));
  } catch {
    /* quota / disabled — ignore */
  }
}

export function checkRateLimit(key: string, cfg: RateLimitConfig): RateLimitStatus {
  const now = Date.now();
  const bucket = readBucket(key);

  if (bucket.blockedUntil && bucket.blockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.ceil((bucket.blockedUntil - now) / 1000),
    };
  }

  const recent = bucket.attempts.filter((t) => now - t < cfg.windowMs);
  const remaining = Math.max(0, cfg.maxAttempts - recent.length);
  return { allowed: remaining > 0, remaining, retryAfterSec: 0 };
}

/**
 * Record a single attempt. If the bucket now exceeds the limit, the bucket
 * is marked blocked for `blockMs`.
 */
export function recordAttempt(key: string, cfg: RateLimitConfig): RateLimitStatus {
  const now = Date.now();
  const bucket = readBucket(key);

  if (bucket.blockedUntil && bucket.blockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.ceil((bucket.blockedUntil - now) / 1000),
    };
  }

  const recent = bucket.attempts.filter((t) => now - t < cfg.windowMs);
  recent.push(now);

  if (recent.length >= cfg.maxAttempts) {
    const blockedUntil = now + cfg.blockMs;
    writeBucket(key, { attempts: recent, blockedUntil });
    return { allowed: false, remaining: 0, retryAfterSec: Math.ceil(cfg.blockMs / 1000) };
  }

  writeBucket(key, { attempts: recent });
  return {
    allowed: true,
    remaining: cfg.maxAttempts - recent.length,
    retryAfterSec: 0,
  };
}

export function resetRateLimit(key: string): void {
  const store = safeStorage();
  if (!store) return;
  try {
    store.removeItem(STORAGE_PREFIX + key);
  } catch {
    /* ignore */
  }
}

/** Default config for auth endpoints: 5 attempts / 15 min, then 15 min block. */
export const AUTH_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
  blockMs: 15 * 60 * 1000,
};
