// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { Header } from '../../components/Header';

afterEach(cleanup);

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock lucide-react icons as simple spans
vi.mock('lucide-react', () => ({
  Sun: (props: any) => <span data-testid="sun-icon" {...props} />,
  Moon: (props: any) => <span data-testid="moon-icon" {...props} />,
  Search: (props: any) => <span data-testid="search-icon" {...props} />,
}));

describe('Header', () => {
  it('renders the site title as a link to home', () => {
    render(<Header />);
    const link = screen.getByText('Vector');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/');
  });

  it('renders search button with aria-label', () => {
    render(<Header />);
    expect(screen.getByLabelText('Search')).toBeInTheDocument();
  });

  it('renders theme toggle button with aria-label', () => {
    render(<Header />);
    expect(screen.getByLabelText(/Switch to .* mode/)).toBeInTheDocument();
  });

  it('toggles dark class on html element when theme button is clicked', () => {
    render(<Header />);
    const toggle = screen.getByLabelText(/Switch to .* mode/);
    const hadDark = document.documentElement.classList.contains('dark');
    fireEvent.click(toggle);
    const hasDark = document.documentElement.classList.contains('dark');
    expect(hasDark).not.toBe(hadDark);
  });

  it('opens search modal when search button is clicked', () => {
    render(<Header />);
    fireEvent.click(screen.getByLabelText('Search'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
