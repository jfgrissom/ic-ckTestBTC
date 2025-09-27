import { BackendActor } from '@/types/backend.types';
import { createAuthenticatedActor, updateActorIdentity } from '@/services/actor.service';
import { getIdentity } from '@/services/auth.service';
import { idlFactory } from 'declarations/backend';
import { canisterId } from 'declarations/backend';
import { Identity } from '@dfinity/agent';

/**
 * Backend service using @dfinity/auth-client
 * Creates and manages authenticated actors for backend canister
 */

// Module-level state for backend actor (functional paradigm)
let backendActor: BackendActor | null = null;

/**
 * Initialize or update backend actor with current identity
 * Creates a new authenticated actor for backend communication
 */
export const initializeBackendActor = async (): Promise<void> => {
  const identity = getIdentity();
  if (!identity) {
    console.log('[BackendService] No identity available for backend actor');
    backendActor = null;
    return;
  }

  try {
    backendActor = await createAuthenticatedActor<BackendActor>(
      canisterId,
      idlFactory,
      identity
    );
    console.log('[BackendService] Backend actor initialized with principal:',
      identity.getPrincipal().toString());
  } catch (error) {
    console.error('[BackendService] Failed to initialize backend actor:', error);
    backendActor = null;
  }
};

/**
 * Update backend actor with new identity
 * Called when user authentication changes
 */
export const updateBackendActor = async (identity: Identity | null): Promise<void> => {
  if (!identity) {
    console.log('[BackendService] Clearing backend actor (no identity)');
    backendActor = null;
    return;
  }

  try {
    backendActor = await updateActorIdentity<BackendActor>(
      canisterId,
      idlFactory,
      identity
    );
    console.log('[BackendService] Backend actor updated with principal:',
      identity.getPrincipal().toString());
  } catch (error) {
    console.error('[BackendService] Failed to update backend actor:', error);
    backendActor = null;
  }
};

/**
 * Set the backend actor (for compatibility with existing code)
 * @deprecated Use initializeBackendActor() or updateBackendActor() instead
 */
export const setBackendActor = (actor: BackendActor | null): void => {
  console.warn('[BackendService] setBackendActor is deprecated. Use initializeBackendActor() instead.');
  backendActor = actor;
};

/**
 * Get current backend actor
 * Attempts to initialize if not already available
 */
export const getBackend = async (): Promise<BackendActor | null> => {
  if (!backendActor) {
    // Try to initialize if we have an identity
    await initializeBackendActor();
  }
  return backendActor;
};

/**
 * Get current backend actor synchronously
 * Returns null if not initialized - use for cases where async init isn't possible
 */
export const getBackendSync = (): BackendActor | null => {
  return backendActor;
};

/**
 * Clear backend actor
 */
export const clearBackend = (): void => {
  backendActor = null;
};

/**
 * Check if backend is initialized
 */
export const isBackendInitialized = (): boolean => {
  return backendActor !== null;
};

/**
 * Wait for backend to be ready with retry logic
 */
export const ensureBackendReady = async (maxRetries: number = 5, delayMs: number = 500): Promise<BackendActor> => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (backendActor) {
      console.log(`[Backend Service] Backend ready on attempt ${attempt + 1}`);
      return backendActor;
    }

    console.log(`[Backend Service] Backend not ready, attempt ${attempt + 1}/${maxRetries}, waiting ${delayMs}ms...`);

    if (attempt < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      // Exponential backoff: increase delay for next attempt
      delayMs = Math.min(delayMs * 1.5, 2000);
    }
  }

  throw new Error(`Backend not ready after ${maxRetries} attempts`);
};

/**
 * Test backend connectivity by calling a simple method
 */
export const testBackendConnection = async (actor?: BackendActor): Promise<boolean> => {
  const testActor = actor || backendActor;
  if (!testActor) {
    return false;
  }

  try {
    // Try to call a simple method to test connectivity
    // Using get_principal as it's a basic query method
    await testActor.get_principal();
    return true;
  } catch (error) {
    console.log('[Backend Service] Connection test failed:', error);
    return false;
  }
};