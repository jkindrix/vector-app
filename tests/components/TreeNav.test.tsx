// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { TreeNav } from '../../components/TreeNav';
import type { TreeNode } from '../../lib/content';

afterEach(cleanup);

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('TreeNav', () => {
  it('renders a file node as a link', () => {
    const node: TreeNode = { name: 'intro', displayName: 'Introduction', path: 'docs/intro', type: 'file' };
    render(<TreeNav node={node} currentPath="docs/other" />);
    const link = screen.getByText('Introduction');
    expect(link.closest('a')).toHaveAttribute('href', '/docs/intro');
  });

  it('highlights the active file node', () => {
    const node: TreeNode = { name: 'intro', displayName: 'Introduction', path: 'docs/intro', type: 'file' };
    render(<TreeNav node={node} currentPath="docs/intro" />);
    const link = screen.getByText('Introduction').closest('a');
    expect(link?.className).toContain('font-medium');
  });

  it('renders a directory with children', () => {
    const node: TreeNode = {
      name: 'docs',
      displayName: 'Docs',
      path: 'docs',
      type: 'directory',
      children: [
        { name: 'a', displayName: 'Page A', path: 'docs/a', type: 'file' },
        { name: 'b', displayName: 'Page B', path: 'docs/b', type: 'file' },
      ],
    };
    render(<TreeNav node={node} currentPath="" />);
    expect(screen.getByText('Docs')).toBeInTheDocument();
    expect(screen.getByText('Page A')).toBeInTheDocument();
    expect(screen.getByText('Page B')).toBeInTheDocument();
  });
});
