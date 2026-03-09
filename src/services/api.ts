import axios from 'axios';
import { TreeNode, CollectionSummary, Document, SearchResult } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Axios interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Only clear auth and redirect for admin routes
      if (window.location.pathname.startsWith('/admin')) {
        localStorage.removeItem('authToken');

        if (window.location.pathname !== '/admin/login') {
          window.location.href = '/admin/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const contentApi = {
  async getTree(): Promise<TreeNode> {
    const response = await api.get('/tree');
    return response.data;
  },

  async getCollections(): Promise<CollectionSummary[]> {
    const response = await api.get('/collections');
    return response.data;
  },

  async getContent(path: string): Promise<Document> {
    const response = await api.get(`/content/${path}`);
    return response.data;
  },

  async writeContent(path: string, markdown: string): Promise<void> {
    await api.put(`/content/${path}`, { markdown });
  },

  async search(query: string, limit: number = 20, offset: number = 0): Promise<{ results: SearchResult[]; total: number }> {
    const response = await api.get('/search', { params: { q: query, limit, offset } });
    return response.data;
  },

  async reindex(): Promise<void> {
    await api.post('/reindex');
  },
};

// Admin API methods
export const adminApi = {
  async changePassword(username: string, newPassword: string) {
    const response = await api.put(`/admin/users/${username}/password`, { newPassword });
    return response.data;
  },
};

// Add auth-specific API methods
export const authApi = {
  async login(username: string, password: string) {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },

  async verifyToken() {
    const response = await api.get('/auth/verify');
    return response.data;
  },

  async logout() {
    localStorage.removeItem('authToken');
    try {
      await api.post('/auth/logout');
    } catch {
      // Cookie cleanup is best-effort
    }
  }
};
