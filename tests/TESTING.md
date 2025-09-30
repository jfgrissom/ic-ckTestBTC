# Testing Guide

This guide covers all testing approaches for the ckTestBTC Wallet application.

## Quick Start - Playwright E2E Tests

### 1. Prerequisites

Ensure you have:
- Node.js v20+
- dfx v0.29.1+
- Rust with wasm32 target

### 2. Setup

```bash
# Install dependencies (including Playwright)
npm install

# Install Playwright browsers
npx playwright install
```

### 3. Start Local Environment

```bash
# Terminal 1: Start dfx and deploy canisters
dfx start --clean
dfx deploy

# Terminal 2: Start frontend dev server
npm run dev
```

### 4. Run Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with visible browser
npm run test:e2e:headed

# Interactive UI mode
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

## Test Organization

### Playwright E2E Tests (`tests/playwright/`)

Full end-to-end integration tests covering:
- ✅ Internet Identity authentication
- ✅ All wallet screens and tabs
- ✅ Transaction flows
- ✅ Balance updates
- ✅ Error handling

**Location**: `tests/playwright/`
**Documentation**: `tests/playwright/README.md`

### Unit Tests (Future)

Component-level tests for isolated functionality testing.

**Planned location**: `tests/unit/`

## Playwright Test Files

```
tests/playwright/
├── 00-authentication.spec.ts          # Login/logout flows
├── 01-home-screen.spec.ts             # Initial loading
├── 02-wallet-screen-header.spec.ts    # Header functionality
├── 03-information-tab.spec.ts         # Balance & addresses
├── 04-deposit-withdrawals-tab.spec.ts # Deposit/withdrawal flows
├── 05-send-receive-tab.spec.ts        # Token transfers
└── 06-transactions-tab.spec.ts        # Transaction history
```

## Authentication for Tests

Tests use Internet Identity with test user IDs:

### Default Test Users
- **10000** - Primary test user (default)
- **10001** - Secondary test user

### Usage in Tests

```typescript
// Use existing test user
await mockLogin(page, '10000');

// Create new identity
await mockLogin(page, '', true);

// Logout
await mockLogout(page);
```

## Common Test Scenarios

### Running Specific Tests

```bash
# Run only authentication tests
npx playwright test 00-authentication

# Run send/receive tests
npx playwright test 05-send-receive

# Run single test by name
npx playwright test -g "should login with existing user"
```

### Debugging Failed Tests

```bash
# Run in debug mode
npm run test:e2e:debug

# Run with browser visible
npm run test:e2e:headed

# View last test report
npm run test:e2e:report
```

### Test Artifacts

Playwright automatically captures:
- **Screenshots** on failure → `test-results/`
- **Videos** on failure → `test-results/`
- **Traces** on retry → `test-results/`
- **HTML reports** → `playwright-report/`

## CI/CD Testing

Tests run automatically on:
- Push to `master`, `main`, `develop`
- Pull requests
- Manual workflow trigger

GitHub Actions workflow handles:
1. Environment setup (Node, dfx, Rust)
2. Canister deployment
3. Frontend server startup
4. Test execution
5. Report and artifact upload

**Workflow**: `.github/workflows/playwright-tests.yml`

## Test Configuration

### Playwright Config (`playwright.config.ts`)

```typescript
// Key settings
testDir: './tests/playwright'
timeout: 30000 // 30s per test
retries: process.env.CI ? 2 : 0
workers: process.env.CI ? 1 : undefined

// Override base URL
BASE_URL=http://localhost:8080 npx playwright test
```

### Browser Configuration

Tests run on:
- ✅ Chromium (default)
- ✅ Firefox
- ✅ WebKit

To run specific browser:

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Writing New Tests

### Test Structure

```typescript
import { test, expect } from './fixtures/test-fixtures';
import { mockLogin, navigateToTab } from './helpers/test-helpers';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await mockLogin(page, '10000');
  });

  test('should do something', async ({ page }) => {
    // Test implementation
    await expect(page.locator('[data-testid="element"]')).toBeVisible();
  });
});
```

### Using Test Fixtures

```typescript
// Pre-loaded page (no auth)
test('test name', async ({ loadedPage }) => {
  // Page is loaded, not authenticated
});

// Authenticated page
test('test name', async ({ authenticatedPage }) => {
  // User is already logged in with user 10000
});
```

### Best Practices

1. **Use data-testid attributes**
   ```tsx
   <div data-testid="wallet-screen">...</div>
   ```

2. **Wait for elements properly**
   ```typescript
   await expect(page.locator('[data-testid="element"]')).toBeVisible();
   ```

3. **Test user flows, not implementation**
   ```typescript
   // Good - tests user action
   await page.click('button:has-text("Send")');

   // Bad - tests implementation
   await page.click('.btn-primary.send-action');
   ```

4. **Keep tests independent**
   ```typescript
   // Each test should work in isolation
   test.beforeEach(async ({ page }) => {
     await page.goto('/');
     await mockLogin(page);
   });
   ```

## Skipped Tests

Many tests are currently skipped (marked with `test.skip()`) pending:
- Full authentication implementation
- Complete UI with data-testid attributes
- Backend functionality for all operations

To enable skipped tests:
1. Remove `test.skip()`
2. Uncomment authentication lines
3. Add required data-testid attributes to UI

## Test Coverage Goals

- **E2E Coverage**: All user flows from PRD.md
- **Browser Coverage**: Chrome, Firefox, Safari (WebKit)
- **Viewport Coverage**: Desktop + Mobile + Tablet
- **Error Scenarios**: Network failures, validation errors, edge cases

## Troubleshooting

### "Tests timeout"
- Check dfx is running: `dfx ping`
- Verify dev server: `curl http://127.0.0.1:5173`
- Increase timeout in `playwright.config.ts`

### "Element not found"
- Add `data-testid` to component
- Run in headed mode to inspect: `npm run test:e2e:headed`
- Check element is rendered after auth

### "Authentication fails"
- Verify II popup opens correctly
- Check user ID (10000/10001) is valid
- Try creating new identity: `await mockLogin(page, '', true)`

### "Flaky tests"
- Add explicit waits
- Check for race conditions
- Use Playwright's auto-waiting features
- Review test in UI mode: `npm run test:e2e:ui`

## Resources

- **Playwright Docs**: https://playwright.dev
- **Test README**: `tests/playwright/README.md`
- **PRD**: `PRD.md`
- **Features**: `FEATURES.md`

## Next Steps

1. **Enable skipped tests** as features are implemented
2. **Add data-testid attributes** to all interactive elements
3. **Implement remaining features** per PRD.md
4. **Add unit tests** for component-level testing
5. **Increase test coverage** with edge cases and error scenarios