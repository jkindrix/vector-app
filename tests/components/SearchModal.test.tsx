// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SearchModal } from '../../components/SearchModal';

afterEach(cleanup);

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('lucide-react', () => ({
  Search: (props: any) => <span data-testid="search-icon" {...props} />,
}));

describe('SearchModal', () => {
  it('does not render when closed', () => {
    render(<SearchModal open={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders dialog when open', () => {
    render(<SearchModal open={true} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders search input', async () => {
    render(<SearchModal open={true} onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search documents...')).toBeInTheDocument();
    });
  });

  it('calls onClose when Escape is pressed', async () => {
    const onClose = vi.fn();
    render(<SearchModal open={true} onClose={onClose} />);
    const input = await screen.findByPlaceholderText('Search documents...');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<SearchModal open={true} onClose={onClose} />);
    const backdrop = container.querySelector('.fixed.inset-0.bg-black\\/40');
    if (backdrop) fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });
});
