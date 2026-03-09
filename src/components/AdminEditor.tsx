import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useBlocker } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import {
  ArrowLeft, Eye, Edit, Columns, Save,
  Bold, Italic, Strikethrough, Heading2, Heading3,
  Link2, Image, Code, Quote, List, ListOrdered, Minus, Table,
} from 'lucide-react';
import { contentApi } from '../services/api';

import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github.css';

type ViewMode = 'edit' | 'preview' | 'split';

// --- Toolbar helpers ---

const ToolbarButton: React.FC<{
  icon: React.FC<{ className?: string }>;
  title: string;
  onClick: () => void;
}> = ({ icon: Icon, title, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
  >
    <Icon className="w-4 h-4" />
  </button>
);

const ToolbarDivider: React.FC = () => (
  <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />
);

// Custom icons for toolbar items not in lucide
const CodeBlock: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const MathIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20h4l4-16h4" />
    <path d="M15 7h5" />
    <path d="M17.5 4.5v5" />
  </svg>
);

const MarkdownPreview: React.FC<{ markdown: string }> = ({ markdown }) => (
  <article className="prose prose-gray dark:prose-invert max-w-none">
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex, rehypeHighlight]}
    >
      {markdown}
    </ReactMarkdown>
  </article>
);

export const AdminEditor: React.FC = () => {
  const { '*': wildcard } = useParams();
  const path = wildcard || '';

  const [markdown, setMarkdown] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [lastAutosaved, setLastAutosaved] = useState<string | null>(null);
  const autosaveTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Insert markdown syntax around selection or at cursor
  const insertMarkdown = useCallback((
    before: string,
    after: string = '',
    defaultText: string = '',
    blockLevel: boolean = false,
  ) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = markdown.substring(start, end);
    const text = selected || defaultText;

    let insert: string;
    let cursorStart: number;
    let cursorEnd: number;

    if (blockLevel) {
      // For block-level elements, ensure we're on a new line
      const needsNewlineBefore = start > 0 && markdown[start - 1] !== '\n';
      const needsNewlineAfter = end < markdown.length && markdown[end] !== '\n';
      const prefix = needsNewlineBefore ? '\n' : '';
      const suffix = needsNewlineAfter ? '\n' : '';
      insert = `${prefix}${before}${text}${after}${suffix}`;
      cursorStart = start + prefix.length + before.length;
      cursorEnd = cursorStart + text.length;
    } else {
      insert = `${before}${text}${after}`;
      cursorStart = start + before.length;
      cursorEnd = cursorStart + text.length;
    }

    const newMarkdown = markdown.substring(0, start) + insert + markdown.substring(end);
    setMarkdown(newMarkdown);
    setDirty(true);

    // Restore focus and selection after React re-render
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(cursorStart, cursorEnd);
    });
  }, [markdown]);

  useEffect(() => {
    if (!path) {
      setLoading(false);
      return;
    }
    contentApi.getContent(path)
      .then(doc => {
        setMarkdown(doc.markdown || '');
      })
      .catch(err => setError(err?.message || 'Failed to load file'))
      .finally(() => setLoading(false));
  }, [path]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      await contentApi.writeContent(path, markdown);
      setDirty(false);
      setLastAutosaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err: any) {
      setError(err?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [path, markdown]);

  const dirtyRef = useRef(dirty);
  const savingRef = useRef(saving);
  const handleSaveRef = useRef(handleSave);
  dirtyRef.current = dirty;
  savingRef.current = saving;
  handleSaveRef.current = handleSave;

  // Ctrl+S / Cmd+S keyboard shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (!savingRef.current) {
          handleSaveRef.current();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Autosave interval
  useEffect(() => {
    if (!path) return;
    autosaveTimer.current = setInterval(async () => {
      if (dirtyRef.current && !savingRef.current) {
        await handleSaveRef.current();
      }
    }, 30000);
    return () => {
      if (autosaveTimer.current) clearInterval(autosaveTimer.current);
    };
  }, [path]);

  // Warn on browser close/refresh with unsaved changes
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  // Warn on React Router navigation with unsaved changes
  const blocker = useBlocker(dirty);

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const showEditor = viewMode === 'edit' || viewMode === 'split';
  const showPreview = viewMode === 'preview' || viewMode === 'split';

  return (
    <div className="flex flex-col h-full">
      {/* Navigation blocker dialog */}
      {blocker.state === 'blocked' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-sm mx-4">
            <p className="text-sm text-gray-900 dark:text-white mb-4">
              You have unsaved changes. Discard them?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => blocker.reset()}
                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                Keep editing
              </button>
              <button
                onClick={() => blocker.proceed()}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 lg:px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/admin/files"
              className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="text-sm font-mono text-gray-500 dark:text-gray-400 truncate">
              {path}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {dirty && (
              <span className="text-xs text-amber-500">Unsaved changes</span>
            )}
            {!dirty && lastAutosaved && (
              <span className="text-xs text-gray-400">Saved {lastAutosaved}</span>
            )}
            <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-md">
              <button
                onClick={() => setViewMode('edit')}
                className={`p-2 rounded-l-md transition-colors ${
                  viewMode === 'edit'
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                    : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`p-2 border-x border-gray-200 dark:border-gray-700 transition-colors ${
                  viewMode === 'split'
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                    : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hidden lg:block'
                }`}
                title="Split view"
              >
                <Columns className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`p-2 rounded-r-md transition-colors ${
                  viewMode === 'preview'
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                    : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                title="Preview"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Markdown formatting toolbar */}
      {showEditor && (
        <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 px-4 lg:px-6 flex items-center gap-0.5 h-10 overflow-x-auto">
          <ToolbarButton icon={Bold} title="Bold (Ctrl+B)" onClick={() => insertMarkdown('**', '**', 'bold')} />
          <ToolbarButton icon={Italic} title="Italic (Ctrl+I)" onClick={() => insertMarkdown('*', '*', 'italic')} />
          <ToolbarButton icon={Strikethrough} title="Strikethrough" onClick={() => insertMarkdown('~~', '~~', 'text')} />
          <ToolbarDivider />
          <ToolbarButton icon={Heading2} title="Heading 2" onClick={() => insertMarkdown('## ', '', 'Heading', true)} />
          <ToolbarButton icon={Heading3} title="Heading 3" onClick={() => insertMarkdown('### ', '', 'Heading', true)} />
          <ToolbarDivider />
          <ToolbarButton icon={Link2} title="Link" onClick={() => insertMarkdown('[', '](url)', 'text')} />
          <ToolbarButton icon={Image} title="Image" onClick={() => insertMarkdown('![', '](url)', 'alt text')} />
          <ToolbarButton icon={Code} title="Inline code" onClick={() => insertMarkdown('`', '`', 'code')} />
          <ToolbarButton icon={CodeBlock} title="Code block" onClick={() => insertMarkdown('```\n', '\n```', 'code', true)} />
          <ToolbarDivider />
          <ToolbarButton icon={Quote} title="Blockquote" onClick={() => insertMarkdown('> ', '', 'quote', true)} />
          <ToolbarButton icon={List} title="Bullet list" onClick={() => insertMarkdown('- ', '', 'item', true)} />
          <ToolbarButton icon={ListOrdered} title="Numbered list" onClick={() => insertMarkdown('1. ', '', 'item', true)} />
          <ToolbarButton icon={Minus} title="Horizontal rule" onClick={() => insertMarkdown('---', '', '', true)} />
          <ToolbarDivider />
          <ToolbarButton icon={Table} title="Table" onClick={() => insertMarkdown('| Column 1 | Column 2 |\n| --- | --- |\n| ', ' | cell |', 'cell', true)} />
          <ToolbarButton icon={MathIcon} title="Math (LaTeX)" onClick={() => insertMarkdown('$', '$', 'E = mc^2')} />
        </div>
      )}

      {error && (
        <div className="px-4 lg:px-6 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Editor / Preview */}
      <div className={`flex-1 ${viewMode === 'split' ? 'flex' : ''}`}>
        {showEditor && (
          <textarea
            ref={textareaRef}
            value={markdown}
            onChange={e => { setMarkdown(e.target.value); setDirty(true); }}
            placeholder="Write markdown..."
            className={`${
              viewMode === 'split' ? 'w-1/2 border-r border-gray-200 dark:border-gray-700' : 'w-full'
            } h-full min-h-[60vh] p-6 bg-white dark:bg-gray-950 text-gray-900 dark:text-white font-mono text-sm focus:outline-none resize-none`}
          />
        )}
        {showPreview && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} overflow-y-auto`}>
            <div className="max-w-3xl mx-auto px-6 py-8">
              <MarkdownPreview markdown={markdown} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminEditor;
