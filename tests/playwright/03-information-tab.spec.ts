import { test, expect } from './fixtures/test-fixtures';
import { waitForAppLoad, navigateToTab } from './helpers/test-helpers';

/**
 * Test Suite: Wallet Screen - Information Tab
 *
 * Based on PRD.md, the Information Tab should display:
 * - ckTestBTC balance overview
 * - Account addresses (Bitcoin testnet, IC account, Principal)
 * - General wallet information
 */
test.describe('Wallet Screen - Information Tab', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate and login before each test
    await page.goto('/');
    await waitForAppLoad(page);

    // TODO: Replace with actual login flow when implemented
    // await mockLogin(page, context);
  });

  test.skip('should display Information tab', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    const infoTab = page.locator('[role="tab"]:has-text("Information")');
    await expect(infoTab).toBeVisible();
  });

  test.skip('should show ckTestBTC balance', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    await navigateToTab(page, 'Information');

    // Check for balance display
    const balanceDisplay = page.locator('[data-testid="ckTestBTC-balance"]');
    await expect(balanceDisplay).toBeVisible();

    // Balance should be a number (with proper decimal formatting)
    const balanceText = await balanceDisplay.textContent();
    expect(balanceText).toMatch(/[\d,]+\.?\d*/); // Matches numbers with optional decimals
  });

  test.skip('should display Bitcoin testnet address', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    await navigateToTab(page, 'Information');

    const btcAddress = page.locator('[data-testid="btc-testnet-address"]');
    await expect(btcAddress).toBeVisible();

    // Bitcoin testnet addresses start with 'tb1q' (bech32 format)
    const addressText = await btcAddress.textContent();
    expect(addressText).toMatch(/^tb1q[a-z0-9]+$/);
  });

  test.skip('should display IC account address', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    await navigateToTab(page, 'Information');

    const icAddress = page.locator('[data-testid="ic-account-address"]');
    await expect(icAddress).toBeVisible();

    // IC account addresses are 64-character hex strings
    const addressText = await icAddress.textContent();
    expect(addressText).toMatch(/^[a-f0-9]{64}$/i);
  });

  test.skip('should display Principal ID', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    await navigateToTab(page, 'Information');

    const principalId = page.locator('[data-testid="principal-id"]');
    await expect(principalId).toBeVisible();

    // Principal format: groups separated by hyphens
    const principalText = await principalId.textContent();
    expect(principalText).toMatch(/^[a-z0-9]+-[a-z0-9]+-[a-z0-9]+-[a-z0-9]+-[a-z]{3}$/i);
  });

  test.skip('should have copy buttons for each address', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    await navigateToTab(page, 'Information');

    // Check for copy buttons
    const copyButtons = page.locator('[data-testid*="copy-button"]');
    const count = await copyButtons.count();
    expect(count).toBeGreaterThanOrEqual(3); // At least 3 addresses
  });

  test.skip('should show QR codes for addresses', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    await navigateToTab(page, 'Information');

    // QR code elements should be present
    const qrCodes = page.locator('[data-testid*="qr-code"], canvas');
    const count = await qrCodes.count();
    expect(count).toBeGreaterThanOrEqual(3); // QR for each address type
  });

  test.skip('should copy address to clipboard when copy button clicked', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    await navigateToTab(page, 'Information');

    const copyButton = page.locator('[data-testid="copy-btc-address"]').first();
    await copyButton.click();

    // Should show success feedback
    await expect(page.locator('text=Copied')).toBeVisible({ timeout: 2000 });
  });

  test.skip('should refresh balance when refresh button clicked', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    await navigateToTab(page, 'Information');

    const refreshButton = page.locator('[data-testid="refresh-balance-button"]');
    const initialBalance = await page.locator('[data-testid="ckTestBTC-balance"]').textContent();

    await refreshButton.click();

    // Should show loading state
    await expect(page.locator('[data-testid="balance-loading"]')).toBeVisible({ timeout: 1000 });

    // Wait for refresh to complete
    await expect(page.locator('[data-testid="balance-loading"]')).not.toBeVisible({ timeout: 5000 });

    // Balance should be displayed (may or may not have changed)
    const updatedBalance = await page.locator('[data-testid="ckTestBTC-balance"]').textContent();
    expect(updatedBalance).toBeDefined();
  });

  test.skip('should display balance in correct denomination', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    await navigateToTab(page, 'Information');

    const balanceDisplay = page.locator('[data-testid="ckTestBTC-balance"]');
    const balanceText = await balanceDisplay.textContent();

    // ckTestBTC uses 8 decimals (like BTC)
    // Balance format should be: "X.XXXXXXXX ckTestBTC" or similar
    expect(balanceText).toMatch(/\d+\.\d{0,8}/);
  });
});

/**
 * Test Suite: Information Tab - Responsive Design
 */
test.describe('Information Tab - Responsive', () => {
  test.skip('should display properly on mobile', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await waitForAppLoad(page);
    // await mockLogin(page);
    await navigateToTab(page, 'Information');

    // All key elements should be visible
    await expect(page.locator('[data-testid="ckTestBTC-balance"]')).toBeVisible();
    await expect(page.locator('[data-testid="btc-testnet-address"]')).toBeVisible();
  });

  test.skip('should scroll if content overflows', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await waitForAppLoad(page);
    // await mockLogin(page);
    await navigateToTab(page, 'Information');

    // Check if tab content is scrollable
    const tabContent = page.locator('[data-testid="information-tab-content"]');
    const scrollHeight = await tabContent.evaluate((el) => el.scrollHeight);
    const clientHeight = await tabContent.evaluate((el) => el.clientHeight);

    // Content should be scrollable if it overflows
    if (scrollHeight > clientHeight) {
      await tabContent.evaluate((el) => el.scrollTo(0, el.scrollHeight));
      const scrollTop = await tabContent.evaluate((el) => el.scrollTop);
      expect(scrollTop).toBeGreaterThan(0);
    }
  });
});