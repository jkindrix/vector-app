import { test, devices } from '@playwright/test';
import { IntegrationTestHelper } from './utils/testHelpers';

// Test key workflows across different browsers and devices
const testWorkflow = async (helper: IntegrationTestHelper) => {
  // Test homepage load
  await helper.navigateToHome();
  await helper.verifyElementExists('[data-testid="home-page"]');
  
  // Test search functionality
  await helper.navigateToSearch();
  await helper.searchPapers('test');
  await helper.verifyElementExists('[data-testid="search-results"], .no-results');
  
  // Test admin login
  await helper.loginAsAdmin();
  await helper.verifyElementExists('[data-testid="admin-dashboard"]');
  
  await helper.logout();
};

test.describe('Cross-Browser Testing', () => {
  test('Works in Chrome', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const helper = new IntegrationTestHelper(page, browser, context);
    
    await testWorkflow(helper);
    await page.close();
  });

  test('Works in Firefox', async ({ browser }) => {
    // This test runs in Firefox when configured in playwright.config.ts
    const context = await browser.newContext();
    const page = await context.newPage();
    const helper = new IntegrationTestHelper(page, browser, context);
    
    await testWorkflow(helper);
    await page.close();
  });

  test('Works in Safari', async ({ browser }) => {
    // This test runs in Safari when configured in playwright.config.ts
    const context = await browser.newContext();
    const page = await context.newPage();
    const helper = new IntegrationTestHelper(page, browser, context);
    
    await testWorkflow(helper);
    await page.close();
  });
});

test.describe('Mobile Device Testing', () => {
  test('Works on iPhone', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12']
    });
    const page = await context.newPage();
    const helper = new IntegrationTestHelper(page, browser, context);
    
    await testWorkflow(helper);
    await helper.takeScreenshot('iphone-workflow');
    await page.close();
  });

  test('Works on Android', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['Pixel 5']
    });
    const page = await context.newPage();
    const helper = new IntegrationTestHelper(page, browser, context);
    
    await testWorkflow(helper);
    await helper.takeScreenshot('android-workflow');
    await page.close();
  });

  test('Works on iPad', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPad Pro']
    });
    const page = await context.newPage();
    const helper = new IntegrationTestHelper(page, browser, context);
    
    await testWorkflow(helper);
    await helper.takeScreenshot('ipad-workflow');
    await page.close();
  });
});

test.describe('Performance Testing', () => {
  test('Homepage loads within performance budget', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const helper = new IntegrationTestHelper(page, browser, context);
    
    const loadTime = await helper.measurePageLoadTime('/');
    console.log(`Homepage load time: ${loadTime}ms`);
    
    // Performance budget: homepage should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    await page.close();
  });

  test('Admin dashboard loads within performance budget', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const helper = new IntegrationTestHelper(page, browser, context);
    
    await helper.loginAsAdmin();
    const loadTime = await helper.measurePageLoadTime('/admin/dashboard');
    console.log(`Admin dashboard load time: ${loadTime}ms`);
    
    // Performance budget: admin pages should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
    
    await page.close();
  });
});