import { useState, useEffect } from 'react';
import { contentApi } from '../services/api';
import { TreeNode } from '../types';

let cachedTree: TreeNode | null = null;
let cacheExpiry = 0;
let inflight: Promise<TreeNode> | null = null;

const CACHE_TTL = 60_000; // 1 minute

function fetchTree(): Promise<TreeNode> {
  if (!inflight) {
    inflight = contentApi.getTree().then(tree => {
      cachedTree = tree;
      cacheExpiry = Date.now() + CACHE_TTL;
      inflight = null;
      return tree;
    }).catch(err => {
      inflight = null;
      throw err;
    });
  }
  return inflight;
}

export function useTree() {
  const [tree, setTree] = useState<TreeNode | null>(cachedTree);
  const [loading, setLoading] = useState(!cachedTree || Date.now() > cacheExpiry);

  useEffect(() => {
    if (cachedTree && Date.now() < cacheExpiry) {
      setTree(cachedTree);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchTree()
      .then(setTree)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { tree, loading };
}
