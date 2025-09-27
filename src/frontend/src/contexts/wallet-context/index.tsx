import React, { createContext, useContext, useReducer, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { initializeBackendActor } from '@/services/backend.service';
import { initializeLedgerActor } from '@/services/ledger.service';
import { initializeFaucetActors } from '@/services/faucet.service';
import { WalletContextValue } from './types';
import { walletReducer, initialWalletState } from './reducer';
import { loadInitialWalletData } from './actions';

// Create the context
const WalletContext = createContext<WalletContextValue | undefined>(undefined);

// Custom hook to use wallet context
export const useWalletContext = (): WalletContextValue => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
};

// Provider props
interface WalletProviderProps {
  children: React.ReactNode;
}

// Main WalletProvider component
export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(walletReducer, initialWalletState);

  // Use new auth context
  const { isAuthenticated, principal, identity } = useAuth();

  // Track previous principal to detect user changes
  const prevPrincipalRef = useRef<string | null>(null);
  const actorsInitializedRef = useRef(false);

  // 1. Handle authentication state changes
  useEffect(() => {
    const currentPrincipal = principal?.toString() || null;
    const prevPrincipal = prevPrincipalRef.current;

    // Check if user changed (different principal)
    const userChanged = prevPrincipal !== null &&
                       currentPrincipal !== null &&
                       prevPrincipal !== currentPrincipal;

    dispatch({
      type: 'AUTH_CHANGED',
      payload: {
        isAuthenticated,
        principal: currentPrincipal,
      },
    });

    // Initialize actors when authenticated
    if (isAuthenticated && identity && !actorsInitializedRef.current) {
      console.log('[WalletProvider] User authenticated - initializing actors');
      Promise.all([
        initializeBackendActor(),
        initializeLedgerActor(),
        initializeFaucetActors()
      ]).then(() => {
        actorsInitializedRef.current = true;
        dispatch({ type: 'BACKEND_READY' });
      }).catch((error) => {
        console.error('[WalletProvider] Failed to initialize actors:', error);
        dispatch({ type: 'BACKEND_NOT_READY' });
      });
    } else if (!isAuthenticated && actorsInitializedRef.current) {
      console.log('[WalletProvider] User logged out - clearing state');
      actorsInitializedRef.current = false;
      dispatch({ type: 'BACKEND_NOT_READY' });
    } else if (userChanged) {
      console.log('[WalletProvider] User changed - reinitializing actors');
      Promise.all([
        initializeBackendActor(),
        initializeLedgerActor(),
        initializeFaucetActors()
      ]).then(() => {
        dispatch({ type: 'BACKEND_READY' });
      }).catch((error) => {
        console.error('[WalletProvider] Failed to reinitialize actors:', error);
        dispatch({ type: 'BACKEND_NOT_READY' });
      });
    }

    // Update previous principal reference
    prevPrincipalRef.current = currentPrincipal;
  }, [isAuthenticated, principal, identity]);

  // 2. Load initial wallet data when backend is ready
  useEffect(() => {
    if (state.backendReady && isAuthenticated && principal) {
      console.log('[WalletProvider] Loading initial wallet data');
      loadInitialWalletData(dispatch);
    }
  }, [state.backendReady, isAuthenticated, principal]);

  // 3. Create the context value with memoization for performance
  const contextValue = useMemo<WalletContextValue>(() => ({
    state,
    dispatch,
  }), [state]);

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

// Export the context for direct use if needed
export { WalletContext };