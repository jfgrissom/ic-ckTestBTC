import { AuthClient } from '@dfinity/auth-client';
import { Principal } from '@dfinity/principal';
import { getNetworkConfig } from '@/types/backend.types';
import { clearBackend, getBackend } from './backend.service';

// Global state for auth client
let authClient: AuthClient | null = null;

/**
 * Initialize authentication client
 */
export const initAuth = async (): Promise<AuthClient> => {
  const client = await AuthClient.create();
  authClient = client;
  return client;
};

/**
 * Login with Internet Identity
 */
export const login = async (): Promise<{ success: boolean; error?: string }> => {
  if (!authClient) {
    return { success: false, error: 'Auth client not initialized' };
  }

  const config = getNetworkConfig();

  return new Promise((resolve) => {
    authClient!.login({
      identityProvider: config.identityProvider,
      onSuccess: () => resolve({ success: true }),
      onError: (error) => resolve({ success: false, error: error || 'Login failed' }),
    });
  });
};

/**
 * Logout and clear backend
 */
export const logout = async (): Promise<void> => {
  if (!authClient) return;
  
  await authClient.logout();
  clearBackend();
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  if (!authClient) return false;
  return await authClient.isAuthenticated();
};

/**
 * Get current auth client
 */
export const getAuthClient = (): AuthClient | null => {
  return authClient;
};

/**
 * Get user principal from backend
 */
export const getUserPrincipal = async (): Promise<Principal | null> => {
  const backend = getBackend();
  if (!backend) return null;

  try {
    const principal = await backend.get_principal();
    return principal;
  } catch (error) {
    console.error('Failed to get user principal:', error);

    // If signature verification failed, try to refresh authentication
    if (error instanceof Error && error.message.includes('signature')) {
      console.log('[Auth Service] Signature verification failed, attempting auth refresh...');
      try {
        await refreshAuthentication();
        const refreshedBackend = getBackend();
        if (refreshedBackend) {
          return await refreshedBackend.get_principal();
        }
      } catch (refreshError) {
        console.error('[Auth Service] Auth refresh failed:', refreshError);
      }
    }

    return null;
  }
};

/**
 * Refresh authentication when signature verification fails
 */
export const refreshAuthentication = async (): Promise<void> => {
  if (!authClient) {
    throw new Error('Auth client not initialized');
  }

  try {
    // Force logout and re-login
    await authClient.logout();

    // Re-initialize auth client
    const newClient = await AuthClient.create();
    authClient = newClient;

    // Check if still authenticated after refresh
    const isAuth = await authClient.isAuthenticated();
    if (!isAuth) {
      console.log('[Auth Service] User needs to re-authenticate');
      throw new Error('User needs to re-authenticate');
    }

    console.log('[Auth Service] Authentication refreshed successfully');
  } catch (error) {
    console.error('[Auth Service] Failed to refresh authentication:', error);
    throw error;
  }
};