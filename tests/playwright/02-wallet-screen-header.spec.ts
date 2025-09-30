import { test, expect } from './fixtures/test-fixtures';
import { waitForAppLoad, mockLogin, getTextContent } from './helpers/test-helpers';

/**
 * Test Suite: Wallet Screen - Header
 *
 * Based on PRD.md "Features by Screen" - Wallet Screen Header section:
 * - There is a logout button
 * - The user's Principal string is shown (and is truncated for space)
 */
test.describe('Wallet Screen - Header', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate and attempt login before each test
    await page.goto('/');
    await waitForAppLoad(page);

    // TODO: Replace with actual login flow when implemented
    // await mockLogin(page, context);
  });

  test.skip('should display logout button after authentication', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    const logoutButton = page.locator('button:has-text("Logout")');
    await expect(logoutButton).toBeVisible();
  });

  test.skip('should display user principal in header', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    // Look for principal display element
    const principalDisplay = page.locator('[data-testid="user-principal"]');
    await expect(principalDisplay).toBeVisible();
  });

  test.skip('should truncate long principal strings', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    const principalDisplay = page.locator('[data-testid="user-principal"]');
    const principalText = await getTextContent(page, '[data-testid="user-principal"]');

    // Principal should be truncated (typically showing first and last few characters)
    // Example format: "rdmx6-...aaadq-cai" or similar
    expect(principalText).toMatch(/^[a-z0-9]{5}-.*\.\.\..+-[a-z]{3}$/i);
  });

  test.skip('should show full principal on hover/click', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    const principalDisplay = page.locator('[data-testid="user-principal"]');

    // Get truncated text
    const truncatedText = await principalDisplay.textContent();

    // Hover or click to reveal full principal
    await principalDisplay.hover();

    // Check if tooltip or expanded view appears
    const fullPrincipal = page.locator('[data-testid="principal-tooltip"], [data-testid="principal-full"]');
    await expect(fullPrincipal).toBeVisible();

    const fullText = await fullPrincipal.textContent();
    expect(fullText?.length).toBeGreaterThan(truncatedText?.length || 0);
  });

  test.skip('should successfully logout when logout button clicked', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    const logoutButton = page.locator('button:has-text("Logout")');
    await logoutButton.click();

    // Should return to login screen
    await page.waitForSelector('button:has-text("Login")', { timeout: 5000 });
    const loginButton = page.locator('button:has-text("Login")');
    await expect(loginButton).toBeVisible();
  });

  test.skip('should clear user session data on logout', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    const logoutButton = page.locator('button:has-text("Logout")');
    await logoutButton.click();

    // Wait for logout to complete
    await page.waitForSelector('button:has-text("Login")');

    // Verify that wallet data is cleared
    // This might need to check localStorage, sessionStorage, or app state
    const localStorage = await page.evaluate(() => Object.keys(window.localStorage));
    const sessionStorage = await page.evaluate(() => Object.keys(window.sessionStorage));

    // Adjust these assertions based on your actual storage keys
    expect(localStorage.filter((key) => key.includes('principal')).length).toBe(0);
    expect(sessionStorage.filter((key) => key.includes('principal')).length).toBe(0);
  });

  test.skip('should maintain header layout on mobile', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify header elements are still visible and properly laid out
    const logoutButton = page.locator('button:has-text("Logout")');
    const principalDisplay = page.locator('[data-testid="user-principal"]');

    await expect(logoutButton).toBeVisible();
    await expect(principalDisplay).toBeVisible();

    // Verify elements don't overlap
    const logoutBox = await logoutButton.boundingBox();
    const principalBox = await principalDisplay.boundingBox();

    expect(logoutBox).not.toBeNull();
    expect(principalBox).not.toBeNull();

    // Elements should not overlap (adjust based on your layout)
    if (logoutBox && principalBox) {
      const overlap =
        logoutBox.x < principalBox.x + principalBox.width &&
        logoutBox.x + logoutBox.width > principalBox.x &&
        logoutBox.y < principalBox.y + principalBox.height &&
        logoutBox.y + logoutBox.height > principalBox.y;

      expect(overlap).toBe(false);
    }
  });

  test.skip('should copy principal to clipboard when copy button clicked', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    const copyButton = page.locator('[data-testid="copy-principal-button"]');
    await copyButton.click();

    // Verify clipboard content (requires clipboard permissions in test)
    // Note: This might not work in all test environments
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toMatch(/^[a-z0-9]+-[a-z0-9]+-[a-z0-9]+-[a-z0-9]+-[a-z]{3}$/i);
  });
});

/**
 * Test Suite: Wallet Screen - Header Visual Tests
 *
 * Tests for visual consistency and styling
 */
test.describe('Wallet Screen - Header Visual', () => {
  test.skip('should have consistent header styling', async ({ page, context }) => {
    // This test is skipped until authentication is properly implemented
    await page.goto('/');
    await waitForAppLoad(page);
    // await mockLogin(page, context);

    // Take screenshot for visual regression testing
    await expect(page.locator('header, [data-testid="wallet-header"]')).toHaveScreenshot('wallet-header.png');
  });
});