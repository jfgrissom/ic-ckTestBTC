# Playwright Integration Tests

This directory contains end-to-end integration tests for the ckTestBTC Wallet application using Playwright.

## Overview

The test suite covers all major features documented in `PRD.md`, organized by screen:

- **Home Screen** - Login flow and initialization
- **Wallet Header** - User principal display and logout
- **Information Tab** - Balance and address display
- **Deposit & Withdrawals** - Bitcoin testnet deposit/withdrawal flows
- **Send & Receive** - ICRC-1 token transfers
- **Transactions Tab** - Transaction history and details

### Browser Support

✅ **Fully Supported**: Chromium, Firefox
⚠️ **Limited Support**: WebKit/Safari (Internet Identity authentication has known issues)

Tests run on Chromium and Firefox by default. WebKit is disabled in `playwright.config.ts` due to compatibility issues with the `@dfinity/internet-identity-playwright` library.

## Test Structure

```
tests/playwright/
├── 00-authentication.spec.ts          # Internet Identity auth flows
├── 01-home-screen.spec.ts             # Home screen tests
├── 02-wallet-screen-header.spec.ts    # Wallet header tests
├── 03-information-tab.spec.ts         # Information tab tests
├── 04-deposit-withdrawals-tab.spec.ts # Deposit & withdrawal tests
├── 05-send-receive-tab.spec.ts        # Send & receive tests
├── 06-transactions-tab.spec.ts        # Transaction history tests
├── fixtures/
│   └── test-fixtures.ts               # Custom test fixtures
└── helpers/
    └── test-helpers.ts                # Reusable helper functions
```

## Prerequisites

Before running tests, ensure you have:

1. **Node.js** (v20 or later)
2. **dfx** (v0.29.1 or later)
3. **Rust toolchain** with wasm32 target
4. **Playwright browsers** (installed automatically)
5. **Local dfx replica running** with Internet Identity canister deployed

## Installation

```bash
# Install project dependencies (including Playwright)
npm install

# Install Playwright browsers
npx playwright install
```

## Running Tests

### Local Development Testing

**Step 1: Start local dfx replica and deploy canisters**

```bash
# Start dfx
dfx start --clean

# Deploy canisters (in separate terminal)
dfx deploy
```

**Step 2: Start frontend development server**

```bash
# Start Vite dev server
npm run dev
```

**Step 3: Run Playwright tests**

```bash
# Run all tests
npx playwright test

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run specific test file
npx playwright test 00-authentication.spec.ts

# Run tests in UI mode (interactive)
npx playwright test --ui

# Run tests in debug mode
npx playwright test --debug
```

### Running Against Production/Staging

To test against a deployed canister:

```bash
BASE_URL=https://your-canister-url.ic0.app npx playwright test
```

## Internet Identity Authentication

The tests use DFINITY's official `@dfinity/internet-identity-playwright` library for authentication.

### Automatic Identity Creation (Default)

Tests automatically create fresh Internet Identity anchors for each test:

```typescript
import { testWithII } from './fixtures/test-fixtures';

testWithII('test with new user', async ({ page, iiPage }) => {
  // Create and sign in with new identity (automatic)
  await iiPage.signInWithNewIdentity({
    selector: 'button:has-text("Login with Internet Identity")'
  });

  // User is now authenticated with a fresh anchor!
});
```

**Benefits**:
- No manual setup required
- Tests are independent (each gets a unique identity)
- No conflicts between test runs
- Works in CI/CD environments

### Custom Login Button Selector

**IMPORTANT**: The library expects a login button with `data-tid="login-button"` by default. Since our button uses different markup, we must provide a custom selector:

```typescript
selector: 'button:has-text("Login with Internet Identity")'
```

### How Authentication Works

1. Test calls `iiPage.signInWithIdentity()` with custom selector
2. Library finds and clicks the login button
3. Library handles the Internet Identity window/tab automatically
4. Library enters user ID and submits the form
5. Library waits for authentication to complete
6. Test continues with authenticated session

## Test Fixtures

### Using Base Test (Non-authenticated)

For tests that don't require authentication:

```typescript
import { test, expect } from './fixtures/test-fixtures';

test('should show login button', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('button:has-text("Login with Internet Identity")')).toBeVisible();
});
```

### Using testWithII (Authenticated Tests)

For tests that require authentication:

