import { readdir, readFile, writeFile, stat, mkdir } from 'fs/promises';
import { join, resolve, relative, extname, basename, dirname } from 'path';

export interface TreeNode {
  name: string;
  displayName: string;
  path: string;
  type: 'file' | 'directory';
  children?: TreeNode[];
}

export interface CollectionSummary {
  name: string;
  displayName: string;
  path: string;
  type: 'collection' | 'standalone';
  description?: string;
  documentCount?: number;
  lastModified?: string;
}

export interface DocumentContent {
  path: string;
  title: string;
  markdown: string;
  lastModified: string;
  size: number;
}

const IGNORED = new Set(['.git', 'node_modules', '.tmp']);
const CONTENT_DIR = resolve(process.env.CONTENT_DIR || '/app/content');

function toDisplayName(filename: string): string {
  if (filename === 'README.md') return 'README';
  let name = filename.replace(/\.md$/i, '');
  name = name.replace(/^\d+[-_.]\s*/, '');
  name = name.replace(/[-_]/g, ' ');
  return name.replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractTitle(markdown: string): string | null {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function extractDescription(markdown: string): string | null {
  const lines = markdown.split('\n');
  let pastTitle = false;
  let paragraph = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!pastTitle) {
      if (/^#\s+/.test(trimmed)) pastTitle = true;
      continue;
    }
    if (trimmed === '') {
      if (paragraph) break;
      continue;
    }
    if (/^#+\s+/.test(trimmed)) {
      if (paragraph) break;
      continue;
    }
    paragraph += (paragraph ? ' ' : '') + trimmed;
  }

  if (!paragraph) return null;
  return paragraph.length > 200 ? paragraph.slice(0, 200) : paragraph;
}

function getSortKey(name: string): [number, string] {
  const match = name.match(/^(\d+)[-_.]/);
  return match ? [parseInt(match[1], 10), name.slice(match[0].length)] : [Infinity, name];
}

function compareSortKeys(a: string, b: string): number {
  const [aNum, aName] = getSortKey(a);
  const [bNum, bName] = getSortKey(b);
  if (aNum !== bNum) return aNum - bNum;
  return aName.localeCompare(bName);
}

function isIgnored(name: string): boolean {
  return name.startsWith('.') || IGNORED.has(name);
}

function isPathSafe(relativePath: string): boolean {
  const full = resolve(CONTENT_DIR, relativePath);
  return full === CONTENT_DIR || full.startsWith(CONTENT_DIR + '/');
}

async function buildTree(absDir: string, relDir: string): Promise<TreeNode> {
  const entries = await readdir(absDir, { withFileTypes: true });
  const children: TreeNode[] = [];

  const dirs: string[] = [];
  const files: string[] = [];

  for (const entry of entries) {
    if (isIgnored(entry.name)) continue;
    if (entry.isDirectory()) dirs.push(entry.name);
    else if (entry.isFile() && extname(entry.name).toLowerCase() === '.md') files.push(entry.name);
  }

  dirs.sort(compareSortKeys);
  files.sort(compareSortKeys);

  for (const name of dirs) {
    const subtree = await buildTree(join(absDir, name), relDir ? `${relDir}/${name}` : name);
    if (subtree.children && subtree.children.length > 0) children.push(subtree);
  }

  for (const name of files) {
    const childRel = relDir ? `${relDir}/${name}` : name;
    children.push({
      name,
      displayName: toDisplayName(name),
      path: childRel.replace(/\.md$/i, ''),
      type: 'file',
    });
  }

  return {
    name: basename(absDir),
    displayName: toDisplayName(basename(absDir)),
    path: relDir,
    type: 'directory',
    children,
  };
}

// Simple TTL cache
const cache = new Map<string, { data: unknown; expires: number }>();
const TTL = 60_000;

function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expires) {
    cache.delete(key);
    return undefined;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, expires: Date.now() + TTL });
}

export function invalidateCache() {
  cache.clear();
}

