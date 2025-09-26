import { getNetworkConfig } from '@/types/backend.types';
import { Principal } from '@dfinity/principal';

/**
 * Faucet Service - Backend Proxy for Authorized Minting
 * Implements PRD Minting Matrix: DEV + Non-Custodial = Direct to User Principal
 * Uses backend as authorized minter proxy to call ledger.mint()
 */

// Global state for backend actor (for minting) and ledger actor (for balance queries)
let backendActor: any = null;
let ledgerActor: any = null;
let minterActor: any = null;

/**
 * Set the backend actor (called by wallet context when actor is available)
 */
export const setBackendActor = (actor: any): void => {
  backendActor = actor;
};

/**
 * Set the ledger actor (called by wallet context when actor is available)
 */
export const setLedgerActor = (actor: any): void => {
  ledgerActor = actor;
};

/**
 * Set the minter actor (called by wallet context when actor is available)
 */
export const setMinterActor = (actor: any): void => {
  minterActor = actor;
};

/**
 * Get current backend actor
 */
export const getBackendActor = (): any => {
  return backendActor;
};

/**
 * Get current ledger actor
 */
export const getLedgerActor = (): any => {
  return ledgerActor;
};

/**
 * Get current minter actor
 */
export const getMinterActor = (): any => {
  return minterActor;
};

/**
 * Clear all actors
 */
export const clearAllActors = (): void => {
  backendActor = null;
  ledgerActor = null;
  minterActor = null;
};

/**
 * Account interface for ICRC-1 standard
 */
export interface Account {
  owner: Principal;
  subaccount?: Uint8Array;
}

/**
 * Transfer result from ledger mint function
 */
export type TransferResult = { 'Ok': bigint } | { 'Err': any };

/**
 * Use faucet to mint test tokens via authenticated backend
 * Follows PRD Matrix: DEV + Non-Custodial + Direct to User Principal
 * Backend acts as authorized minter to call ledger.mint()
 */
export const useFaucetDirect = async (
  userPrincipal: Principal
): Promise<{ success: boolean; blockIndex?: string; message?: string; error?: string }> => {

  const config = getNetworkConfig();

  // Only available in local development
  if (config.network !== 'local') {
    return { success: false, error: 'Faucet only available in local development' };
  }

  // Ensure backend actor is available (backend is authorized to mint)
  if (!backendActor) {
    return { success: false, error: 'Backend actor not initialized' };
  }

  try {
    console.log('[Faucet Service] Using backend faucet for user:', {
      principal: userPrincipal.toString(),
      backendActorAvailable: !!backendActor
    });

    // Call the backend's faucet function (which calls ledger.mint internally)
    // The backend is an authorized minter in the ledger canister
    const result = await backendActor.faucet();

    if ('Ok' in result) {
      console.log('[Faucet Service] Backend faucet successful:', {
        message: result.Ok,
        principal: userPrincipal.toString()
      });

      return {
        success: true,
        message: result.Ok
      };
    } else {
      console.error('[Faucet Service] Backend faucet failed:', result.Err);
      return {
        success: false,
        error: result.Err
      };
    }
  } catch (error: any) {
    console.error('[Faucet Service] Exception during backend faucet call:', error);
    return {
      success: false,
      error: error.message || 'Failed to call backend faucet'
    };
  }
};

/**
 * Check if faucet is available
 */
export const isFaucetAvailable = (): boolean => {
  const config = getNetworkConfig();
  return config.network === 'local' && !!backendActor;
};