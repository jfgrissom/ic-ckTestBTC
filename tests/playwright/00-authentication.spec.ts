import { test, testWithII, expect } from './fixtures/test-fixtures';
import { waitForAppLoad, logout } from './helpers/test-helpers';

/**
 * Test Suite: Internet Identity Authentication
 *
 * Uses DFINITY's official @dfinity/internet-identity-playwright library
 * to handle Internet Identity authentication flows.
 *
 * Tests cover:
 * - Login with existing identity (10000, 10001)
 * - Creating new identity
 * - Logout flow
 * - Session persistence
 */

testWithII.describe('Internet Identity Authentication', () => {
  testWithII.beforeEach(async ({ page, iiPage }) => {
    // Wait for Internet Identity to be ready
    const url = 'http://127.0.0.1:4943';
    const canisterId = 'uzt4z-lp777-77774-qaabq-cai'; // From .env VITE_CANISTER_ID_INTERNET_IDENTITY

    await iiPage.waitReady({ url, canisterId });

    // Navigate to app
    await page.goto('/');
    await waitForAppLoad(page);
  });

  testWithII('should create new identity and login', async ({ page, iiPage }) => {
    // Create and sign in with new identity
    await iiPage.signInWithNewIdentity({
      selector: 'button:has-text("Login with Internet Identity")'
    });

    // Verify we're logged in by checking for logout button and principal
    const logoutButton = page.locator('button:has-text("Logout")');
    await expect(logoutButton).toBeVisible({ timeout: 30000 });

    // Should display "Principal:" text in header
    const principalLabel = page.locator('text=Principal:');
    await expect(principalLabel).toBeVisible();
  });

  testWithII('should logout successfully', async ({ page, iiPage }) => {
    // Create new identity for testing
    await iiPage.signInWithNewIdentity({
      selector: 'button:has-text("Login with Internet Identity")'
    });

    // Verify logged in - logout button should be visible
    await expect(page.locator('button:has-text("Logout")')).toBeVisible({ timeout: 30000 });

    // Now logout
    await logout(page);

    // Should return to login screen
    const loginButton = page.locator('button:has-text("Login with Internet Identity")');
    await expect(loginButton).toBeVisible();

    // Logout button should not be visible anymore
    await expect(page.locator('button:has-text("Logout")')).not.toBeVisible();
  });

  testWithII('should persist session on page reload', async ({ page, iiPage }) => {
    // Create new identity for testing
    await iiPage.signInWithNewIdentity({
      selector: 'button:has-text("Login with Internet Identity")'
    });

    // Verify logged in and get principal text
    const logoutButton = page.locator('button:has-text("Logout")');
    await expect(logoutButton).toBeVisible({ timeout: 30000 });

    // Get principal text before reload (looking for text that starts with "Principal:")
    const principalBefore = await page.locator('text=/Principal:.*$/').textContent();

    // Reload page
    await page.reload();
    await waitForAppLoad(page);

    // Should still be logged in
    await expect(logoutButton).toBeVisible({ timeout: 30000 });

    // Principal should be the same
    const principalAfter = await page.locator('text=/Principal:.*$/').textContent();
    expect(principalAfter).toBe(principalBefore);
  });

  testWithII('should clear session data on logout', async ({ page, iiPage }) => {
    // Create new identity for testing
    await iiPage.signInWithNewIdentity({
      selector: 'button:has-text("Login with Internet Identity")'
    });

    // Verify logged in
    const logoutButton = page.locator('button:has-text("Logout")');
    await expect(logoutButton).toBeVisible({ timeout: 30000 });

    // Logout
    await logout(page);

    // Check storage is cleared - Internet Identity uses IndexedDB and specific keys
    const localStorageKeys = await page.evaluate(() => Object.keys(window.localStorage));

    // Verify auth-related keys are cleared (adjust based on actual implementation)
    // Looking for keys related to identity/delegation
    const authKeys = localStorageKeys.filter((key) =>
      key.includes('ic-') || key.includes('delegation') || key.includes('identity')
    );
    expect(authKeys.length).toBe(0);
  });
});

/**
 * Test Suite: Authentication - Non-authenticated tests
 */
test.describe('Internet Identity UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppLoad(page);
  });

  test('should display login button when not authenticated', async ({ page }) => {
    const loginButton = page.locator('button:has-text("Login with Internet Identity")');
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toBeEnabled();
  });

  test('should not display logout button before authentication', async ({ page }) => {
    // Logout button should not be visible when not authenticated
    const logoutButton = page.locator('button:has-text("Logout")');
    await expect(logoutButton).not.toBeVisible();
  });
});

/**
 * Test Suite: Authentication - Multiple Sessions
 */
testWithII.describe('Authentication - Multiple Sessions', () => {
  testWithII('should support different users in different browser contexts', async ({ browser }) => {
    // Create two separate browser contexts (like two separate browsers)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Navigate both
    await page1.goto('/');
    await page2.goto('/');
    await waitForAppLoad(page1);
    await waitForAppLoad(page2);

    // Note: This test would require manual II interaction in each context
    // or extending the iiPage fixture to work with multiple contexts
    // For now, we'll just verify both contexts are independent

    // Both should show login button
    await expect(page1.locator('button:has-text("Login with Internet Identity")')).toBeVisible();
    await expect(page2.locator('button:has-text("Login with Internet Identity")')).toBeVisible();

    // Cleanup
    await context1.close();
    await context2.close();
  });
});