import { Page, Browser, BrowserContext } from '@playwright/test';

interface TestUser {
  username: string;
  password: string;
  email?: string;
}

export class IntegrationTestHelper {
  private page: Page;
  private browser: Browser;
  private context: BrowserContext;

  constructor(page: Page, browser: Browser, context: BrowserContext) {
    this.page = page;
    this.browser = browser;
    this.context = context;
  }

  // Authentication helpers
  async loginAsAdmin(user: TestUser = { username: 'admin', password: 'admin123' }) {
    await this.page.goto('/admin/login');
    await this.page.fill('input[name="username"]', user.username);
    await this.page.fill('input[name="password"]', user.password);
    await this.page.click('button[type="submit"]');
    
    // Wait for redirect to admin dashboard
    await this.page.waitForURL('/admin/dashboard', { timeout: 10000 });
    
    // Verify admin is logged in
    await this.page.waitForSelector('[data-testid="admin-dashboard"]', { timeout: 5000 });
  }

  async logout() {
    // Click logout button if visible
    const logoutButton = await this.page.$('button:has-text("Logout")');
    if (logoutButton) {
      await logoutButton.click();
      await this.page.waitForURL('/', { timeout: 5000 });
    }
  }

  // Navigation helpers
  async navigateToHome() {
    await this.page.goto('/');
    await this.page.waitForSelector('[data-testid="home-page"]', { timeout: 5000 });
  }

  async navigateToSearch() {
    await this.page.goto('/search');
    await this.page.waitForSelector('[data-testid="search-page"]', { timeout: 5000 });
  }

  async navigateToAdminDashboard() {
    await this.page.goto('/admin/dashboard');
    await this.page.waitForSelector('[data-testid="admin-dashboard"]', { timeout: 5000 });
  }

  // Paper management helpers
  async createPaper(paperData: {
    title: string;
    authors: string;
    keywords: string;
    abstract: string;
    content: string;
  }) {
    await this.navigateToAdminDashboard();
    await this.page.click('a[href="/admin/papers/new"]');
    await this.page.waitForSelector('[data-testid="paper-editor"]', { timeout: 5000 });

    // Fill in metadata
    await this.page.fill('input[placeholder="Paper Title"]', paperData.title);
    await this.page.fill('input[placeholder="Authors (comma-separated)"]', paperData.authors);
    await this.page.fill('input[placeholder="Keywords (comma-separated)"]', paperData.keywords);
    await this.page.fill('textarea[placeholder="Abstract"]', paperData.abstract);

    // Fill in content
    await this.page.fill('textarea', paperData.content);

    // Save as draft first
    await this.page.click('button:has-text("Save Draft")');
    await this.page.waitForSelector('.toast-success, [data-testid="save-success"]', { timeout: 5000 });
  }

  async publishPaper(visibility: 'public' | 'unlisted' | 'private' = 'public') {
    await this.page.click('button:has-text("Publish")');
    await this.page.waitForSelector('[data-testid="publish-modal"]', { timeout: 5000 });

    // Select visibility
    await this.page.click(`input[value="${visibility}"]`);
    
    // Publish
    await this.page.click('button:has-text("Publish"):last-of-type');
    await this.page.waitForURL('/admin/papers', { timeout: 10000 });
  }

  async searchPapers(query: string) {
    await this.navigateToSearch();
    await this.page.fill('input[placeholder*="Search papers"]', query);
    await this.page.press('input[placeholder*="Search papers"]', 'Enter');
    
    // Wait for search results
    await this.page.waitForSelector('[data-testid="search-results"], .no-results', { timeout: 10000 });
  }

  // Verification helpers
  async verifyElementExists(selector: string, timeout: number = 5000) {
    await this.page.waitForSelector(selector, { timeout });
    return true;
  }

  async verifyTextContent(selector: string, expectedText: string) {
    const element = await this.page.waitForSelector(selector, { timeout: 5000 });
    const content = await element.textContent();
    if (!content || !content.includes(expectedText)) {
      throw new Error(`Expected text "${expectedText}" not found in element with selector "${selector}". Found: "${content}"`);
    }
    return true;
  }

  async verifyURL(expectedURL: string, timeout: number = 5000) {
    await this.page.waitForURL(expectedURL, { timeout });
    return true;
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `src/tests/integration/screenshots/${name}.png`,
      fullPage: true 
    });
  }

  // Performance helpers
  async measurePageLoadTime(url: string) {
    const startTime = Date.now();
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    const endTime = Date.now();
    return endTime - startTime;
  }

  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  // Error checking
  async checkForConsoleErrors() {
    const errors: string[] = [];
    
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    return errors;
  }

  async checkForNetworkErrors() {
    const networkErrors: string[] = [];
    
    this.page.on('requestfailed', (request) => {
      networkErrors.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    });

    return networkErrors;
  }
}

// Test data factories
export const createTestPaper = (overrides: Partial<any> = {}) => ({
  title: 'Integration Test Paper',
  authors: 'Test Author, Second Author',
  keywords: 'integration, testing, automated',
  abstract: 'This is a test paper created during integration testing to verify the complete workflow.',
  content: `# Integration Test Paper

## Abstract
This is a test paper created during integration testing to verify the complete workflow.

## Introduction
This paper tests the complete integration between frontend and backend systems.

## Methods
1. Create paper via admin interface
2. Publish paper
3. Verify visibility to public users
4. Test search functionality

## Results
All integration tests should pass successfully.

## Conclusion
The system integration is working correctly.`,
  ...overrides
});

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));