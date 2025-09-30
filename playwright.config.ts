import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for ckTestBTC Wallet
 *
 * This configuration supports:
 * - Local development testing (http://127.0.0.1:5173)
 * - CI/CD pipeline testing with dfx local replica
 * - Production/staging canister URL testing
 */
export default defineConfig({
  // Test directory
  testDir: './tests/playwright',

  // Maximum time one test can run
  timeout: 30 * 1000,

  // Test execution settings
  fullyParallel: false, // Run tests serially for II authentication stability
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker to avoid II conflicts

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ...(process.env.CI ? [['github'] as const] : [])
  ],

  // Shared settings for all projects
  use: {
    // Base URL - can be overridden via BASE_URL env variable
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:5173',

    // Collect trace when retrying failed tests
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Timeout for each action
    actionTimeout: 10 * 1000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    // WebKit/Safari: Currently disabled due to known issues with Internet Identity
    // The @dfinity/internet-identity-playwright library has compatibility issues
    // with WebKit's handling of popup windows and tabs during authentication.
    // Error: "expect(page).toHaveTitle" times out because II window doesn't load.
    // Tracked issue: Tests work in Chromium and Firefox.
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    // Mobile viewports (optional - can enable if needed)
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  // Run local dev server before starting tests (optional)
  // Uncomment if you want Playwright to automatically start the dev server
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://127.0.0.1:5173',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },
});