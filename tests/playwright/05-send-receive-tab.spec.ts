import { test, expect } from './fixtures/test-fixtures';
import { waitForAppLoad, navigateToTab, fillFieldByLabel, clickButton, waitForBalanceUpdate } from './helpers/test-helpers';

/**
 * Test Suite: Wallet Screen - Send & Receive Tab
 *
 * Based on PRD.md, this tab should handle:
 * - Sending ckTestBTC via ICRC-1 transfers
 * - Receiving ckTestBTC (display addresses/QR codes)
 * - Input validation for transfers
 * - Transaction confirmation
 */
test.describe('Wallet Screen - Send Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppLoad(page);
    // TODO: await mockLogin(page, context);
  });

  test.skip('should display Send tab', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    const sendTab = page.locator('[role="tab"]:has-text("Send")');
    await expect(sendTab).toBeVisible();
  });

  test.skip('should show send form with required fields', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    await navigateToTab(page, 'Send');

    // Check for recipient field
    const recipientInput = page.locator('input[name="recipient"], [data-testid="recipient-input"]');
    await expect(recipientInput).toBeVisible();

    // Check for amount field
    const amountInput = page.locator('input[name="amount"], [data-testid="amount-input"]');
    await expect(amountInput).toBeVisible();

    // Check for send button
    const sendButton = page.locator('button:has-text("Send")');
    await expect(sendButton).toBeVisible();
  });

  test.skip('should have optional memo field', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    await navigateToTab(page, 'Send');

    const memoInput = page.locator('input[name="memo"], textarea[name="memo"], [data-testid="memo-input"]');
    await expect(memoInput).toBeVisible();
  });

  test.skip('should validate recipient address format', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    await navigateToTab(page, 'Send');

    // Enter invalid recipient
    await fillFieldByLabel(page, 'Recipient', 'invalid-address');
    await fillFieldByLabel(page, 'Amount', '1');
    await clickButton(page, 'Send');

    // Should show validation error
    await expect(page.locator('text=Invalid address, text=Invalid recipient')).toBeVisible({ timeout: 2000 });
  });

  test.skip('should validate amount is positive', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    await navigateToTab(page, 'Send');

    // Enter valid recipient but invalid amount
    await fillFieldByLabel(page, 'Recipient', 'rdmx6-jaaaa-aaaaa-aaadq-cai');
    await fillFieldByLabel(page, 'Amount', '-1');
    await clickButton(page, 'Send');

    // Should show validation error
    await expect(page.locator('text=Invalid amount, text=Amount must be positive')).toBeVisible({ timeout: 2000 });
  });

  test.skip('should check sufficient balance before sending', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    await navigateToTab(page, 'Send');

    // Get current balance
    const balanceText = await page.locator('[data-testid="ckTestBTC-balance"]').textContent();
    const balance = parseFloat(balanceText?.replace(/[^\d.]/g, '') || '0');

    // Try to send more than balance
    await fillFieldByLabel(page, 'Recipient', 'rdmx6-jaaaa-aaaaa-aaadq-cai');
    await fillFieldByLabel(page, 'Amount', String(balance + 1000));
    await clickButton(page, 'Send');

    // Should show insufficient balance error
    await expect(page.locator('text=Insufficient balance')).toBeVisible({ timeout: 2000 });
  });

  test.skip('should display transfer fee', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    await navigateToTab(page, 'Send');

    const feeDisplay = page.locator('[data-testid="transfer-fee"]');
    await expect(feeDisplay).toBeVisible();

    // Fee should be displayed
    const feeText = await feeDisplay.textContent();
    expect(feeText).toMatch(/\d+/);
  });

  test.skip('should show confirmation dialog before sending', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    await navigateToTab(page, 'Send');

    // Fill valid form
    await fillFieldByLabel(page, 'Recipient', 'rdmx6-jaaaa-aaaaa-aaadq-cai');
    await fillFieldByLabel(page, 'Amount', '0.001');
    await clickButton(page, 'Send');

    // Should show confirmation dialog
    const confirmDialog = page.locator('[role="dialog"], [data-testid="confirm-send"]');
    await expect(confirmDialog).toBeVisible({ timeout: 2000 });

    // Dialog should show transaction details
    await expect(confirmDialog.locator('text=rdmx6-jaaaa-aaaaa-aaadq-cai')).toBeVisible();
    await expect(confirmDialog.locator('text=0.001')).toBeVisible();
  });

  test.skip('should complete send transaction', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    await navigateToTab(page, 'Send');

    // Get initial balance
    const initialBalance = await page.locator('[data-testid="ckTestBTC-balance"]').textContent() || '';

    // Fill and submit form
    await fillFieldByLabel(page, 'Recipient', 'rdmx6-jaaaa-aaaaa-aaadq-cai');
    await fillFieldByLabel(page, 'Amount', '0.001');
    await clickButton(page, 'Send');

    // Confirm transaction
    await clickButton(page, 'Confirm');

    // Should show success message
    await expect(page.locator('text=Transaction sent, text=Transfer successful')).toBeVisible({ timeout: 10000 });

    // Balance should update
    const newBalance = await waitForBalanceUpdate(page, initialBalance, 15000);
    expect(newBalance).not.toBe(initialBalance);
  });

  test.skip('should clear form after successful send', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    await navigateToTab(page, 'Send');

    // Fill and submit form
    await fillFieldByLabel(page, 'Recipient', 'rdmx6-jaaaa-aaaaa-aaadq-cai');
    await fillFieldByLabel(page, 'Amount', '0.001');
    await clickButton(page, 'Send');
    await clickButton(page, 'Confirm');

    // Wait for transaction to complete
    await expect(page.locator('text=Transaction sent')).toBeVisible({ timeout: 10000 });

    // Form should be cleared
    const recipientInput = page.locator('[data-testid="recipient-input"]');
    const amountInput = page.locator('[data-testid="amount-input"]');

    expect(await recipientInput.inputValue()).toBe('');
    expect(await amountInput.inputValue()).toBe('');
  });

  test.skip('should support Principal ID format for recipient', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    await navigateToTab(page, 'Send');

    // Enter Principal ID
    await fillFieldByLabel(page, 'Recipient', 'rdmx6-jaaaa-aaaaa-aaadq-cai');
    await fillFieldByLabel(page, 'Amount', '0.001');

    // Should not show validation error for valid Principal
    const sendButton = page.locator('button:has-text("Send")');
    await expect(sendButton).toBeEnabled();
  });

  test.skip('should support IC account address format for recipient', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    await navigateToTab(page, 'Send');

    // Enter IC account address (64 hex chars)
    await fillFieldByLabel(page, 'Recipient', 'd4685b3167bd502b7b64b20e842c68f6b87a1a93fb42bef9e7c95d6d0eec2433');
    await fillFieldByLabel(page, 'Amount', '0.001');

    // Should not show validation error for valid account
    const sendButton = page.locator('button:has-text("Send")');
    await expect(sendButton).toBeEnabled();
  });
});

