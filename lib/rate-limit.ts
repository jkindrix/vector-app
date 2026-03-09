const attempts = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

export function checkRateLimit(ip: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const entry = attempts.get(ip);

  if (entry && now < entry.resetAt) {
    if (entry.count >= MAX_ATTEMPTS) {
      return { allowed: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
    }
    entry.count++;
    return { allowed: true };
  }

  attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  return { allowed: true };
}

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  attempts.forEach((entry, ip) => {
    if (now >= entry.resetAt) {
      attempts.delete(ip);
    }
  });
}, 60 * 1000);