export async function getTree(): Promise<TreeNode> {
  const cached = getCached<TreeNode>('tree');
  if (cached) return cached;
  try {
    const tree = await buildTree(CONTENT_DIR, '');
    setCache('tree', tree);
    return tree;
  } catch {
    return { name: 'content', displayName: 'Content', path: '', type: 'directory', children: [] };
  }
}

export async function getContent(relativePath: string): Promise<DocumentContent | null> {
  if (!isPathSafe(relativePath)) return null;

  const cached = getCached<DocumentContent>(relativePath);
  if (cached) return cached;

  const fullPath = resolve(CONTENT_DIR, relativePath);
  let filePath: string;
  let fileStat: Awaited<ReturnType<typeof stat>>;

  try {
    const s = await stat(fullPath);
    if (s.isDirectory()) {
      filePath = join(fullPath, 'README.md');
      fileStat = await stat(filePath);
    } else {
      filePath = fullPath;
      fileStat = s;
    }
  } catch {
    const withExt = fullPath + '.md';
    try {
      fileStat = await stat(withExt);
      filePath = withExt;
    } catch {
      return null;
    }
  }

  if (!filePath.startsWith(CONTENT_DIR + '/') && filePath !== CONTENT_DIR) return null;

  const markdown = await readFile(filePath, 'utf-8');
  const title = extractTitle(markdown) || toDisplayName(basename(filePath));

  const doc: DocumentContent = {
    path: relative(CONTENT_DIR, filePath).replace(/\.md$/i, ''),
    title,
    markdown,
    lastModified: fileStat.mtime.toISOString(),
    size: fileStat.size,
  };

  setCache(relativePath, doc);
  return doc;
}

export async function writeContent(relativePath: string, markdown: string): Promise<void> {
  if (!isPathSafe(relativePath)) throw new Error('Invalid path');

  let fullPath = resolve(CONTENT_DIR, relativePath);
  if (!fullPath.endsWith('.md')) fullPath += '.md';
  if (!fullPath.startsWith(CONTENT_DIR + '/')) throw new Error('Invalid path');
  if (extname(fullPath).toLowerCase() !== '.md') throw new Error('Only .md files are allowed');

  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, markdown, 'utf-8');
  invalidateCache();
}

export async function listCollections(): Promise<CollectionSummary[]> {
  const cached = getCached<CollectionSummary[]>('collections');
  if (cached) return cached;

  let entries;
  try {
    entries = await readdir(CONTENT_DIR, { withFileTypes: true });
  } catch {
    return [];
  }

  const dirs: string[] = [];
  const files: string[] = [];

  for (const entry of entries) {
    if (isIgnored(entry.name)) continue;
    if (entry.isDirectory()) dirs.push(entry.name);
    else if (entry.isFile() && extname(entry.name).toLowerCase() === '.md') files.push(entry.name);
  }

  dirs.sort(compareSortKeys);
  files.sort(compareSortKeys);

  const results: CollectionSummary[] = [];

  for (const name of dirs) {
    let description: string | undefined;
    try {
      const content = await readFile(join(CONTENT_DIR, name, 'README.md'), 'utf-8');
      description = extractDescription(content) || undefined;
    } catch {
      /* no README */
    }
    const dirFiles: string[] = [];
    try {
      await collectFiles(join(CONTENT_DIR, name), '', dirFiles);
    } catch {
      /* skip */
    }
    let latestMod = '';
    for (const f of dirFiles.slice(0, 50)) {
      try {
        const s = await stat(join(CONTENT_DIR, name, f));
        const mod = s.mtime.toISOString();
        if (mod > latestMod) latestMod = mod;
      } catch {
        /* skip */
      }
    }
    results.push({
      name,
      displayName: toDisplayName(name),
      path: name,
      type: 'collection',
      description,
      documentCount: dirFiles.length,
      lastModified: latestMod || undefined,
    });
  }

  for (const name of files) {
    let description: string | undefined;
    let lastModified: string | undefined;
    try {
      const content = await readFile(join(CONTENT_DIR, name), 'utf-8');
      description = extractDescription(content) || undefined;
    } catch {
      /* skip */
    }
    try {
      const s = await stat(join(CONTENT_DIR, name));
      lastModified = s.mtime.toISOString();
    } catch {
      /* skip */
    }
    results.push({
      name,
      displayName: toDisplayName(name),
      path: name.replace(/\.md$/i, ''),
      type: 'standalone',
      description,
      documentCount: 1,
      lastModified,
    });
  }

  setCache('collections', results);
  return results;
}

