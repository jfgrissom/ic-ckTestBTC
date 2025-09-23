import { BackendActor } from '@/types/backend.types';

/**
 * Backend service for Connect2IC v2 pattern
 * Works with actors provided by Connect2IC hooks
 */

// Global state for backend actor
let backendActor: BackendActor | null = null;

/**
 * Set the backend actor (called by hooks when actor is available)
 */
export const setBackendActor = (actor: BackendActor | null): void => {
  backendActor = actor;
};

/**
 * Get current backend actor
 */
export const getBackend = (): BackendActor | null => {
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