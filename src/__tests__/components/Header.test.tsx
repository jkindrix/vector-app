import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Header } from '../../components/Header';
import { useAuthStore } from '../../store/authStore';

// Mock zustand store
jest.mock('../../store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Sun: () => <span data-testid="sun-icon" />,
  Moon: () => <span data-testid="moon-icon" />,
  Search: () => <span data-testid="search-icon" />,
}));

// Mock SearchModal to avoid rendering the full modal in Header tests
jest.mock('../../components/SearchModal', () => ({
  SearchModal: () => null,
}));

const mockUseAuthStore = useAuthStore as unknown as jest.Mock;

const renderHeader = () =>
  render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>
  );

describe('Header', () => {
  beforeEach(() => {
    mockUseAuthStore.mockReturnValue({ isAuthenticated: false });
    localStorage.clear();
  });

  it('renders the Vector brand link', () => {
    renderHeader();
    const brandLink = screen.getByRole('link', { name: 'Vector' });
    expect(brandLink).toBeInTheDocument();
    expect(brandLink).toHaveAttribute('href', '/');
  });

  it('renders the Search button', () => {
    renderHeader();
    const searchButton = screen.getByRole('button', { name: 'Search' });
    expect(searchButton).toBeInTheDocument();
  });

  it('shows Admin link when authenticated', () => {
    mockUseAuthStore.mockReturnValue({ isAuthenticated: true });
    renderHeader();
    expect(screen.getByRole('link', { name: 'Admin' })).toBeInTheDocument();
  });

  it('hides Admin link when not authenticated', () => {
    renderHeader();
    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument();
  });

  it('renders dark mode toggle button', () => {
    renderHeader();
    expect(screen.getByRole('button', { name: 'Toggle dark mode' })).toBeInTheDocument();
  });

  it('toggles dark mode on button click', async () => {
    renderHeader();
    const button = screen.getByRole('button', { name: 'Toggle dark mode' });
    // Initially light mode (Moon icon shown)
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument();

    await userEvent.click(button);
    expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
    expect(localStorage.getItem('theme')).toBe('dark');
  });
});
