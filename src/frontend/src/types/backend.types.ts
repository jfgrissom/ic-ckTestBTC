import { ActorSubclass } from '@dfinity/agent';
import { _SERVICE } from 'declarations/backend/backend.did';

// Use the generated service interface instead of custom types to avoid sync issues
export type BackendActor = ActorSubclass<_SERVICE>;

export interface NetworkConfig {
  host: string;
  identityProvider: string;
  canisterId: string;
  internetIdentityCanisterId: string;
  network: 'local' | 'ic';
}

export const getNetworkConfig = (): NetworkConfig => {
  const isIC = import.meta.env.VITE_DFX_NETWORK === 'ic';
  
  return {
    host: isIC ? 'https://ic0.app' : 'http://127.0.0.1:4943',
    identityProvider: isIC 
      ? 'https://identity.ic0.app'
      : `http://${import.meta.env.VITE_CANISTER_ID_INTERNET_IDENTITY}.localhost:4943/`,
    canisterId: import.meta.env.VITE_CANISTER_ID_BACKEND || '',
    internetIdentityCanisterId: import.meta.env.VITE_CANISTER_ID_INTERNET_IDENTITY || '',
    network: isIC ? 'ic' : 'local',
  };
};