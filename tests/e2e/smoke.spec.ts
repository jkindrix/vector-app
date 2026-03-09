import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('renders heading and description', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('Vector');
    await expect(page.locator('text=Explore collections of research')).toBeVisible();
  });

  test('header has search button and theme toggle', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByLabel('Search')).toBeVisible();
    await expect(page.getByLabel(/Switch to .* mode/)).toBeVisible();
  });

  test('header links to home', async ({ page }) => {
    await page.goto('/search');
    await page.click('a:has-text("Vector")');
    await expect(page).toHaveURL('/');
  });
});

test.describe('Search', () => {
  test('search page loads', async ({ page }) => {
    await page.goto('/search');
    await expect(page.locator('input[type="search"], input[placeholder*="earch"]')).toBeVisible();
  });

  test('Cmd+K opens search modal', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Control+k');
    await expect(page.getByRole('dialog').or(page.locator('[role="combobox"]'))).toBeVisible();
  });
});

test.describe('Theme toggle', () => {
  test('toggles dark mode', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');

    await page.getByLabel(/Switch to .* mode/).click();
    // After toggle, class should change
    const hasDark = await html.evaluate((el) => el.classList.contains('dark'));
    // Toggle again
    await page.getByLabel(/Switch to .* mode/).click();
    const hasDarkAfter = await html.evaluate((el) => el.classList.contains('dark'));

    expect(hasDark).not.toBe(hasDarkAfter);
  });
});

test.describe('Admin login', () => {
  test('login page renders form', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.locator('h1')).toHaveText('Admin Login');
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toHaveText('Sign in');
  });

  test('admin routes redirect to login without auth', async ({ page }) => {
    await page.goto('/admin/files');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/admin/login');
    await page.fill('input[type="text"]', 'wrong');
    await page.fill('input[type="password"]', 'wrong');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Invalid credentials').or(page.locator('text=Login failed'))).toBeVisible();
  });
});

test.describe('API health', () => {
  test('health endpoint returns ok', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
  });
});

test.describe('Security headers', () => {
  test('response includes CSP and security headers', async ({ request }) => {
    const response = await request.get('/');
    const headers = response.headers();
    expect(headers['content-security-policy']).toContain("default-src 'self'");
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });
});
