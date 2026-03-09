import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock lib modules before importing route handlers
vi.mock('../lib/database', () => ({
  ensureInitialized: vi.fn().mockResolvedValue(undefined),
  searchContent: vi.fn().mockResolvedValue({ results: [], total: 0 }),
}));

vi.mock('../lib/content', () => ({
  listCollections: vi
    .fn()
    .mockResolvedValue([{ path: 'test-collection', displayName: 'Test Collection', type: 'collection' }]),
}));

vi.mock('../lib/auth', () => ({
  getSessionUser: vi.fn().mockResolvedValue(null),
  authenticate: vi.fn().mockResolvedValue(null),
  setTokenCookie: vi.fn().mockReturnValue({ name: 'token', value: 'test' }),
}));

import { GET as healthGET } from '../app/api/health/route';
import { GET as collectionsGET } from '../app/api/collections/route';
import { GET as searchGET } from '../app/api/search/route';
import { ensureInitialized } from '../lib/database';
import { NextRequest } from 'next/server';

function makeRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

describe('GET /api/health', () => {
  it('returns healthy when database is available', async () => {
    const res = await healthGET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.status).toBe('healthy');
    expect(body.timestamp).toBeDefined();
  });

  it('returns unhealthy when database is unavailable', async () => {
    vi.mocked(ensureInitialized).mockRejectedValueOnce(new Error('DB down'));
    const res = await healthGET();
    const body = await res.json();
    expect(res.status).toBe(503);
    expect(body.status).toBe('unhealthy');
  });
});

describe('GET /api/collections', () => {
  it('returns collections with cache header', async () => {
    const res = await collectionsGET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].path).toBe('test-collection');
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=60');
  });
});

describe('GET /api/search', () => {
  it('returns 400 when query is missing', async () => {
    const req = makeRequest('/api/search');
    const res = await searchGET(req);
    expect(res.status).toBe(400);
  });

  it('returns results when query is provided', async () => {
    const req = makeRequest('/api/search?q=test');
    const res = await searchGET(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.results).toBeDefined();
  });
});
