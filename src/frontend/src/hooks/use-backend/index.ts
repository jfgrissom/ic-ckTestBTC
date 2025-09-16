import { useState } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { initializeBackend, clearBackend } from '@/services/backend.service';
import { BackendState, BackendActions, BackendActor } from '@/types/backend.types';

export const useBackend = (): BackendState & BackendActions => {
  const [backend, setBackend] = useState<BackendActor | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('useBackend: Hook initialized, backend:', !!backend);

  const initializeBackendActor = async (client: AuthClient): Promise<void> => {
    console.log('useBackend: initializeBackendActor called');
    setLoading(true);
    setError(null);
    try {
      console.log('useBackend: Calling initializeBackend service');
      const backendActor = await initializeBackend(client);
      console.log('useBackend: Backend initialized successfully:', !!backendActor);
      setBackend(backendActor);
    } catch (err: any) {
      console.error('useBackend: Failed to initialize backend:', err);
      setError(err.message || 'Failed to initialize backend');
      setBackend(null);
    } finally {
      setLoading(false);
    }
  };

  const clearBackendActor = (): void => {
    clearBackend();
    setBackend(null);
    setError(null);
  };

  return {
    backend,
    loading,
    error,
    initializeBackend: initializeBackendActor,
    clearBackend: clearBackendActor,
  };
};