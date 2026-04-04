const windowMs = 60_000;
const maxRequests = 10;

const hits = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now >= entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count += 1;
  return entry.count > maxRequests;
}

export function getRateLimitHeaders(ip: string): Record<string, string> {
  const entry = hits.get(ip);
  if (!entry) {
    return {
      "X-RateLimit-Limit": String(maxRequests),
      "X-RateLimit-Remaining": String(maxRequests),
    };
  }

  const remaining = Math.max(0, maxRequests - entry.count);
  const reset = Math.ceil((entry.resetAt - Date.now()) / 1000);
  return {
    "X-RateLimit-Limit": String(maxRequests),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.max(0, reset)),
  };
}

// Clean up stale entries periodically
if (typeof globalThis !== "undefined") {
  const CLEANUP_INTERVAL = 5 * 60_000;
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of hits) {
      if (now >= entry.resetAt) {
        hits.delete(ip);
      }
    }
  }, CLEANUP_INTERVAL);

  if (typeof timer === "object" && "unref" in timer) {
    timer.unref();
  }
}
