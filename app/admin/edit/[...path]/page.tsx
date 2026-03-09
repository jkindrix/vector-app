'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import 'katex/dist/katex.min.css';
import {
  ArrowLeft,
  Eye,
  Edit,
  Columns,
  Save,
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading3,
  Link2,
  Image,
  Code,
  Quote,
  List,
  ListOrdered,
  Minus,
  Table,
} from 'lucide-react';

type ViewMode = 'edit' | 'preview' | 'split';

function ToolbarButton({
  icon: Icon,
  title,
  onClick,
}: {
  icon: React.FC<{ className?: string }>;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />;
}

const CodeBlock: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const MathIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 20h4l4-16h4" />
    <path d="M15 7h5" />
    <path d="M17.5 4.5v5" />
  </svg>
);

export default function AdminEditor() {
  const params = useParams();
  const path = (params.path as string[])?.join('/') || '';

  const [markdown, setMarkdown] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      const ta = textareaRef.current;
      if (ta) {
        ta.focus();
        const imgMarkdown = `![${file.name}](${data.path})`;
        document.execCommand('insertText', false, imgMarkdown);
        setMarkdown(ta.value);
        setDirty(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, []);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) uploadFile(file);
          return;
        }
      }
    },
    [uploadFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      const files = e.dataTransfer?.files;
      if (!files?.length) return;
      const file = files[0];
      if (file.type.startsWith('image/')) {
        e.preventDefault();
        uploadFile(file);
      }
    },
    [uploadFile],
  );

  const insertMarkdown = useCallback(
    (before: string, after: string = '', defaultText: string = '', blockLevel: boolean = false) => {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.focus();
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const selected = ta.value.substring(start, end);
      const text = selected || defaultText;

      let insert: string;
      if (blockLevel) {
        const prefix = start > 0 && ta.value[start - 1] !== '\n' ? '\n' : '';
        const suffix = end < ta.value.length && ta.value[end] !== '\n' ? '\n' : '';
        insert = `${prefix}${before}${text}${after}${suffix}`;
      } else {
        insert = `${before}${text}${after}`;
      }

      // Use execCommand to preserve browser undo history
      ta.setSelectionRange(start, end);
      document.execCommand('insertText', false, insert);

      // Sync React state from the DOM (execCommand modifies the DOM directly)
      setMarkdown(ta.value);
      setDirty(true);

      const cursorStart = blockLevel
        ? start + (start > 0 && ta.value[start - 1] !== '\n' ? 1 : 0) + before.length
        : start + before.length;
      const cursorEnd = cursorStart + text.length;
      requestAnimationFrame(() => {
        ta.setSelectionRange(cursorStart, cursorEnd);
      });
    },
    [],
  );

  useEffect(() => {
    if (!path) {
      setLoading(false);
      return;
    }
    fetch(`/api/content/${path}`)
      .then((r) => r.json())
      .then((doc) => setMarkdown(doc.markdown || ''))
      .catch((err) => setError(err?.message || 'Failed to load file'))
      .finally(() => setLoading(false));
  }, [path]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      await fetch(`/api/content/${path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown }),
      });
      setDirty(false);
      setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err: any) {
      setError(err?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [path, markdown]);

  // Ctrl+S / Cmd+S
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSave]);

  // Autosave
  useEffect(() => {
    if (!path) return;
    const dirtyRef = { current: dirty };
    dirtyRef.current = dirty;
    const interval = setInterval(() => {
      if (dirtyRef.current) handleSave();
    }, 30000);
    return () => clearInterval(interval);
  }, [path, dirty, handleSave]);

  // Warn on close
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

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
    <div className="flex flex-col h-full -mx-6 -my-8">
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 lg:px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/admin/files" className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="text-sm font-mono text-gray-500 dark:text-gray-400 truncate">{path}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {dirty && <span className="text-xs text-amber-500">Unsaved changes</span>}
            {!dirty && lastSaved && <span className="text-xs text-gray-400">Saved {lastSaved}</span>}
            <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-md">
              <button
                onClick={() => setViewMode('edit')}
                className={`p-2 rounded-l-md transition-colors ${viewMode === 'edit' ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-400'}`}
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`p-2 border-x border-gray-200 dark:border-gray-700 transition-colors hidden lg:block ${viewMode === 'split' ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-400'}`}
                title="Split"
              >
                <Columns className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`p-2 rounded-r-md transition-colors ${viewMode === 'preview' ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-400'}`}
                title="Preview"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {showEditor && (
        <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 px-4 lg:px-6 flex items-center gap-0.5 h-10 overflow-x-auto">
          <ToolbarButton icon={Bold} title="Bold" onClick={() => insertMarkdown('**', '**', 'bold')} />
          <ToolbarButton icon={Italic} title="Italic" onClick={() => insertMarkdown('*', '*', 'italic')} />
          <ToolbarButton
            icon={Strikethrough}
            title="Strikethrough"
            onClick={() => insertMarkdown('~~', '~~', 'text')}
          />
          <ToolbarDivider />
          <ToolbarButton icon={Heading2} title="Heading 2" onClick={() => insertMarkdown('## ', '', 'Heading', true)} />
          <ToolbarButton
            icon={Heading3}
            title="Heading 3"
            onClick={() => insertMarkdown('### ', '', 'Heading', true)}
          />
          <ToolbarDivider />
          <ToolbarButton icon={Link2} title="Link" onClick={() => insertMarkdown('[', '](url)', 'text')} />
          <ToolbarButton icon={Image} title="Image" onClick={() => insertMarkdown('![', '](url)', 'alt text')} />
          <ToolbarButton icon={Code} title="Inline code" onClick={() => insertMarkdown('`', '`', 'code')} />
          <ToolbarButton
            icon={CodeBlock}
            title="Code block"
            onClick={() => insertMarkdown('```\n', '\n```', 'code', true)}
          />
          <ToolbarDivider />
          <ToolbarButton icon={Quote} title="Blockquote" onClick={() => insertMarkdown('> ', '', 'quote', true)} />
          <ToolbarButton icon={List} title="Bullet list" onClick={() => insertMarkdown('- ', '', 'item', true)} />
          <ToolbarButton
            icon={ListOrdered}
            title="Numbered list"
            onClick={() => insertMarkdown('1. ', '', 'item', true)}
          />
          <ToolbarButton icon={Minus} title="Horizontal rule" onClick={() => insertMarkdown('---', '', '', true)} />
          <ToolbarDivider />
          <ToolbarButton
            icon={Table}
            title="Table"
            onClick={() => insertMarkdown('| Column 1 | Column 2 |\n| --- | --- |\n| ', ' | cell |', 'cell', true)}
          />
          <ToolbarButton icon={MathIcon} title="Math" onClick={() => insertMarkdown('$', '$', 'E = mc^2')} />
        </div>
      )}

      {uploading && (
        <div className="px-4 lg:px-6 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-600 dark:text-blue-400">Uploading image...</p>
        </div>
      )}

      {error && (
        <div className="px-4 lg:px-6 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className={`flex-1 ${viewMode === 'split' ? 'flex' : ''}`}>
        {showEditor && (
          <textarea
            ref={textareaRef}
            value={markdown}
            onChange={(e) => {
              setMarkdown(e.target.value);
              setDirty(true);
            }}
            onPaste={handlePaste}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            placeholder="Write markdown..."
            className={`${viewMode === 'split' ? 'w-1/2 border-r border-gray-200 dark:border-gray-700' : 'w-full'} h-full min-h-[60vh] p-6 bg-white dark:bg-gray-950 text-gray-900 dark:text-white font-mono text-sm focus:outline-none resize-none`}
          />
        )}
        {showPreview && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} overflow-y-auto`}>
            <div className="max-w-3xl mx-auto px-6 py-8">
              <article className="prose prose-gray dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex, rehypeHighlight]}>
                  {markdown}
                </ReactMarkdown>
              </article>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
