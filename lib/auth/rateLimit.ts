interface RateLimitEntry {
  timestamps: number[];
}

const windowMs = 60 * 1000; // 1 minute
const maxRequests = 10; // 10 attempts per minute per IP

const ipMap = new Map<string, RateLimitEntry>();

// Periodic cleanup of stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    ipMap.forEach((entry, ip) => {
      entry.timestamps = entry.timestamps.filter((ts) => now - ts < windowMs);
      if (entry.timestamps.length === 0) {
        ipMap.delete(ip);
      }
    });
  }, 5 * 60 * 1000);
}

/**
 * Checks if an IP is rate limited.
 * Returns true if allowed, false if rate limited.
 */
export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  let entry = ipMap.get(ip);

  if (!entry) {
    entry = { timestamps: [] };
    ipMap.set(ip, entry);
  }

  // Remove timestamps outside window
  entry.timestamps = entry.timestamps.filter((ts) => now - ts < windowMs);

  if (entry.timestamps.length >= maxRequests) {
    return false;
  }

  entry.timestamps.push(now);
  return true;
}
