import { test as base, expect } from '@playwright/test';
import { testWithII } from '@dfinity/internet-identity-playwright';

/**
 * Custom Test Fixtures for ckTestBTC Wallet
 *
 * Uses DFINITY's official Internet Identity Playwright library for authentication.
 *
 * The library uses the local Internet Identity canister deployed via dfx.
 * Canister ID is read from .env: VITE_CANISTER_ID_INTERNET_IDENTITY
 */

// Export the base test (non-authenticated)
export { base as test };

// Export testWithII for authenticated tests
export { testWithII };

// Export expect
export { expect };