import { useState, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { initAuth, login as authLogin, logout as authLogout } from '@/services/auth.service';
import { useBackend } from '@/hooks/use-backend';
import { AuthState, AuthActions } from '@/types/auth.types';

export const useAuth = (): AuthState & AuthActions => {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [principal, setPrincipal] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const { backend, initializeBackend: initializeBackendActor, clearBackend: clearBackendActor } = useBackend();

  // Handle when backend becomes available after initialization
  useEffect(() => {
    if (backend && authClient && !isAuthenticated) {
      // Only complete authentication if the user is actually authenticated
      authClient.isAuthenticated().then(authenticated => {
        if (authenticated) {
          completeAuthentication();
        }
      });
    }
  }, [backend, authClient, isAuthenticated]);

  const completeAuthentication = async (): Promise<void> => {
    if (!backend || !authClient) {
      console.log('[Auth] Backend or auth client not ready for completion');
      return;
    }

    try {
      // Double check authentication status before making backend calls
      const isAuth = await authClient.isAuthenticated();
      if (!isAuth) {
        console.log('[Auth] User not authenticated, skipping completion');
        return;
      }

      console.log('[Auth] Completing authentication with backend');
      const userPrincipal = await backend.get_principal();
      setPrincipal(userPrincipal.toString());
      setIsAuthenticated(true);
      console.log('[Auth] Authentication completed successfully');
    } catch (error) {
      console.error('Failed to complete authentication:', error);
      setIsAuthenticated(false);
      setPrincipal('');
    }
  };

  const initializeAuth = async (): Promise<void> => {
    setLoading(true);
    try {
      const client = await initAuth();
      setAuthClient(client);

      const isAuth = await client.isAuthenticated();
      if (isAuth) {
        console.log('[Auth] User already authenticated, completing authentication flow');
        await handleAuthenticated(client);
      } else {
        console.log('[Auth] User not authenticated, waiting for login');
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticated = async (client: AuthClient): Promise<void> => {
    setLoading(true);
    try {
      // Initialize backend using the useBackend hook
      await initializeBackendActor(client);

      // The completeAuthentication will be called via useEffect when backend becomes available
    } catch (error) {
      console.error('Failed to handle authentication:', error);
      setIsAuthenticated(false);
      setPrincipal('');
    } finally {
      setLoading(false);
    }
  };

  const login = async (): Promise<void> => {
    if (!authClient) return;
    
    setLoading(true);
    try {
      const result = await authLogin();
      if (result.success) {
        await handleAuthenticated(authClient);
      } else {
        console.error('Login failed:', result.error);
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    if (!authClient) return;

    setLoading(true);
    try {
      await authLogout();
      clearBackendActor(); // Clear the backend actor
      setIsAuthenticated(false);
      setPrincipal('');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  return {
    authClient,
    isAuthenticated,
    principal,
    loading,
    login,
    logout,
    initAuth: initializeAuth,
  };
};