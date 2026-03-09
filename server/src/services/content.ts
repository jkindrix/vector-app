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
}

export interface DocumentContent {
  path: string;
  title: string;
  markdown: string;
  lastModified: string;
  size: number;
}

const IGNORED = new Set(['.git', 'node_modules', '.tmp']);

const CACHE_TTL_MS = 60_000; // 1 minute

interface CacheEntry<T> {
  data: T;
  expires: number;
}

class TTLCache<T> {
  private store = new Map<string, CacheEntry<T>>();

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expires) {
      this.store.delete(key);
      return undefined;
    }
    return entry.data;
  }

  set(key: string, data: T, ttl: number = CACHE_TTL_MS): void {
    this.store.set(key, { data, expires: Date.now() + ttl });
  }

  invalidate(key?: string): void {
    if (key) {
      this.store.delete(key);
    } else {
      this.store.clear();
    }
  }
}

function toDisplayName(filename: string): string {
  if (filename === 'README.md') return 'README';
  let name = filename.replace(/\.md$/i, '');
  name = name.replace(/^\d+[-_.]\s*/, '');
  name = name.replace(/[-_]/g, ' ');
  return name.replace(/\b\w/g, c => c.toUpperCase());
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
      if (/^#\s+/.test(trimmed)) {
        pastTitle = true;
      }
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
  if (match) {
    return [parseInt(match[1], 10), name.slice(match[0].length)];
  }
  return [Infinity, name];
}

function compareSortKeys(a: string, b: string): number {
  const [aNum, aName] = getSortKey(a);
  const [bNum, bName] = getSortKey(b);
  if (aNum !== bNum) return aNum - bNum;
  return aName.localeCompare(bName);
}

export class ContentService {
  private readonly resolvedRoot: string;
  private treeCache = new TTLCache<TreeNode>();
  private collectionsCache = new TTLCache<CollectionSummary[]>();
  private contentCache = new TTLCache<DocumentContent>();

  constructor(contentDir: string) {
    this.resolvedRoot = resolve(contentDir);
  }

  invalidateCache(): void {
    this.treeCache.invalidate();
    this.collectionsCache.invalidate();
    this.contentCache.invalidate();
  }

  private isPathSafe(relativePath: string): boolean {
    const full = resolve(this.resolvedRoot, relativePath);
    return full === this.resolvedRoot || full.startsWith(this.resolvedRoot + '/');
  }

  private isIgnored(name: string): boolean {
    return name.startsWith('.') || IGNORED.has(name);
  }

  async getTree(): Promise<TreeNode> {
    const cached = this.treeCache.get('tree');
    if (cached) return cached;
    const tree = await this.buildTree(this.resolvedRoot, '');
    this.treeCache.set('tree', tree);
    return tree;
  }

  private async buildTree(absDir: string, relDir: string): Promise<TreeNode> {
    const entries = await readdir(absDir, { withFileTypes: true });
    const children: TreeNode[] = [];

    const dirs: string[] = [];
    const files: string[] = [];

    for (const entry of entries) {
      if (this.isIgnored(entry.name)) continue;

      if (entry.isDirectory()) {
        dirs.push(entry.name);
      } else if (entry.isFile() && extname(entry.name).toLowerCase() === '.md') {
        files.push(entry.name);
      }
    }

    dirs.sort(compareSortKeys);
    files.sort(compareSortKeys);

    for (const name of dirs) {
      const childAbs = join(absDir, name);
      const childRel = relDir ? `${relDir}/${name}` : name;
      const subtree = await this.buildTree(childAbs, childRel);
      if (subtree.children && subtree.children.length > 0) {
        children.push(subtree);
      }
    }

    for (const name of files) {
      const childRel = relDir ? `${relDir}/${name}` : name;
      const pathWithoutExt = childRel.replace(/\.md$/i, '');
      children.push({
        name,
        displayName: toDisplayName(name),
        path: pathWithoutExt,
        type: 'file',
      });
    }

    const dirName = basename(absDir);
    return {
      name: dirName,
      displayName: toDisplayName(dirName),
      path: relDir,
      type: 'directory',
      children,
    };
  }

