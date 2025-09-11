import { useState, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { initAuth, login as authLogin, logout as authLogout } from '../services/auth.service';
import { initializeBackend } from '../services/backend.service';
import { AuthState, AuthActions } from '../types/auth.types';

export const useAuth = (): AuthState & AuthActions => {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [principal, setPrincipal] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const initializeAuth = async (): Promise<void> => {
    setLoading(true);
    try {
      const client = await initAuth();
      setAuthClient(client);

      if (await client.isAuthenticated()) {
        await handleAuthenticated(client);
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
      // Initialize backend first
      const backend = await initializeBackend(client);
      
      // Get user principal
      const userPrincipal = await backend.get_principal();
      setPrincipal(userPrincipal.toString());
      
      // Only set authenticated to true after backend is fully initialized
      setIsAuthenticated(true);
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