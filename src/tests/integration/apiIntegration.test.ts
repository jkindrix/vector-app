import { test, expect } from '@playwright/test';

test.describe('API Integration Tests', () => {
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Login to get auth token
    const loginResponse = await request.post(`${API_BASE}/auth/login`, {
      data: {
        username: 'admin',
        password: 'admin123'
      }
    });
    
    if (loginResponse.ok()) {
      const loginData = await loginResponse.json();
      authToken = loginData.token;
    }
  });

  test('Health check endpoint works', async ({ request }) => {
    const response = await request.get(`${API_BASE}/health`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data.database).toBe('connected');
  });

  test('Public papers API works', async ({ request }) => {
    const response = await request.get(`${API_BASE}/papers`);
    expect(response.ok()).toBeTruthy();
    
    const papers = await response.json();
    expect(Array.isArray(papers)).toBeTruthy();
  });

  test('Paper search API works', async ({ request }) => {
    const response = await request.get(`${API_BASE}/papers/search?q=test`);
    expect(response.ok()).toBeTruthy();
    
    const results = await response.json();
    expect(Array.isArray(results)).toBeTruthy();
  });

  test('Search suggestions API works', async ({ request }) => {
    const response = await request.get(`${API_BASE}/papers/search/suggestions?q=test`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.suggestions).toBeDefined();
    expect(Array.isArray(data.suggestions)).toBeTruthy();
  });

  test('Admin can create paper via API', async ({ request }) => {
    if (!authToken) {
      test.skip();
      return;
    }

    const paperData = {
      title: 'API Integration Test Paper',
      authors: [{ name: 'API Test Author' }],
      content: 'This is a test paper created via API integration test.',
      abstract: 'API integration test paper abstract.',
      keywords: ['api', 'test', 'integration'],
      visibility: 'private'
    };

    const response = await request.post(`${API_BASE}/papers`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: paperData
    });

    expect(response.ok()).toBeTruthy();
    
    const createdPaper = await response.json();
    expect(createdPaper.title).toBe(paperData.title);
    expect(createdPaper.id).toBeDefined();

    // Clean up: delete the test paper
    await request.delete(`${API_BASE}/papers/${createdPaper.id}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
  });

  test('Admin can update paper via API', async ({ request }) => {
    if (!authToken) {
      test.skip();
      return;
    }

    // First create a paper
    const createResponse = await request.post(`${API_BASE}/papers`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        title: 'Paper to Update',
        content: 'Original content',
        visibility: 'private'
      }
    });

    const paper = await createResponse.json();

    // Update the paper
    const updateResponse = await request.put(`${API_BASE}/papers/${paper.id}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        title: 'Updated Paper Title',
        content: 'Updated content'
      }
    });

    expect(updateResponse.ok()).toBeTruthy();
    
    const updatedPaper = await updateResponse.json();
    expect(updatedPaper.title).toBe('Updated Paper Title');

    // Clean up
    await request.delete(`${API_BASE}/papers/${paper.id}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
  });

  test('Unauthenticated requests to protected endpoints return 401', async ({ request }) => {
    // Try to create paper without authentication
    const response = await request.post(`${API_BASE}/papers`, {
      data: {
        title: 'Unauthorized Paper',
        content: 'This should fail'
      }
    });

    expect(response.status()).toBe(401);
  });

  test('Invalid auth token returns 403', async ({ request }) => {
    const response = await request.post(`${API_BASE}/papers`, {
      headers: {
        'Authorization': 'Bearer invalid-token',
        'Content-Type': 'application/json'
      },
      data: {
        title: 'Invalid Token Paper',
        content: 'This should fail'
      }
    });

    expect(response.status()).toBe(403);
  });

  test('API returns proper error responses', async ({ request }) => {
    if (!authToken) {
      test.skip();
      return;
    }

    // Try to create paper with missing required fields
    const response = await request.post(`${API_BASE}/papers`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        // Missing title and content
        keywords: ['test']
      }
    });

    expect(response.status()).toBe(400);
    
    const errorData = await response.json();
    expect(errorData.error).toBeDefined();
  });

  test('Individual paper retrieval works', async ({ request }) => {
    // Get list of papers first
    const listResponse = await request.get(`${API_BASE}/papers`);
    const papers = await listResponse.json();

    if (papers.length > 0) {
      // Get first paper by ID
      const paperId = papers[0].id;
      const paperResponse = await request.get(`${API_BASE}/papers/${paperId}`);
      
      expect(paperResponse.ok()).toBeTruthy();
      
      const paper = await paperResponse.json();
      expect(paper.id).toBe(paperId);
      expect(paper.title).toBeDefined();
    }
  });
});