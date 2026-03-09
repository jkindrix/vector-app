import { describe, it, expect, beforeAll } from 'vitest';

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-for-vitest';
});

describe('auth', () => {
  it('generateToken creates a valid JWT', async () => {
    const { generateToken, verifyToken } = await import('@/lib/auth');
    const token = generateToken({ id: '1', username: 'admin' });

    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded!.id).toBe('1');
    expect(decoded!.username).toBe('admin');
  });

  it('verifyToken rejects invalid tokens', async () => {
    const { verifyToken } = await import('@/lib/auth');
    expect(verifyToken('invalid.token.here')).toBeNull();
    expect(verifyToken('')).toBeNull();
    expect(verifyToken('not-a-jwt')).toBeNull();
  });

  it('verifyToken rejects tokens signed with wrong secret', async () => {
    const jwt = await import('jsonwebtoken');
    const { verifyToken } = await import('@/lib/auth');

    const badToken = jwt.default.sign({ id: '1', username: 'admin' }, 'wrong-secret');
    expect(verifyToken(badToken)).toBeNull();
  });

  it('setTokenCookie returns correct cookie config', async () => {
    const { setTokenCookie } = await import('@/lib/auth');
    const cookie = setTokenCookie('test-token');

    expect(cookie.name).toBe('token');
    expect(cookie.value).toBe('test-token');
    expect(cookie.httpOnly).toBe(true);
    expect(cookie.sameSite).toBe('strict');
    expect(cookie.maxAge).toBe(86400);
    expect(cookie.path).toBe('/');
  });

  it('clearTokenCookie clears the token', async () => {
    const { clearTokenCookie } = await import('@/lib/auth');
    const cookie = clearTokenCookie();

    expect(cookie.name).toBe('token');
    expect(cookie.value).toBe('');
    expect(cookie.maxAge).toBe(0);
  });
});