/**
 * Test Suite: Wallet Screen - Receive Tab
 */
test.describe('Wallet Screen - Receive Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppLoad(page);
    // TODO: await mockLogin(page, context);
  });

  test.skip('should display Receive tab', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    const receiveTab = page.locator('[role="tab"]:has-text("Receive")');
    await expect(receiveTab).toBeVisible();
  });

  test.skip('should show all three address types', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    await navigateToTab(page, 'Receive');

    // Bitcoin testnet address
    await expect(page.locator('[data-testid="receive-btc-address"]')).toBeVisible();

    // IC account address
    await expect(page.locator('[data-testid="receive-ic-address"]')).toBeVisible();

    // Principal ID
    await expect(page.locator('[data-testid="receive-principal"]')).toBeVisible();
  });

  test.skip('should display QR codes for each address', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    await navigateToTab(page, 'Receive');

    // Should have QR codes for all address types
    const qrCodes = page.locator('[data-testid*="qr-code"], canvas');
    const count = await qrCodes.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test.skip('should have copy buttons for each address', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    await navigateToTab(page, 'Receive');

    // Copy buttons should be present
    const copyButtons = page.locator('[data-testid*="copy-button"]');
    const count = await copyButtons.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test.skip('should copy address when copy button clicked', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    await navigateToTab(page, 'Receive');

    const copyButton = page.locator('[data-testid="copy-receive-btc-address"]').first();
    await copyButton.click();

    // Should show success feedback
    await expect(page.locator('text=Copied')).toBeVisible({ timeout: 2000 });
  });

  test.skip('should show address labels/descriptions', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    await navigateToTab(page, 'Receive');

    // Should explain what each address is for
    await expect(page.locator('text=Bitcoin Testnet, text=TestBTC')).toBeVisible();
    await expect(page.locator('text=ckTestBTC Account, text=ICRC-1')).toBeVisible();
    await expect(page.locator('text=Principal ID')).toBeVisible();
  });
});

/**
 * Test Suite: Send & Receive - Responsive Design
 */
test.describe('Send & Receive - Responsive', () => {
  test.skip('should display send form properly on mobile', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await waitForAppLoad(page);
    // await mockLogin(page, context);
    await navigateToTab(page, 'Send');

    // Form fields should be visible and usable
    await expect(page.locator('[data-testid="recipient-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="amount-input"]')).toBeVisible();
  });

  test.skip('should display receive addresses properly on mobile', async ({ page }) => {
    // This test is skipped until authentication is properly implemented
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await waitForAppLoad(page);
    // await mockLogin(page, context);
    await navigateToTab(page, 'Receive');

    // All addresses should be visible
    await expect(page.locator('[data-testid="receive-btc-address"]')).toBeVisible();
    await expect(page.locator('[data-testid="receive-ic-address"]')).toBeVisible();
  });
});