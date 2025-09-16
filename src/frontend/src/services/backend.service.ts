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
  });

  if (config.network === 'local') {
    await agent.fetchRootKey();
  }

  const actor = Actor.createActor(idlFactory, {
    agent,
    canisterId: config.canisterId,
  }) as BackendActor;

  backendActor = actor;
  return actor;
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