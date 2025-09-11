import { AuthClient } from '@dfinity/auth-client';
import { Principal } from '@dfinity/principal';
import { getNetworkConfig } from '../types/backend.types';
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
    return null;
  }
};