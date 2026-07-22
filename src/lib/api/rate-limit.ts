import { rateLimited } from './errors';

/**
 * A small in memory fixed window rate limiter. It is per process, which is fine
 * for a single instance or for slowing abuse on one node. For a multi instance
 * deployment, back this with Redis using the same interface.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
}

/**
 * Applies a fixed window rate limit and throws a 429 when the caller is over it.
 * A thin wrapper over rateLimit for authenticated route handlers, keyed by
 * organization so one tenant cannot exhaust the limit for another.
 */
export function enforceRateLimit(key: string, limit: number, windowMs: number): void {
  if (!rateLimit(key, limit, windowMs).allowed) {
    throw rateLimited('Too many requests. Please slow down and try again in a moment.');
  }
}
