import { Actor, HttpAgent } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';
import { idlFactory } from 'declarations/backend';
import { BackendActor, getNetworkConfig } from '@/types/backend.types';

// Global state for backend actor
let backendActor: BackendActor | null = null;

/**
 * Initialize backend actor with authentication client
 */
export const initializeBackend = async (client: AuthClient): Promise<BackendActor> => {
  const identity = client.getIdentity();
  const config = getNetworkConfig();

  const agent = new HttpAgent({
    identity,
    host: config.host,
    // For local development, we may need to disable verification
    ...(config.network === 'local' && {
      verifyQuerySignatures: false,
    }),
  });

  // For local development, always fetch root key and configure properly
  if (config.network === 'local') {
    try {
      await agent.fetchRootKey();
    } catch (error) {
      console.error('[Backend Service] Failed to fetch root key:', error);
      // In local development, we might need to proceed without root key verification
      console.warn('[Backend Service] Proceeding without root key verification for local development');
    }
  }

  const actor = Actor.createActor(idlFactory, {
    agent,
    canisterId: config.canisterId,
  }) as BackendActor;

  backendActor = actor;
  return actor;
};

/**
 * Refresh backend actor with current authentication
 */
export const refreshBackend = async (client: AuthClient): Promise<BackendActor> => {
  // Force re-initialization with fresh identity
  return await initializeBackend(client);
};

/**
 * Get current backend actor
 */
export const getBackend = (): BackendActor | null => {
  return backendActor;
};

/**
 * Clear backend actor (for logout)
 */
export const clearBackend = (): void => {
  backendActor = null;
};