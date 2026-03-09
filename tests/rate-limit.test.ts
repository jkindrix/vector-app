import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

vi.useFakeTimers();

let checkRateLimit: typeof import('../lib/rate-limit').checkRateLimit;

beforeAll(async () => {
  const mod = await import('../lib/rate-limit');
  checkRateLimit = mod.checkRateLimit;
});

describe('Rate Limiter', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
  });

  it('allows first request from an IP', () => {
    const result = checkRateLimit('10.0.0.1');
    expect(result.allowed).toBe(true);
  });

  it('allows up to 5 requests from the same IP', () => {
    const ip = '10.0.0.2';
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(ip);
      expect(result.allowed).toBe(true);
    }
  });

  it('blocks the 6th request from the same IP', () => {
    const ip = '10.0.0.3';
    for (let i = 0; i < 5; i++) {
      checkRateLimit(ip);
    }
    const result = checkRateLimit(ip);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('allows requests from different IPs independently', () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit('10.0.0.4');
    }
    const result = checkRateLimit('10.0.0.5');
    expect(result.allowed).toBe(true);
  });

  it('resets after the window expires', () => {
    const ip = '10.0.0.6';
    for (let i = 0; i < 5; i++) {
      checkRateLimit(ip);
    }
    expect(checkRateLimit(ip).allowed).toBe(false);

    // Advance past the 15-minute window
    vi.advanceTimersByTime(15 * 60 * 1000 + 1);

    const result = checkRateLimit(ip);
    expect(result.allowed).toBe(true);
  });
});