  async getContent(relativePath: string): Promise<DocumentContent | null> {
    if (!this.isPathSafe(relativePath)) return null;

    const cached = this.contentCache.get(relativePath);
    if (cached) return cached;

    const fullPath = resolve(this.resolvedRoot, relativePath);
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
      // Try appending .md extension
      const withExt = fullPath + '.md';
      try {
        fileStat = await stat(withExt);
        filePath = withExt;
      } catch {
        return null;
      }
    }

    if (!filePath.startsWith(this.resolvedRoot + '/') && filePath !== this.resolvedRoot) {
      return null;
    }

    const markdown = await readFile(filePath, 'utf-8');
    const relFromRoot = relative(this.resolvedRoot, filePath);
    const title = extractTitle(markdown) || toDisplayName(basename(filePath));

    const doc: DocumentContent = {
      path: relFromRoot.replace(/\.md$/i, ''),
      title,
      markdown,
      lastModified: fileStat.mtime.toISOString(),
      size: fileStat.size,
    };

    this.contentCache.set(relativePath, doc);
    return doc;
  }

  async writeContent(relativePath: string, markdown: string): Promise<void> {
    if (!this.isPathSafe(relativePath)) {
      throw new Error('Invalid path');
    }

    let fullPath = resolve(this.resolvedRoot, relativePath);
    if (!fullPath.endsWith('.md')) {
      fullPath += '.md';
    }

    if (!fullPath.startsWith(this.resolvedRoot + '/')) {
      throw new Error('Invalid path');
    }

    if (extname(fullPath).toLowerCase() !== '.md') {
      throw new Error('Only .md files are allowed');
    }

    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, markdown, 'utf-8');
    this.invalidateCache();
  }

  async listCollections(): Promise<CollectionSummary[]> {
    const cached = this.collectionsCache.get('collections');
    if (cached) return cached;

    const entries = await readdir(this.resolvedRoot, { withFileTypes: true });

    const dirs: string[] = [];
    const files: string[] = [];

    for (const entry of entries) {
      if (this.isIgnored(entry.name)) continue;

      if (entry.isDirectory()) {
        dirs.push(entry.name);
      } else if (entry.isFile() && extname(entry.name).toLowerCase() === '.md') {
        files.push(entry.name);
      }
    }

    dirs.sort(compareSortKeys);
    files.sort(compareSortKeys);

    const results: CollectionSummary[] = [];

    for (const name of dirs) {
      const readmePath = join(this.resolvedRoot, name, 'README.md');
      let description: string | undefined;
      try {
        const content = await readFile(readmePath, 'utf-8');
        description = extractDescription(content) || undefined;
      } catch {
        // no README.md
      }

      results.push({
        name,
        displayName: toDisplayName(name),
        path: name,
        type: 'collection',
        description,
      });
    }

    for (const name of files) {
      let description: string | undefined;
      try {
        const content = await readFile(join(this.resolvedRoot, name), 'utf-8');
        description = extractDescription(content) || undefined;
      } catch {
        // skip
      }

      results.push({
        name,
        displayName: toDisplayName(name),
        path: name.replace(/\.md$/i, ''),
        type: 'standalone',
        description,
      });
    }

    this.collectionsCache.set('collections', results);
    return results;
  }

  async getAllFiles(): Promise<string[]> {
    const results: string[] = [];
    await this.collectFiles(this.resolvedRoot, '', results);
    return results;
  }

  private async collectFiles(absDir: string, relDir: string, results: string[]): Promise<void> {
    const entries = await readdir(absDir, { withFileTypes: true });

    for (const entry of entries) {
      if (this.isIgnored(entry.name)) continue;

      const childRel = relDir ? `${relDir}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        await this.collectFiles(join(absDir, entry.name), childRel, results);
      } else if (entry.isFile() && extname(entry.name).toLowerCase() === '.md') {
        results.push(childRel);
      }
    }
  }
}
