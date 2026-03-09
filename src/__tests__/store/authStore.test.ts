import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../services/api';

jest.mock('../../services/api', () => ({
  authApi: {
    login: jest.fn(),
    verifyToken: jest.fn(),
  },
}));

const mockLogin = authApi.login as jest.Mock;
const mockVerifyToken = authApi.verifyToken as jest.Mock;

describe('authStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    // Reset zustand store to initial state
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('has initial state with isAuthenticated = false', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it('login sets token and user on success', async () => {
    mockLogin.mockResolvedValue({
      token: 'abc123',
      user: { id: '1', username: 'admin' },
    });

    const result = await useAuthStore.getState().login('admin', 'password');

    expect(result).toBe(true);
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe('abc123');
    expect(state.user).toEqual({ id: '1', username: 'admin' });
    expect(localStorage.getItem('authToken')).toBe('abc123');
  });

  it('login clears state on failure', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));

    const result = await useAuthStore.getState().login('admin', 'wrong');

    expect(result).toBe(false);
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.error).toBe('Invalid credentials');
  });

  it('logout clears everything', () => {
    // Set up authenticated state
    useAuthStore.setState({
      user: { id: '1', username: 'admin' },
      token: 'abc123',
      isAuthenticated: true,
    });
    localStorage.setItem('authToken', 'abc123');

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('verifyToken validates stored token', async () => {
    useAuthStore.setState({ token: 'abc123' });
    mockVerifyToken.mockResolvedValue({
      valid: true,
      user: { id: '1', username: 'admin' },
    });

    const result = await useAuthStore.getState().verifyToken();

    expect(result).toBe(true);
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual({ id: '1', username: 'admin' });
  });

  it('verifyToken returns false when no token exists', async () => {
    const result = await useAuthStore.getState().verifyToken();

    expect(result).toBe(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('verifyToken clears state on invalid token', async () => {
    useAuthStore.setState({ token: 'expired', isAuthenticated: true });
    mockVerifyToken.mockRejectedValue(new Error('Token expired'));

    const result = await useAuthStore.getState().verifyToken();

    expect(result).toBe(false);
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
  });
});
