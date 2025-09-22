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