import { getNetworkConfig } from '@/types/backend.types';
import { Principal } from '@dfinity/principal';
import { createAuthenticatedActor, updateActorIdentity } from '@/services/actor.service';
import { getIdentity } from '@/services/auth.service';
import { Identity } from '@dfinity/agent';
import { idlFactory as backendIdlFactory, canisterId as backendCanisterId } from 'declarations/backend';
import { idlFactory as ledgerIdlFactory, canisterId as ledgerCanisterId } from 'declarations/mock_cktestbtc_ledger';
import { idlFactory as minterIdlFactory, canisterId as minterCanisterId } from 'declarations/mock_cktestbtc_minter';

/**
 * Faucet Service - Backend Proxy for Authorized Minting
 * Implements PRD Minting Matrix: DEV + Non-Custodial = Direct to User Principal
 * Uses backend as authorized minter proxy to call ledger.mint()
 */

// Module-level state for actors (functional paradigm)
let backendActor: any = null;
let ledgerActor: any = null;
let minterActor: any = null;

/**
 * Initialize or update faucet actors with current identity
 */
export const initializeFaucetActors = async (): Promise<void> => {
  const identity = getIdentity();
  if (!identity) {
    console.log('[FaucetService] No identity available for faucet actors');
    backendActor = null;
    ledgerActor = null;
    minterActor = null;
    return;
  }

  try {
    backendActor = await createAuthenticatedActor(
      backendCanisterId,
      backendIdlFactory,
      identity
    );
    ledgerActor = await createAuthenticatedActor(
      ledgerCanisterId,
      ledgerIdlFactory,
      identity
    );
    minterActor = await createAuthenticatedActor(
      minterCanisterId,
      minterIdlFactory,
      identity
    );
    console.log('[FaucetService] Faucet actors initialized');
  } catch (error) {
    console.error('[FaucetService] Failed to initialize faucet actors:', error);
  }
};

/**
 * Update faucet actors with new identity
 */
export const updateFaucetActors = async (identity: Identity | null): Promise<void> => {
  if (!identity) {
    console.log('[FaucetService] Clearing faucet actors (no identity)');
    backendActor = null;
    ledgerActor = null;
    minterActor = null;
    return;
  }

  try {
    backendActor = await updateActorIdentity(
      backendCanisterId,
      backendIdlFactory,
      identity
    );
    ledgerActor = await updateActorIdentity(
      ledgerCanisterId,
      ledgerIdlFactory,
      identity
    );
    minterActor = await updateActorIdentity(
      minterCanisterId,
      minterIdlFactory,
      identity
    );
    console.log('[FaucetService] Faucet actors updated');
  } catch (error) {
    console.error('[FaucetService] Failed to update faucet actors:', error);
  }
};

/**
 * Set the backend actor (for compatibility)
 * @deprecated Use initializeFaucetActors() or updateFaucetActors() instead
 */
export const setBackendActor = (actor: any): void => {
  console.warn('[FaucetService] setBackendActor is deprecated. Use initializeFaucetActors() instead.');
  backendActor = actor;
};

/**
 * Set the ledger actor (for compatibility)
 * @deprecated Use initializeFaucetActors() or updateFaucetActors() instead
 */
export const setLedgerActor = (actor: any): void => {
  console.warn('[FaucetService] setLedgerActor is deprecated. Use initializeFaucetActors() instead.');
  ledgerActor = actor;
};

/**
 * Set the minter actor (for compatibility)
 * @deprecated Use initializeFaucetActors() or updateFaucetActors() instead
 */
export const setMinterActor = (actor: any): void => {
  console.warn('[FaucetService] setMinterActor is deprecated. Use initializeFaucetActors() instead.');
  minterActor = actor;
};

/**
 * Get current backend actor
 * Attempts to initialize if not available
 */
export const getBackendActor = async (): Promise<any> => {
  if (!backendActor) {
    await initializeFaucetActors();
  }
  return backendActor;
};

/**
 * Get current backend actor synchronously
 */
export const getBackendActorSync = (): any => {
  return backendActor;
};

/**
 * Get current ledger actor
 * Attempts to initialize if not available
 */
export const getLedgerActor = async (): Promise<any> => {
  if (!ledgerActor) {
    await initializeFaucetActors();
  }
  return ledgerActor;
};

/**
 * Get current minter actor
 * Attempts to initialize if not available
 */
export const getMinterActor = async (): Promise<any> => {
  if (!minterActor) {
    await initializeFaucetActors();
  }
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
    // Try to initialize
    await initializeFaucetActors();
    if (!backendActor) {
      return { success: false, error: 'Backend actor not initialized' };
    }
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
  // Check if backend actor is already initialized
  const actor = getBackendActorSync();
  return config.network === 'local' && !!actor;
};