export interface CollectionInfo {
  name: string;
  displayName: string;
  path: string;
  description?: string;
  documentCount: number;
  lastModified: string;
  documents: { displayName: string; path: string; lastModified: string }[];
}

export async function getCollectionInfo(relativePath: string): Promise<CollectionInfo | null> {
  if (!isPathSafe(relativePath)) return null;

  const fullPath = resolve(CONTENT_DIR, relativePath);
  try {
    const s = await stat(fullPath);
    if (!s.isDirectory()) return null;
  } catch {
    return null;
  }

  const tree = await getTree();
  const parts = relativePath.split('/').filter(Boolean);
  let node: TreeNode | undefined = tree;
  for (const part of parts) {
    node = node?.children?.find((c) => c.name === part);
    if (!node) return null;
  }

  // Extract description from README.md if it exists
  let description: string | undefined;
  try {
    const readme = await readFile(join(fullPath, 'README.md'), 'utf-8');
    description = extractDescription(readme) || undefined;
  } catch {
    /* no README */
  }

  // Flatten all file nodes
  const docs: CollectionInfo['documents'] = [];
  async function collectDocs(n: TreeNode) {
    if (n.type === 'file') {
      let lastMod = '';
      try {
        let fp = resolve(CONTENT_DIR, n.path + '.md');
        const s = await stat(fp);
        lastMod = s.mtime.toISOString();
      } catch {
        try {
          const fp = resolve(CONTENT_DIR, n.path);
          const s = await stat(fp);
          lastMod = s.mtime.toISOString();
        } catch {
          /* skip */
        }
      }
      docs.push({ displayName: n.displayName, path: n.path, lastModified: lastMod });
    }
    if (n.children) {
      for (const child of n.children) await collectDocs(child);
    }
  }
  if (node.children) {
    for (const child of node.children) await collectDocs(child);
  }

  const lastModified = docs.reduce((latest, d) => (d.lastModified > latest ? d.lastModified : latest), '');

  return {
    name: node.name,
    displayName: node.displayName,
    path: relativePath,
    description,
    documentCount: docs.length,
    lastModified,
    documents: docs,
  };
}

export interface RecentDocument {
  path: string;
  displayName: string;
  collection: string | null;
  lastModified: string;
}

export async function getRecentlyUpdated(limit = 10): Promise<RecentDocument[]> {
  const cached = getCached<RecentDocument[]>('recent');
  if (cached) return cached;

  const allFiles = await getAllFiles();
  const docs: RecentDocument[] = [];

  for (const file of allFiles) {
    try {
      const s = await stat(join(CONTENT_DIR, file));
      const parts = file.split('/');
      docs.push({
        path: file.replace(/\.md$/i, ''),
        displayName: toDisplayName(basename(file)),
        collection: parts.length > 1 ? parts[0] : null,
        lastModified: s.mtime.toISOString(),
      });
    } catch {
      /* skip */
    }
  }

  docs.sort((a, b) => b.lastModified.localeCompare(a.lastModified));
  const result = docs.slice(0, limit);
  setCache('recent', result);
  return result;
}

export async function getAllFiles(): Promise<string[]> {
  const results: string[] = [];
  try {
    await collectFiles(CONTENT_DIR, '', results);
  } catch {
    return [];
  }
  return results;
}

async function collectFiles(absDir: string, relDir: string, results: string[]): Promise<void> {
  const entries = await readdir(absDir, { withFileTypes: true });
  for (const entry of entries) {
    if (isIgnored(entry.name)) continue;
    const childRel = relDir ? `${relDir}/${entry.name}` : entry.name;
    if (entry.isDirectory()) await collectFiles(join(absDir, entry.name), childRel, results);
    else if (entry.isFile() && extname(entry.name).toLowerCase() === '.md') results.push(childRel);
  }
}
