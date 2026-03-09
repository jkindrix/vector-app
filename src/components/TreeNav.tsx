import React from 'react';
import { Link } from 'react-router-dom';
import { TreeNode } from '../types';

export const TreeNav: React.FC<{
  node: TreeNode;
  currentPath: string;
  level?: number;
}> = ({ node, currentPath, level = 0 }) => {
  if (node.type === 'directory') {
    return (
      <div>
        <div
          className={`text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide ${level > 0 ? 'pl-4' : ''} py-1`}
          style={{ paddingLeft: level * 16 }}
        >
          {node.displayName}
        </div>
        {node.children?.map(child => (
          <TreeNav key={child.path} node={child} currentPath={currentPath} level={level + 1} />
        ))}
      </div>
    );
  }

  const isActive = node.path === currentPath;

  return (
    <Link
      to={`/${node.path}`}
      className={`block text-sm py-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
        isActive
          ? 'font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded'
          : 'text-gray-600 dark:text-gray-300'
      }`}
      style={{ paddingLeft: level * 16 }}
    >
      {node.displayName}
    </Link>
  );
};