```typescript
import { testWithII, expect } from './fixtures/test-fixtures';

testWithII('should show wallet', async ({ page, iiPage }) => {
  // Create new identity for testing
  await iiPage.signInWithNewIdentity({
    selector: 'button:has-text("Login with Internet Identity")'
  });

  // Verify authenticated by checking for logout button
  await expect(page.locator('button:has-text("Logout")')).toBeVisible();
});
```

**Important**: Tests should verify authentication by checking for visible UI elements (like the logout button or principal text) rather than relying on `data-testid` attributes that may not exist.

## Helper Functions

### Authentication Helpers

```typescript
import { logout } from './helpers/test-helpers';

// Logout (login is handled by iiPage fixture)
await logout(page);
```

**Note**: Login is now handled by the `iiPage` fixture from `@dfinity/internet-identity-playwright`. See the [Internet Identity Authentication](#internet-identity-authentication) section above.

### Navigation Helpers

```typescript
import { navigateToTab } from './helpers/test-helpers';

// Navigate to specific tab
await navigateToTab(page, 'Information');
await navigateToTab(page, 'Send');
```

### Form Helpers

```typescript
import { fillFieldByLabel, clickButton } from './helpers/test-helpers';

// Fill form by label
await fillFieldByLabel(page, 'Amount', '0.001');

// Click button by text
await clickButton(page, 'Send');
```

### Utility Helpers

```typescript
import { getTextContent, isVisible, waitForBalanceUpdate } from './helpers/test-helpers';

// Get element text
const balance = await getTextContent(page, '[data-testid="balance"]');

// Check visibility
const visible = await isVisible(page, '[data-testid="wallet"]');

// Wait for balance change
await waitForBalanceUpdate(page, oldBalance);
```

## Debugging Tests

### Visual Debugging

```bash
# Run with headed browser (see what's happening)
npx playwright test --headed

# Run in debug mode with Playwright Inspector
npx playwright test --debug

# Run specific test in debug mode
npx playwright test 00-authentication.spec.ts --debug
```

### Screenshots and Videos

Playwright automatically captures:
- **Screenshots** on test failure
- **Videos** when tests fail
- **Traces** on first retry

Access these in:
- Screenshots: `test-results/`
- HTML Report: `playwright-report/`

### View Test Report

```bash
# Generate and open HTML report
npx playwright show-report
```

## Test Patterns

### Testing with Authentication

```typescript
testWithII('should show balance', async ({ page, iiPage }) => {
  await page.goto('/');
  await waitForAppLoad(page);

  // Create new test identity
  await iiPage.signInWithNewIdentity({
    selector: 'button:has-text("Login with Internet Identity")'
  });

  // Verify authenticated
  await expect(page.locator('button:has-text("Logout")')).toBeVisible();

  // Now test balance display
  const balance = page.locator('text=/0\\.\\d{8}.*ckTestBTC/');
  await expect(balance).toBeVisible();
});
```

### Testing Forms

```typescript
test('should send tokens', async ({ authenticatedPage }) => {
  await navigateToTab(authenticatedPage, 'Send');

  await fillFieldByLabel(authenticatedPage, 'Recipient', 'rdmx6-jaaaa-aaaaa-aaadq-cai');
  await fillFieldByLabel(authenticatedPage, 'Amount', '0.001');
  await clickButton(authenticatedPage, 'Send');

  await expect(authenticatedPage.locator('text=Success')).toBeVisible();
});
```

### Testing with New Tabs

```typescript
test('should handle Internet Identity tab', async ({ page, context }) => {
  const newTabPromise = context.waitForEvent('page');
  await page.click('button:has-text("Login")');

  const iiTab = await newTabPromise;
  await iiTab.waitForLoadState();

  // Interact with II tab
  await iiTab.fill('input', '10000');
  await iiTab.click('button:has-text("Continue")');

  await iiTab.waitForEvent('close');
});
```

## CI/CD Integration

Tests run automatically in GitHub Actions on:
- Push to `master`, `main`, or `develop` branches
- Pull requests to these branches
- Manual workflow dispatch

The workflow:
1. Sets up Node.js, dfx, and Rust
2. Deploys local canisters
3. Starts frontend dev server
4. Runs Playwright tests
5. Uploads test reports and screenshots

See `.github/workflows/playwright-tests.yml` for configuration.

## Test Status

### ✅ Completed Test Suites
- **00-authentication.spec.ts** - All 7 tests passing (14 total: 7 × 2 browsers)
  - Create new identity and login
  - Logout functionality
  - Session persistence on reload
  - Session cleanup on logout
  - UI state verification (login button, logout button visibility)
  - Multiple browser context support

### 🚧 Pending Test Suites

The following test files are created but have tests marked with `test.skip()` until the respective features are fully implemented:

- **01-home-screen.spec.ts** - Home screen and loading states
- **02-wallet-screen-header.spec.ts** - Wallet header and user display
- **03-information-tab.spec.ts** - Balance and address display
- **04-deposit-withdrawals-tab.spec.ts** - Deposit/withdrawal flows
- **05-send-receive-tab.spec.ts** - Token transfer operations
- **06-transactions-tab.spec.ts** - Transaction history

To enable skipped tests:

1. Remove `test.skip()` wrapper
2. Update to use `testWithII` fixture for authenticated tests
3. Replace `data-testid` selectors with actual visible element selectors
4. Use `signInWithNewIdentity()` for authentication

Example:

```typescript
// Before
test.skip('should show balance', async ({ page }) => {
  await navigateToTab(page, 'Information');
  const balance = page.locator('[data-testid="balance"]');
  await expect(balance).toBeVisible();
});

// After implementation
testWithII('should show balance', async ({ page, iiPage }) => {
  await page.goto('/');
  await waitForAppLoad(page);

  // Authenticate
  await iiPage.signInWithNewIdentity({
    selector: 'button:has-text("Login with Internet Identity")'
  });

  // Verify authentication
  await expect(page.locator('button:has-text("Logout")')).toBeVisible();

  // Navigate and test
  await navigateToTab(page, 'Information');
  const balance = page.locator('text=/\\d+\\.\\d{8}/'); // Use actual UI text
  await expect(balance).toBeVisible();
});
```

## Test Selectors

### Current Approach: Text-Based Selectors

The current tests use text-based selectors to find elements:

```typescript
// Button selection by text
await page.click('button:has-text("Login")');
await expect(page.locator('button:has-text("Logout")')).toBeVisible();

// Text content matching with regex
const balance = page.locator('text=/\\d+\\.\\d{8}/');
const principal = page.locator('text=/Principal:.*$/');
```

### Future: Data Test IDs (Recommended)

For more stable tests, consider adding `data-testid` attributes to UI components:

```tsx
// React component
<div data-testid="wallet-screen">...</div>
<button data-testid="logout-button">Logout</button>
<span data-testid="ckTestBTC-balance">1.00000000</span>

// Testing
await expect(page.locator('[data-testid="wallet-screen"]')).toBeVisible();
await page.click('[data-testid="logout-button"]');
```

**Benefits of data-testid:**
- More stable (not affected by text changes)
- Faster (direct attribute selection)
- Clearer intent (explicitly marked for testing)
- Better for internationalization (text may change by locale)

## Best Practices

1. **Use data-testid for stable selectors** - Don't rely on text or CSS classes
2. **Wait for elements properly** - Use Playwright's auto-waiting
3. **Test user flows, not implementation** - Focus on what users do
4. **Keep tests independent** - Each test should work in isolation
5. **Use fixtures for common setup** - Don't repeat authentication code
6. **Test error cases** - Don't just test happy paths
7. **Use descriptive test names** - Make failures easy to understand

## Troubleshooting

### Tests Timeout

- Increase timeout in `playwright.config.ts`
- Check if canisters are running (`dfx ping`)
- Ensure frontend dev server is accessible

### Authentication Fails

- Verify Internet Identity window/tab opens correctly
- Use `signInWithNewIdentity()` for local development (creates fresh identities)
- Check custom selector matches your login button: `selector: 'button:has-text("Login with Internet Identity")'`
- **WebKit/Safari**: Known compatibility issue with `@dfinity/internet-identity-playwright` library
  - II window doesn't load properly in WebKit
  - Tests work correctly in Chromium and Firefox
  - WebKit is currently disabled in playwright.config.ts

### Elements Not Found

- Add proper `data-testid` attributes to components
- Check if elements are behind authentication
- Verify components are rendered (inspect browser in `--headed` mode)

### Flaky Tests

- Add explicit waits: `await page.waitForSelector()`
- Check for race conditions
- Ensure proper cleanup between tests

## Further Reading

- [Playwright Documentation](https://playwright.dev)
- [Internet Computer Documentation](https://internetcomputer.org/docs)
- [PRD.md](../../PRD.md) - Product requirements
- [FEATURES.md](../../FEATURES.md) - Feature documentation