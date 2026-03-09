import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit, RefreshCw, ChevronRight, ChevronDown, Folder, FileText } from 'lucide-react';
import { TreeNode } from '../types';
import { contentApi } from '../services/api';

const TreeItem: React.FC<{ node: TreeNode; depth?: number }> = ({ node, depth = 0 }) => {
  const [expanded, setExpanded] = useState(false);

  if (node.type === 'file') {
    return (
      <div
        className="flex items-center justify-between gap-2 py-1.5 px-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-900 dark:text-white truncate">{node.displayName}</span>
        </div>
        <Link
          to={`/admin/edit/${node.path}`}
          className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex-shrink-0"
          title="Edit"
        >
          <Edit className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 py-1.5 px-2 w-full text-left hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
        <Folder className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <span className="text-sm font-medium text-gray-900 dark:text-white">{node.displayName}</span>
      </button>
      {expanded && node.children && (
        <div>
          {node.children.map(child => (
            <TreeItem key={child.path} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const AdminPapers: React.FC = () => {
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [reindexing, setReindexing] = useState(false);

  useEffect(() => {
    contentApi.getTree()
      .then(data => setTree(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleReindex = async () => {
    setReindexing(true);
    try {
      await contentApi.reindex();
    } catch {
      alert('Reindex failed.');
    } finally {
      setReindexing(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Files</h1>
        <button
          onClick={handleReindex}
          disabled={reindexing}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${reindexing ? 'animate-spin' : ''}`} />
          {reindexing ? 'Reindexing...' : 'Reindex'}
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-white dark:bg-gray-900 rounded-lg p-4">
              <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : !tree || (tree.children && tree.children.length === 0) ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No files found.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-2">
          {tree.children ? (
            tree.children.map(child => (
              <TreeItem key={child.path} node={child} />
            ))
          ) : (
            <TreeItem node={tree} />
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPapers;
