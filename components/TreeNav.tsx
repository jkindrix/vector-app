'use client';

import Link from 'next/link';
import type { TreeNode } from '@/lib/content';

export function TreeNav({ node, currentPath, root = true }: { node: TreeNode; currentPath: string; root?: boolean }) {
  if (node.type === 'file') {
    const isActive = currentPath === node.path;
    return (
      <li role="treeitem" aria-selected={isActive}>
        <Link
          href={`/${node.path}`}
          aria-current={isActive ? 'page' : undefined}
          className={`block text-sm py-1 px-2 rounded transition-colors ${
            isActive
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          {node.displayName}
        </Link>
      </li>
    );
  }

  const content = (
    <>
      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2 py-1">
        {node.displayName}
      </div>
      <ul role="group" className="ml-1 border-l border-gray-200 dark:border-gray-700 pl-2">
        {node.children?.map((child) => (
          <TreeNav key={child.path} node={child} currentPath={currentPath} root={false} />
        ))}
      </ul>
    </>
  );

  if (root) {
    return (
      <ul role="tree" aria-label={node.displayName} className="mb-3">
        <li role="treeitem" aria-expanded={true} aria-selected={false}>
          {content}
        </li>
      </ul>
    );
  }

  return (
    <li role="treeitem" aria-expanded={true} aria-selected={false} className="mb-3">
      {content}
    </li>
  );
}
