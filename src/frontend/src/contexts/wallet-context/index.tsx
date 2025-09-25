import React, { createContext, useContext, useReducer, useEffect, useMemo, useRef } from 'react';
import { useConnect, useCanister } from '@connect2ic/react';
import { setBackendActor } from '@/services/backend.service';
import { setConnectLedgerActor } from '@/services/ledger.service';
import { WalletContextValue, WalletState } from './types';
import { BackendActor } from '@/types/backend.types';
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

// Type validation function for Connect2IC actors
const validateBackendActor = (actor: unknown): actor is BackendActor => {
  return !!(actor &&
         typeof actor === 'object' &&
         actor !== null &&
         'get_wallet_status' in actor &&
         typeof (actor as Record<string, unknown>).get_wallet_status === 'function');
};

// Main WalletProvider component
export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(walletReducer, initialWalletState);

  // Connect2IC hooks
  const { isConnected, principal } = useConnect();
  const [backendActor] = useCanister('backend');
  const [ckTestBTCLedgerActor] = useCanister('ckTestBTCLedger');

  // Track previous principal to detect user changes
  const prevPrincipalRef = useRef<string | null>(null);

  // 1. Handle authentication state changes
  useEffect(() => {
    const currentPrincipal = principal || null;
    const prevPrincipal = prevPrincipalRef.current;

    // Check if user changed (different principal)
    const userChanged = prevPrincipal !== null &&
                       currentPrincipal !== null &&
                       prevPrincipal !== currentPrincipal;

    dispatch({
      type: 'AUTH_CHANGED',
      payload: {
        isAuthenticated: isConnected,
        principal: currentPrincipal,
      },
    });

    // CRITICAL: Clear backend actor when user logs out or changes
    // This prevents using cached actors from previous authentication sessions
    if (!isConnected) {
      console.log('[WalletProvider] User logged out - clearing backend actor');
      setBackendActor(null);
    } else if (userChanged) {
      console.log('[WalletProvider] User changed - clearing backend actor', {
        from: prevPrincipal,
        to: currentPrincipal
      });
      setBackendActor(null);
    }

    // Update previous principal reference
    prevPrincipalRef.current = currentPrincipal;
  }, [isConnected, principal]);

  // 2. Handle backend actor lifecycle management - Event-driven approach with validation
  useEffect(() => {
    if (isConnected && backendActor && !state.backendReady) {
      // Only when transitioning TO ready state
      if (validateBackendActor(backendActor)) {
        console.log('[WalletProvider] Backend actor validated and connected - transitioning to ready');
        setBackendActor(backendActor as BackendActor);
        dispatch({ type: 'BACKEND_READY' });
      } else {
        console.error('[WalletProvider] Invalid backend actor type:', {
          type: typeof backendActor,
          hasGetWalletStatus: backendActor && typeof backendActor === 'object' && 'get_wallet_status' in backendActor,
          actor: backendActor
        });
      }
    } else if ((!isConnected || !backendActor) && state.backendReady) {
      // Only when transitioning FROM ready state
      console.log('[WalletProvider] Backend actor disconnected - transitioning to not ready');
      setBackendActor(null);
      dispatch({ type: 'BACKEND_NOT_READY' });
    }
  }, [isConnected, state.backendReady, !!backendActor]);

  // 3. Handle ckTestBTC ledger actor lifecycle management - Event-driven approach
  const ledgerActorRef = useRef<any>(null);
  useEffect(() => {
    if (isConnected && ckTestBTCLedgerActor && !ledgerActorRef.current) {
      // Only when transitioning TO connected state
      console.log('[WalletProvider] ckTestBTC ledger actor connected');
      setConnectLedgerActor(ckTestBTCLedgerActor);
      ledgerActorRef.current = ckTestBTCLedgerActor;
    } else if ((!isConnected || !ckTestBTCLedgerActor) && ledgerActorRef.current) {
      // Only when transitioning FROM connected state
      console.log('[WalletProvider] ckTestBTC ledger actor disconnected');
      setConnectLedgerActor(null);
      ledgerActorRef.current = null;
    }
  }, [isConnected, !!ckTestBTCLedgerActor]);

  // 4. One-shot initialization pattern - Event-driven approach with detailed logging
  const shouldInitialize = useMemo(() => {
    const conditions = {
      isAuthenticated: state.isAuthenticated,
      backendReady: state.backendReady,
      notInitialized: !state.initialized,
      notLoading: !state.loading.initial,
      loadingInitialValue: state.loading.initial
    };

    const result = state.isAuthenticated &&
                  state.backendReady &&
                  !state.initialized &&
                  !state.loading.initial;

    console.log('[WalletProvider] shouldInitialize calculation:', {
      ...conditions,
      shouldInitialize: result
    });

    return result;
  }, [state.isAuthenticated, state.backendReady, state.initialized, state.loading.initial]);

  useEffect(() => {
    console.log('[WalletProvider] shouldInitialize effect triggered:', shouldInitialize);
    if (shouldInitialize) {
      console.log('[WalletProvider] Initializing wallet data - conditions met:', {
        isAuthenticated: state.isAuthenticated,
        backendReady: state.backendReady,
        initialized: state.initialized,
        alreadyLoading: state.loading.initial
      });
      loadInitialWalletData(dispatch);
    }
  }, [shouldInitialize]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      state,
      dispatch,
    }),
    [state]
  );

  // Debug logging for state changes
  useEffect(() => {
    console.log('[WalletProvider] State update:', {
      isAuthenticated: state.isAuthenticated,
      backendReady: state.backendReady,
      initialized: state.initialized,
      loading: state.loading,
      hasWalletStatus: !!state.walletStatus,
      transactionCount: state.transactions.length,
      // Detailed loading breakdown for debugging
      loadingDetails: {
        initial: state.loading.initial,
        wallet: state.loading.wallet,
        transactions: state.loading.transactions,
        operations: state.loading.operations
      }
    });
  }, [state]);

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

// Export context for advanced usage
export { WalletContext };

// Export types
export type { WalletState, WalletContextValue };

// Re-export all other types and utilities
export * from './types';
export * from './actions';
export * from './reducer';