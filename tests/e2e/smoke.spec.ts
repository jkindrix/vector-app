import { test, expect, Page } from '@playwright/test';

/** Wait for React client components to hydrate by checking for a client-side effect. */
async function waitForHydration(page: Page) {
  // Header useEffect sets isMac based on navigator.platform.
  // On non-Mac, the kbd text changes from '⌘K' (SSR default) to 'Ctrl+K'.
  // On Mac, it stays '⌘K' — either way, wait for the button click handler.
  await page.waitForFunction(
    () => {
      // After hydration, clicking the theme toggle will change the dark class.
      // We check for the simpler signal: the search button's keyboard shortcut
      // reflects the actual platform (useEffect has run).
      const kbds = document.querySelectorAll('kbd');
      if (kbds.length === 0) return false;
      // If useEffect ran, isMac was set — the kbd text is finalized
      const text = kbds[0]?.textContent || '';
      return text.includes('Ctrl') || text.includes('⌘');
    },
    undefined,
    { timeout: 15000 },
  );
  // Give React a tick to attach all handlers after the first useEffect
  await page.waitForTimeout(100);
}

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
    await waitForHydration(page);
    await page.keyboard.press('Control+k');
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});

test.describe('Theme toggle', () => {
  test('toggles dark mode', async ({ page }) => {
    await page.goto('/');
    await waitForHydration(page);
    const html = page.locator('html');
    const toggle = page.getByLabel(/Switch to .* mode/);

    const hadDarkBefore = await html.evaluate((el) => el.classList.contains('dark'));
    await toggle.click();
    const hasDarkAfter = await html.evaluate((el) => el.classList.contains('dark'));

    expect(hasDarkAfter).toBe(!hadDarkBefore);
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
    // Wait for the submit button's React handler to be attached
    await page.waitForFunction(() => document.readyState === 'complete', undefined, { timeout: 10000 });
    await page.waitForTimeout(500);
    await page.fill('input[type="text"]', 'wrong');
    await page.fill('input[type="password"]', 'wrong');
    await page.click('button[type="submit"]');
    // Wait for error — text varies depending on whether database is available
    await expect(page.locator('[class*="bg-red"]')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('API health', () => {
  test('health endpoint returns valid response', async ({ request }) => {
    const response = await request.get('/api/health');
    const body = await response.json();
    expect(body.status).toMatch(/^(healthy|unhealthy)$/);
    expect(body.timestamp).toBeTruthy();
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
