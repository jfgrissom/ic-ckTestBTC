import { AuthClient } from '@dfinity/auth-client';
import { Identity } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';

// Module-level state (functional paradigm - no classes)
let authClient: AuthClient | null = null;
let currentIdentity: Identity | null = null;

/**
 * Initialize the authentication client
 * Creates and configures the AuthClient with idle timeout settings
 */
export const initAuth = async (): Promise<AuthClient> => {
  console.log('[AuthService] Initializing authentication client...');

  authClient = await AuthClient.create({
    idleOptions: {
      idleTimeout: 1000 * 60 * 30, // 30 minutes
      disableDefaultIdleCallback: true
    }
  });

  // Check if user is already authenticated
  if (await authClient.isAuthenticated()) {
    currentIdentity = authClient.getIdentity();
    const principal = currentIdentity.getPrincipal();
    console.log('[AuthService] User already authenticated:', principal.toString());
  } else {
    console.log('[AuthService] No existing authentication session');
  }

  return authClient;
};

/**
 * Login using Internet Identity
 * Opens the II authentication window and handles the response
 */
export const login = async (): Promise<Identity> => {
  if (!authClient) {
    throw new Error('AuthClient not initialized. Call initAuth() first.');
  }

  console.log('[AuthService] Starting login flow...');

  return new Promise((resolve, reject) => {
    const identityProvider = import.meta.env.DEV
      ? `http://${import.meta.env.VITE_CANISTER_ID_INTERNET_IDENTITY}.localhost:4943`
      : 'https://identity.ic0.app'; // Production Internet Identity

    authClient!.login({
      identityProvider,
      maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000), // 7 days in nanoseconds
      onSuccess: () => {
        currentIdentity = authClient!.getIdentity();
        const principal = currentIdentity.getPrincipal();
        console.log('[AuthService] Login successful. Principal:', principal.toString());
        resolve(currentIdentity);
      },
      onError: (error) => {
        console.error('[AuthService] Login failed:', error);
        reject(error);
      }
    });
  });
};

/**
 * Logout and clear authentication
 * Clears the stored identity and logs out from II
 */
export const logout = async (): Promise<void> => {
  console.log('[AuthService] Logging out...');

  if (authClient) {
    await authClient.logout();
    currentIdentity = null;
    console.log('[AuthService] Logout complete');
  }
};

/**
 * Get the current identity
 * Returns null if not authenticated
 */
export const getIdentity = (): Identity | null => {
  return currentIdentity;
};

/**
 * Get the current principal
 * Returns null if not authenticated
 */
export const getPrincipal = (): Principal | null => {
  if (!currentIdentity) return null;
  return currentIdentity.getPrincipal();
};

/**
 * Check if user is authenticated
 * Returns true if there's a valid authentication session
 */
export const isAuthenticated = async (): Promise<boolean> => {
  if (!authClient) return false;
  return await authClient.isAuthenticated();
};

/**
 * Refresh authentication if needed
 * Useful for checking auth status after page reload
 */
export const refreshAuth = async (): Promise<boolean> => {
  if (!authClient) {
    await initAuth();
  }

  const authenticated = await isAuthenticated();
  if (authenticated && authClient) {
    currentIdentity = authClient.getIdentity();
    const principal = currentIdentity.getPrincipal();
    console.log('[AuthService] Authentication refreshed. Principal:', principal.toString());
  }

  return authenticated;
};

/**
 * Get authentication client instance
 * For advanced usage - prefer using the exported functions
 */
export const getAuthClient = (): AuthClient | null => {
  return authClient;
};