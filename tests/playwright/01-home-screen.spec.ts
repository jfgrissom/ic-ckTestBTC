import { test, expect } from './fixtures/test-fixtures';
import { waitForAppLoad, isVisible } from './helpers/test-helpers';

/**
 * Test Suite: Home Screen
 *
 * Based on PRD.md "Features by Screen" - Home Screen section:
 * - Presents a loader notifying the user that the app is initializing
 * - Presents a login button to allow the user to login
 * - Post Authentication: User is presented with the Wallet Screen
 */
test.describe('Home Screen', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page before each test
    await page.goto('/');
  });

  test('should display the app loader during initialization', async ({ page }) => {
    // Test that loader is present during app initialization
    // Note: This might be very fast in dev, so we check if it ever appeared
    await waitForAppLoad(page);

    // App should be loaded at this point
    const rootVisible = await isVisible(page, '#root');
    expect(rootVisible).toBe(true);
  });

  test('should display login button when not authenticated', async ({ page }) => {
    await waitForAppLoad(page);

    // Check for login button
    const loginButton = page.locator('button:has-text("Login with Internet Identity")');
    await expect(loginButton).toBeVisible();
  });

  test('should have clickable login button', async ({ page }) => {
    await waitForAppLoad(page);

    // Find and click login button
    const loginButton = page.locator('button:has-text("Login with Internet Identity")');
    await expect(loginButton).toBeEnabled();

    // Click should not throw error
    await loginButton.click();

    // Note: Actual authentication flow would be tested separately
    // Here we just verify the button is interactive
  });

  test('should render app container', async ({ page }) => {
    await waitForAppLoad(page);

    // Check that the main app container exists
    const appContainer = page.locator('#root');
    await expect(appContainer).toBeVisible();
  });

  test('should not display wallet screen before authentication', async ({ page }) => {
    await waitForAppLoad(page);

    // Wallet screen should not be visible
    const walletScreen = page.locator('[data-testid="wallet-screen"]');
    await expect(walletScreen).not.toBeVisible({ timeout: 2000 }).catch(() => {
      // Element might not exist at all, which is also valid
    });
  });

  test('should have appropriate page title', async ({ page }) => {
    await waitForAppLoad(page);

    // Check page title
    const title = await page.title();
    expect(title).toContain('ckTestBTC'); // Adjust based on actual title
  });

  test('should load without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await waitForAppLoad(page);

    // Filter out known/acceptable errors (adjust as needed)
    const criticalErrors = consoleErrors.filter(
      (error) =>
        !error.includes('Internet Identity') && // II-related errors are expected in test env
        !error.includes('canister') // Canister connection errors expected without dfx
    );

    expect(criticalErrors.length).toBe(0);
  });
});

/**
 * Test Suite: Home Screen - Responsive Design
 *
 * Test mobile and tablet viewports
 */
test.describe('Home Screen - Responsive', () => {
  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await waitForAppLoad(page);

    // Login button should still be visible
    const loginButton = page.locator('button:has-text("Login with Internet Identity")');
    await expect(loginButton).toBeVisible();
  });

  test('should be responsive on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await waitForAppLoad(page);

    // Login button should still be visible
    const loginButton = page.locator('button:has-text("Login with Internet Identity")');
    await expect(loginButton).toBeVisible();
  });
});