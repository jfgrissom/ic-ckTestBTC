import { Actor, HttpAgent, Identity } from '@dfinity/agent';
import { IDL } from '@dfinity/candid';
import { Principal } from '@dfinity/principal';

/**
 * Create an authenticated actor for canister communication
 * Uses the provided identity for authentication
 *
 * @param canisterId - The canister ID as string or Principal
 * @param idlFactory - The IDL interface factory for the canister
 * @param identity - The identity to use for authentication
 * @returns The authenticated actor instance
 */
export const createAuthenticatedActor = async <T>(
  canisterId: string | Principal,
  idlFactory: IDL.InterfaceFactory,
  identity: Identity
): Promise<T> => {
  console.log('[ActorService] Creating authenticated actor for canister:',
    typeof canisterId === 'string' ? canisterId : canisterId.toText());

  // Create an HTTP agent with the provided identity
  const agent = new HttpAgent({
    identity,
    host: import.meta.env.DEV
      ? 'http://localhost:4943'
      : 'https://ic0.app'
  });

  // Fetch root key for local development
  // This is necessary for the agent to verify responses in local development
  if (import.meta.env.DEV) {
    await agent.fetchRootKey().catch(err => {
      console.error('[ActorService] Failed to fetch root key:', err);
    });
  }

  // Create and return the actor
  const actor = Actor.createActor<T>(idlFactory, {
    agent,
    canisterId: typeof canisterId === 'string'
      ? Principal.fromText(canisterId)
      : canisterId
  });

  console.log('[ActorService] Actor created successfully');
  return actor;
};

/**
 * Create an anonymous actor for canister communication
 * Useful for public queries that don't require authentication
 *
 * @param canisterId - The canister ID as string or Principal
 * @param idlFactory - The IDL interface factory for the canister
 * @returns The anonymous actor instance
 */
export const createAnonymousActor = async <T>(
  canisterId: string | Principal,
  idlFactory: IDL.InterfaceFactory
): Promise<T> => {
  console.log('[ActorService] Creating anonymous actor for canister:',
    typeof canisterId === 'string' ? canisterId : canisterId.toText());

  // Create an HTTP agent without identity (anonymous)
  const agent = new HttpAgent({
    host: import.meta.env.DEV
      ? 'http://localhost:4943'
      : 'https://ic0.app'
  });

  // Fetch root key for local development
  if (import.meta.env.DEV) {
    await agent.fetchRootKey().catch(err => {
      console.error('[ActorService] Failed to fetch root key:', err);
    });
  }

  // Create and return the actor
  const actor = Actor.createActor<T>(idlFactory, {
    agent,
    canisterId: typeof canisterId === 'string'
      ? Principal.fromText(canisterId)
      : canisterId
  });

  console.log('[ActorService] Anonymous actor created successfully');
  return actor;
};

/**
 * Update an existing actor with a new identity
 * Useful when switching users or refreshing authentication
 *
 * @param canisterId - The canister ID as string or Principal
 * @param idlFactory - The IDL interface factory for the canister
 * @param identity - The new identity to use
 * @returns The updated actor instance
 */
export const updateActorIdentity = async <T>(
  canisterId: string | Principal,
  idlFactory: IDL.InterfaceFactory,
  identity: Identity | null
): Promise<T | null> => {
  if (!identity) {
    console.log('[ActorService] No identity provided, returning null');
    return null;
  }

  console.log('[ActorService] Updating actor identity for canister:',
    typeof canisterId === 'string' ? canisterId : canisterId.toText());

  return await createAuthenticatedActor<T>(canisterId, idlFactory, identity);
};