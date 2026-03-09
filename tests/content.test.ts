import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

let contentDir: string;

// We test the pure functions by setting CONTENT_DIR and importing fresh
// Since content.ts reads CONTENT_DIR at module level, we set env before import
beforeAll(async () => {
  contentDir = await mkdtemp(join(tmpdir(), 'vector-test-'));
  process.env.CONTENT_DIR = contentDir;

  // Create test content structure
  await mkdir(join(contentDir, 'test-collection'));
  await writeFile(
    join(contentDir, 'test-collection', 'README.md'),
    '# Test Collection\n\nThis is a test collection description.\n\n## Section\nMore content.',
  );
  await writeFile(
    join(contentDir, 'test-collection', '01-first-doc.md'),
    '# First Document\n\nFirst document content here.',
  );
  await writeFile(
    join(contentDir, 'test-collection', '02-second-doc.md'),
    '# Second Document\n\nSecond document content here.',
  );
  await writeFile(join(contentDir, 'standalone.md'), '# Standalone Doc\n\nA standalone document.');
});

afterAll(async () => {
  await rm(contentDir, { recursive: true, force: true });
});

describe('content', () => {
  it('listCollections returns collections and standalone files', async () => {
    const { listCollections } = await import('@/lib/content');
    const collections = await listCollections();

    expect(collections.length).toBe(2);

    const collection = collections.find((c) => c.type === 'collection');
    expect(collection).toBeDefined();
    expect(collection!.name).toBe('test-collection');
    expect(collection!.displayName).toBe('Test Collection');
    expect(collection!.description).toContain('test collection description');

    const standalone = collections.find((c) => c.type === 'standalone');
    expect(standalone).toBeDefined();
    expect(standalone!.path).toBe('standalone');
  });

  it('getTree builds correct tree structure', async () => {
    const { getTree, invalidateCache } = await import('@/lib/content');
    invalidateCache();
    const tree = await getTree();

    expect(tree.type).toBe('directory');
    expect(tree.children).toBeDefined();
    expect(tree.children!.length).toBeGreaterThan(0);

    const collectionNode = tree.children!.find((c) => c.name === 'test-collection');
    expect(collectionNode).toBeDefined();
    expect(collectionNode!.type).toBe('directory');
    expect(collectionNode!.children!.length).toBe(3); // README + 2 docs
  });

  it('getContent reads a document by path', async () => {
    const { getContent, invalidateCache } = await import('@/lib/content');
    invalidateCache();
    const doc = await getContent('test-collection/01-first-doc');

    expect(doc).not.toBeNull();
    expect(doc!.title).toBe('First Document');
    expect(doc!.markdown).toContain('First document content here.');
  });

  it('getContent reads directory README', async () => {
    const { getContent, invalidateCache } = await import('@/lib/content');
    invalidateCache();
    const doc = await getContent('test-collection');

    expect(doc).not.toBeNull();
    expect(doc!.title).toBe('Test Collection');
  });

  it('getContent returns null for nonexistent path', async () => {
    const { getContent, invalidateCache } = await import('@/lib/content');
    invalidateCache();
    const doc = await getContent('nonexistent/path');
    expect(doc).toBeNull();
  });

  it('getContent blocks path traversal', async () => {
    const { getContent, invalidateCache } = await import('@/lib/content');
    invalidateCache();
    const doc = await getContent('../../etc/passwd');
    expect(doc).toBeNull();
  });

  it('writeContent creates and updates files', async () => {
    const { writeContent, getContent, invalidateCache } = await import('@/lib/content');
    invalidateCache();

    await writeContent('test-collection/new-doc', '# New Doc\n\nNew content.');
    invalidateCache();
    const doc = await getContent('test-collection/new-doc');

    expect(doc).not.toBeNull();
    expect(doc!.title).toBe('New Doc');
    expect(doc!.markdown).toContain('New content.');
  });

  it('writeContent rejects path traversal', async () => {
    const { writeContent } = await import('@/lib/content');
    await expect(writeContent('../../etc/evil', 'bad')).rejects.toThrow('Invalid path');
  });

  it('getAllFiles returns all markdown files', async () => {
    const { getAllFiles } = await import('@/lib/content');
    const files = await getAllFiles();

    expect(files.length).toBeGreaterThanOrEqual(4); // README + 2 docs + standalone + new-doc
    expect(files.some((f) => f.includes('standalone.md'))).toBe(true);
    expect(files.some((f) => f.includes('01-first-doc.md'))).toBe(true);
  });
});
