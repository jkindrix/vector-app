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

export interface Document {
  path: string;
  title: string;
  markdown: string;
  lastModified?: string;
  size?: number;
}

export interface SearchResult {
  file_path: string;
  title: string;
  collection: string | null;
  snippet: string;
}
