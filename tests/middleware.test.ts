import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';

function makeRequest(path: string, cookie?: string): NextRequest {
  const url = new URL(path, 'http://localhost:3000');
  const headers = new Headers();
  if (cookie) {
    headers.set('cookie', `token=${cookie}`);
  }
  return new NextRequest(url, { headers });
}

describe('middleware', () => {
  it('allows access to /admin/login without token', () => {
    const req = makeRequest('/admin/login');
    const res = middleware(req);
    expect(res.status).not.toBe(307);
  });

  it('redirects /admin/files to login without token', () => {
    const req = makeRequest('/admin/files');
    const res = middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/admin/login');
  });

  it('redirects /admin/edit/doc to login without token', () => {
    const req = makeRequest('/admin/edit/doc');
    const res = middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/admin/login');
  });

  it('allows /admin/files with token cookie', () => {
    const req = makeRequest('/admin/files', 'some-token');
    const res = middleware(req);
    expect(res.status).not.toBe(307);
  });

  it('allows /admin/settings with token cookie', () => {
    const req = makeRequest('/admin/settings', 'some-token');
    const res = middleware(req);
    expect(res.status).not.toBe(307);
  });
});
