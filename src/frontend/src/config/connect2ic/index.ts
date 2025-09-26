import { createClient } from '@connect2ic/core';
import { InternetIdentity } from '@connect2ic/core/providers/internet-identity';
import { NFID } from '@connect2ic/core/providers/nfid';
import * as backend from 'declarations/backend';
import * as mockLedger from 'declarations/mock_cktestbtc_ledger';
import * as mockMinter from 'declarations/mock_cktestbtc_minter';

/**
 * Connect2IC Configuration
 * Centralizes all canister configurations for the application
 */

export interface Connect2ICConfig {
  client: any; // Connect2IC client type
}

/**
 * Create and configure the Connect2IC client
 * Handles environment detection and canister setup
 */
export const createConnect2ICClient = async (): Promise<any> => {
  try {
    // Environment detection
    const isDev = import.meta.env.DEV;

    // Configure Internet Identity provider based on environment
    const internetIdentityConfig = isDev ? {
      // Local development configuration - using modern dfx localhost format
      host: 'http://localhost:4943',
      providerUrl: `http://${import.meta.env.VITE_CANISTER_ID_INTERNET_IDENTITY}.localhost:4943`,
      dev: true
    } : {
      // Production configuration - using Internet Identity v2 (id.ai)
      providerUrl: 'https://id.ai',
      dev: false
    };

    // Debug canister modules
    console.log('Connect2IC Canister Configuration:', {
      backend: {
        hasBackend: !!backend.backend,
        canisterId: backend.canisterId,
        hasIdlFactory: !!backend.idlFactory,
        hasCreateActor: !!backend.createActor
      },
      mockLedger: {
        hasLedger: !!mockLedger.mock_cktestbtc_ledger,
        canisterId: mockLedger.canisterId,
        hasIdlFactory: !!mockLedger.idlFactory,
        hasCreateActor: !!mockLedger.createActor
      },
      mockMinter: {
        hasMinter: !!mockMinter.mock_cktestbtc_minter,
        canisterId: mockMinter.canisterId,
        hasIdlFactory: !!mockMinter.idlFactory,
        hasCreateActor: !!mockMinter.createActor
      }
    });

    // Create the Connect2IC client with all required canisters
    // NOTE: Connect2IC uses a different @dfinity/candid version requiring type workarounds
    const connect2icClient = createClient({
      canisters: {
        // Backend canister - handles custodial operations and wallet management
        backend: {
          canisterId: backend.canisterId,
          // @ts-expect-error: Connect2IC library type incompatibility with @dfinity/candid versions
          idlFactory: backend.idlFactory,
        },

        // ckTestBTC Ledger - handles balance queries and transfers
        ckTestBTCLedger: {
          canisterId: mockLedger.canisterId,
          // @ts-expect-error: Connect2IC library type incompatibility with @dfinity/candid versions
          idlFactory: mockLedger.idlFactory,
        },

        // ckTestBTC Minter - handles token minting (follows PRD minting matrix)
        ckTestBTCMinter: {
          canisterId: mockMinter.canisterId,
          // @ts-expect-error: Connect2IC library type incompatibility with @dfinity/candid versions
          idlFactory: mockMinter.idlFactory,
        },
      },
      providers: [
        new InternetIdentity(internetIdentityConfig),
        new NFID()
      ],
      globalProviderConfig: {
        dev: isDev,
        host: isDev ? 'http://localhost:4943' : 'https://ic0.app',
      }
    });

    console.log('Connect2IC client created successfully');
    return connect2icClient;
  } catch (error) {
    console.error('Failed to create Connect2IC client:', error);
    throw error;
  }
};

/**
 * Environment helper functions
 */
export const isLocalDevelopment = (): boolean => {
  return import.meta.env.DEV;
};

export const getEnvironmentInfo = () => {
  return {
    isDev: import.meta.env.DEV,
    mode: import.meta.env.MODE,
    internetIdentityCanisterId: import.meta.env.VITE_CANISTER_ID_INTERNET_IDENTITY,
  };
};