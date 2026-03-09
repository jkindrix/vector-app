import { test, expect, Browser, Page } from '@playwright/test';
import { IntegrationTestHelper, createTestPaper } from './utils/testHelpers';

test.describe('Public User Workflows', () => {
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
    await page.close();
  });

  test('Public user can browse homepage and view papers', async () => {
    // Navigate to homepage
    await helper.navigateToHome();
    await helper.takeScreenshot('homepage');

    // Verify homepage elements
    await helper.verifyElementExists('[data-testid="home-page"]');
    await helper.verifyTextContent('h1', 'Vector Research Papers');

    // Check if papers list is visible (may be empty)
    const papersExist = await page.$('[data-testid="paper-list"]');
    if (papersExist) {
      // If papers exist, try to click on one
      const firstPaper = await page.$('[data-testid="paper-card"]:first-of-type a');
      if (firstPaper) {
        await firstPaper.click();
        
        // Should navigate to paper display
        await page.waitForURL('/papers/*', { timeout: 5000 });
        await helper.verifyElementExists('[data-testid="paper-display"]');
      }
    }
  });

  test('Public user can search for papers', async () => {
    // Navigate to search page
    await helper.navigateToSearch();
    await helper.takeScreenshot('search-page');

    // Verify search page elements
    await helper.verifyElementExists('[data-testid="search-page"]');
    await helper.verifyElementExists('input[placeholder*="Search papers"]');

    // Perform a search (may return no results if no papers exist)
    await helper.searchPapers('test');
    
    // Verify search results area is displayed
    await helper.verifyElementExists('[data-testid="search-results"], .no-results');
  });

  test('Public user can use search filters', async () => {
    await helper.navigateToSearch();

    // Open filters
    const filterButton = await page.$('button[title="Toggle filters"]');
    if (filterButton) {
      await filterButton.click();
      await helper.verifyElementExists('[data-testid="search-filters"]');

      // Test filter options
      const sortSelect = await page.$('select');
      if (sortSelect) {
        await sortSelect.selectOption('date');
        // Verify filter application doesn't cause errors
        await helper.waitForNetworkIdle();
      }
    }
  });

  test('Public user can navigate using the sidebar', async () => {
    await helper.navigateToHome();

    // Test navigation links
    const homeLink = await page.$('nav a[href="/"]');
    const searchLink = await page.$('nav a[href="/search"]');

    if (homeLink && searchLink) {
      // Click search link
      await searchLink.click();
      await helper.verifyURL('/search');

      // Click home link
      await homeLink.click();
      await helper.verifyURL('/');
    }
  });

  test('Public user sees proper error handling for non-existent papers', async () => {
    // Try to access a non-existent paper
    await page.goto('/papers/non-existent-paper-id');
    
    // Should show error page or 404
    await helper.verifyElementExists('[data-testid="error-display"], [data-testid="not-found"]');
  });

  test('Public user can access admin login page', async () => {
    await page.goto('/admin/login');
    
    // Verify login page elements
    await helper.verifyElementExists('input[name="username"]');
    await helper.verifyElementExists('input[name="password"]');
    await helper.verifyElementExists('button[type="submit"]');
    await helper.verifyTextContent('h2', 'Admin Login');
  });

  test('Navigation works correctly on mobile viewport', async () => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await helper.navigateToHome();
    await helper.takeScreenshot('mobile-homepage');

    // Check for mobile menu button
    const mobileMenuButton = await page.$('button[aria-label="Open menu"]');
    if (mobileMenuButton) {
      await mobileMenuButton.click();
      await helper.verifyElementExists('nav'); // Sidebar should be visible
      await helper.takeScreenshot('mobile-menu-open');
    }
  });
});