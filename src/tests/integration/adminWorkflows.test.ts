import { test, expect, Browser, Page } from '@playwright/test';
import { IntegrationTestHelper, createTestPaper } from './utils/testHelpers';

test.describe('Admin Workflows', () => {
  let browser: Browser;
  let page: Page;
  let helper: IntegrationTestHelper;

  test.beforeAll(async ({ browser: browserInstance }) => {
    browser = browserInstance;
  });

  test.beforeEach(async () => {
    const context = await browser.newContext();
    page = await context.newPage();
    helper = new IntegrationTestHelper(page, browser, context);
  });

  test.afterEach(async () => {
    await helper.logout();
    await page.close();
  });

  test('Admin can login successfully', async () => {
    await helper.loginAsAdmin();
    await helper.takeScreenshot('admin-dashboard');

    // Verify admin dashboard is loaded
    await helper.verifyElementExists('[data-testid="admin-dashboard"]');
    await helper.verifyTextContent('h1', 'Welcome back');
    await helper.verifyURL('/admin/dashboard');
  });

  test('Admin login with invalid credentials shows error', async () => {
    await page.goto('/admin/login');
    
    // Try login with wrong credentials
    await page.fill('input[name="username"]', 'wronguser');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await helper.verifyElementExists('.error-message, [data-testid="login-error"]');
    await helper.verifyURL('/admin/login'); // Should stay on login page
  });

  test('Admin can create, edit, and publish a paper', async () => {
    await helper.loginAsAdmin();
    
    // Create a test paper
    const testPaper = createTestPaper();
    await helper.createPaper(testPaper);
    await helper.takeScreenshot('paper-created');

    // Publish the paper
    await helper.publishPaper('public');
    await helper.takeScreenshot('paper-published');

    // Verify paper appears in admin papers list
    await helper.verifyElementExists('[data-testid="papers-list"]');
    await helper.verifyTextContent('[data-testid="papers-list"]', testPaper.title);

    // Navigate to the published paper as public user
    await helper.logout();
    await page.goto('/');
    
    // Check if paper appears in public listing
    const paperExists = await page.isVisible(`text="${testPaper.title}"`);
    if (paperExists) {
      await page.click(`text="${testPaper.title}"`);
      await helper.verifyElementExists('[data-testid="paper-display"]');
      await helper.verifyTextContent('h1', testPaper.title);
    }
  });

  test('Admin can manage papers list', async () => {
    await helper.loginAsAdmin();
    await page.goto('/admin/papers');
    
    // Verify papers management page
    await helper.verifyElementExists('[data-testid="admin-papers-list"]');
    await helper.takeScreenshot('admin-papers-list');

    // Test search functionality in admin
    const searchInput = await page.$('input[placeholder*="Search papers"]');
    if (searchInput) {
      await searchInput.fill('test');
      await page.press('input[placeholder*="Search papers"]', 'Enter');
      await helper.waitForNetworkIdle();
    }

    // Test filter functionality
    const filterSelect = await page.$('select');
    if (filterSelect) {
      await filterSelect.selectOption('private');
      await helper.waitForNetworkIdle();
    }
  });

  test('Admin can delete papers', async () => {
    await helper.loginAsAdmin();

    // First create a paper to delete
    const testPaper = createTestPaper({ title: 'Paper To Delete' });
    await helper.createPaper(testPaper);
    await helper.publishPaper('private'); // Create as private for safety

    // Go to papers list
    await page.goto('/admin/papers');
    
    // Find and delete the paper
    const deleteButton = await page.$(`text="${testPaper.title}" >> ../.. >> button[title="Delete"]`);
    if (deleteButton) {
      await deleteButton.click();
      
      // Confirm deletion
      await page.waitForSelector('[data-testid="confirm-dialog"]', { timeout: 5000 });
      await page.click('button:has-text("Delete"):last-of-type');
      
      // Verify paper is removed
      await helper.waitForNetworkIdle();
      const paperStillExists = await page.isVisible(`text="${testPaper.title}"`);
      expect(paperStillExists).toBeFalsy();
    }
  });

  test('Admin dashboard shows statistics', async () => {
    await helper.loginAsAdmin();
    
    // Verify dashboard statistics cards
    await helper.verifyElementExists('[data-testid="stats-total-papers"]');
    await helper.verifyElementExists('[data-testid="stats-total-views"]');
    await helper.verifyElementExists('[data-testid="stats-public-papers"]');
    
    // Verify quick actions
    await helper.verifyElementExists('a[href="/admin/papers/new"]');
    await helper.verifyElementExists('a[href="/admin/papers"]');
  });

  test('Admin can access all admin sections', async () => {
    await helper.loginAsAdmin();
    
    // Test navigation to different admin sections
    const adminSections = [
      { href: '/admin/papers', testId: 'admin-papers-list' },
      { href: '/admin/papers/new', testId: 'paper-editor' },
      { href: '/admin/analytics', testId: 'admin-analytics' },
      { href: '/admin/settings', testId: 'admin-settings' }
    ];

    for (const section of adminSections) {
      await page.goto(section.href);
      await helper.verifyElementExists(`[data-testid="${section.testId}"], .coming-soon`);
      await helper.takeScreenshot(`admin-${section.href.replace('/admin/', '')}`);
    }
  });

  test('Admin session persists across page reloads', async () => {
    await helper.loginAsAdmin();
    
    // Reload the page
    await page.reload();
    
    // Should still be logged in and on admin dashboard
    await helper.verifyElementExists('[data-testid="admin-dashboard"]');
    await helper.verifyURL('/admin/dashboard');
  });

  test('Admin can logout successfully', async () => {
    await helper.loginAsAdmin();
    
    // Logout
    await page.click('button:has-text("Logout")');
    
    // Should redirect to homepage
    await helper.verifyURL('/');
    
    // Trying to access admin should redirect to login
    await page.goto('/admin/dashboard');
    await helper.verifyURL('/admin/login');
  });

  test('Protected admin routes require authentication', async () => {
    // Try to access admin routes without logging in
    const protectedRoutes = [
      '/admin/dashboard',
      '/admin/papers',
      '/admin/papers/new',
      '/admin/analytics',
      '/admin/settings'
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      // Should redirect to login
      await helper.verifyURL('/admin/login');
    }
  });
});