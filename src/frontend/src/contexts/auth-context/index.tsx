import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Identity } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import * as authService from '@/services/auth.service';
import { updateBackendActor } from '@/services/backend.service';
import { updateLedgerActor } from '@/services/ledger.service';
import { updateFaucetActors } from '@/services/faucet.service';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  identity: Identity | null;
  principal: Principal | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * AuthProvider component using @dfinity/auth-client
 * Manages Internet Identity authentication and actor lifecycle
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initialize authentication on mount
   * Checks for existing session and restores it
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('[AuthContext] Initializing authentication...');
        await authService.initAuth();

        const authenticated = await authService.isAuthenticated();
        if (authenticated) {
          const currentIdentity = authService.getIdentity();
          const currentPrincipal = authService.getPrincipal();

          if (currentIdentity && currentPrincipal) {
            setIdentity(currentIdentity);
            setPrincipal(currentPrincipal);
            setIsAuthenticated(true);

            // Update all actors with authenticated identity
            await updateBackendActor(currentIdentity);
            await updateLedgerActor(currentIdentity);
            await updateFaucetActors(currentIdentity);

            console.log('[AuthContext] Restored authentication session:', currentPrincipal.toString());
          }
        }
      } catch (error) {
        console.error('[AuthContext] Failed to initialize authentication:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize authentication');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Login handler
   * Opens Internet Identity authentication window
   */
  const login = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      console.log('[AuthContext] Starting login process...');
      const newIdentity = await authService.login();
      const newPrincipal = newIdentity.getPrincipal();

      setIdentity(newIdentity);
      setPrincipal(newPrincipal);
      setIsAuthenticated(true);

      // Update all actors with new authenticated identity
      await updateBackendActor(newIdentity);
      await updateLedgerActor(newIdentity);
      await updateFaucetActors(newIdentity);

      console.log('[AuthContext] Login successful:', newPrincipal.toString());
    } catch (error) {
      console.error('[AuthContext] Login failed:', error);
      setError(error instanceof Error ? error.message : 'Login failed');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout handler
   * Clears authentication and resets all actors
   */
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);

      console.log('[AuthContext] Logging out...');
      await authService.logout();

      // Clear all state
      setIdentity(null);
      setPrincipal(null);
      setIsAuthenticated(false);
      setError(null);

      // Clear all actors
      await updateBackendActor(null);
      await updateLedgerActor(null);
      await updateFaucetActors(null);

      console.log('[AuthContext] Logout complete');
    } catch (error) {
      console.error('[AuthContext] Logout failed:', error);
      setError(error instanceof Error ? error.message : 'Logout failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const contextValue: AuthContextType = {
    isAuthenticated,
    isLoading,
    identity,
    principal,
    login,
    logout,
    error
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use auth context
 * Throws error if used outside of AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};