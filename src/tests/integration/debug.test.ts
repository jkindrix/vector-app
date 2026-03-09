import { test, expect, Page } from '@playwright/test';

test('Debug homepage loading', async ({ page }) => {
  console.log('Navigating to homepage...');
  await page.goto('http://localhost:3002');
  
  // Wait for the page to fully load
  await page.waitForLoadState('networkidle');
  
  // Wait a bit more for React to hydrate
  await page.waitForTimeout(2000);
  
  // Take a screenshot to see what's rendered
  await page.screenshot({ path: 'debug-homepage.png', fullPage: true });
  
  // Log the page content
  const content = await page.content();
  console.log('Page title:', await page.title());
  console.log('Page content length:', content.length);
  
  // Check what's inside the React root
  const rootContent = await page.evaluate(() => {
    const root = document.getElementById('root');
    return root ? root.innerHTML : 'No root element';
  });
  console.log('React root content preview:', rootContent.substring(0, 500));
  
  // Check for specific text that should be on homepage
  const hasVectorText = await page.evaluate(() => {
    return document.body.textContent?.includes('Vector Research Papers');
  });
  console.log('Has "Vector Research Papers" text:', hasVectorText);
  
  // Check for loading states
  const hasLoadingSpinner = await page.$('.animate-pulse, .animate-spin');
  console.log('Has loading spinner:', !!hasLoadingSpinner);
  
  // Check console errors
  const logs: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      logs.push(msg.text());
    }
  });
  
  await page.waitForTimeout(1000);
  console.log('Console errors:', logs);
  
  // Check if our test ID exists
  const homePageExists = await page.$('[data-testid="home-page"]');
  console.log('Home page test ID exists:', !!homePageExists);
  
  // List all elements with data-testid
  const testIds = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('[data-testid]')).map(el => 
      el.getAttribute('data-testid')
    );
  });
  console.log('All test IDs found:', testIds);
});