import { Page, expect } from '@playwright/test';

/**
 * Test Helper Functions for ckTestBTC Wallet
 *
 * These helpers provide reusable functions for common test operations
 * across all Playwright test suites.
 */

/**
 * Wait for the app to finish loading
 */
export async function waitForAppLoad(page: Page) {
  // Wait for the root app container to be visible
  await page.waitForSelector('#root', { state: 'visible' });

  // Wait for any loading spinners to disappear
  await page.waitForSelector('.loading-spinner', { state: 'hidden', timeout: 10000 }).catch(() => {
    // Loading spinner might not exist, that's okay
  });
}

/**
 * Logout helper for testing
 * Note: Login is now handled by @dfinity/internet-identity-playwright fixtures
 */
export async function logout(page: Page) {
  // Click logout button
  await page.click('button:has-text("Logout")');

  // Wait for login screen to appear
  await page.waitForSelector('button:has-text("Login with Internet Identity")', { timeout: 5000 });
}

/**
 * Navigate to a specific tab in the wallet
 */
export async function navigateToTab(page: Page, tabName: string) {
  const tabSelector = `[role="tab"]:has-text("${tabName}")`;
  await page.click(tabSelector);

  // Wait for tab content to be visible
  await page.waitForTimeout(500); // Allow for tab transition
}

/**
 * Get the text content of an element, with error handling
 */
export async function getTextContent(page: Page, selector: string): Promise<string> {
  const element = await page.locator(selector).first();
  return (await element.textContent()) || '';
}

/**
 * Check if an element is visible
 */
export async function isVisible(page: Page, selector: string): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { state: 'visible', timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Wait for balance to update (useful for testing transactions)
 */
export async function waitForBalanceUpdate(page: Page, oldBalance: string, timeout = 10000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const currentBalance = await getTextContent(page, '[data-testid="ckTestBTC-balance"]');
    if (currentBalance !== oldBalance) {
      return currentBalance;
    }
    await page.waitForTimeout(500);
  }

  throw new Error(`Balance did not update within ${timeout}ms`);
}

/**
 * Fill in a form field by label
 */
export async function fillFieldByLabel(page: Page, label: string, value: string) {
  const input = page.locator(`label:has-text("${label}") + input, label:has-text("${label}") input`);
  await input.fill(value);
}

/**
 * Click a button by text content
 */
export async function clickButton(page: Page, buttonText: string) {
  await page.click(`button:has-text("${buttonText}")`);
}

/**
 * Wait for a toast/notification message
 */
export async function waitForNotification(page: Page, message: string, timeout = 5000) {
  await page.waitForSelector(
    `[role="alert"]:has-text("${message}"), .toast:has-text("${message}")`,
    { timeout }
  );
}

/**
 * Take a screenshot with a descriptive name
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `tests/playwright/screenshots/${name}.png`, fullPage: true });
}