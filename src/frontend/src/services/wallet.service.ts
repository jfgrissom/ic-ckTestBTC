import { Principal } from '@dfinity/principal';
import { getBackend } from './backend.service';
// import { getAuthClient } from './auth.service'; // Currently unused
import { getNetworkConfig } from '@/types/backend.types';
import { getVirtualBalance as getCustodialBalance, virtualTransfer } from './custodial-wallet.service';

/**
 * Get wallet balance
 * Now supports both virtual balance (custodial) and traditional balance
 */
export const getBalance = async (useVirtualBalance: boolean = true): Promise<{ success: boolean; balance?: string; error?: string }> => {
  // For custodial wallet, use virtual balance
  if (useVirtualBalance) {
    try {
      const virtualResult = await getCustodialBalance();
      if (virtualResult.success) {
        return { success: true, balance: virtualResult.balance };
      }
      // If virtual balance fails, fall back to traditional balance
      console.warn('[Wallet Service] Virtual balance failed, falling back to traditional balance:', virtualResult.error);
    } catch (error) {
      console.warn('[Wallet Service] Virtual balance error, falling back to traditional balance:', error);
    }
  }

  // Traditional balance (direct from ckTestBTC ledger)
  const backend = getBackend();
  if (!backend) {
    return { success: false, error: 'Backend not initialized' };
  }

  try {
    const result = await backend.get_balance();
    if ('Ok' in result) {
      const balanceValue = result.Ok.toString();
      // Convert from smallest unit (satoshi-like) to ckTestBTC
      const formattedBalance = (Number(balanceValue) / 100000000).toFixed(8);
      return { success: true, balance: formattedBalance };
    } else {
      return { success: false, error: result.Err };
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to load balance' };
  }
};

/**
 * Get Bitcoin testnet address
 */
export const getBtcAddress = async (): Promise<{ success: boolean; address?: string; error?: string }> => {
  const backend = getBackend();
  if (!backend) {
    return { success: false, error: 'Backend not initialized' };
  }

  try {
    const result = await backend.get_btc_address();
    if ('Ok' in result) {
      return { success: true, address: result.Ok };
    } else {
      return { success: false, error: result.Err };
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to load BTC address' };
  }
};

/**
 * Transfer ckTestBTC to another principal
 * Uses custodial virtual transfer for instant transfers
 */
export const transfer = async (
  recipientPrincipal: string,
  amount: string // Amount in ckTestBTC (decimal format like "0.5")
): Promise<{ success: boolean; blockIndex?: string; error?: string }> => {
  try {
    // Validate principal format
    Principal.fromText(recipientPrincipal);

    // Use custodial virtual transfer for instant transfers
    const result = await virtualTransfer(recipientPrincipal, amount);

    if (result.success) {
      return {
        success: true,
        blockIndex: result.transactionId // Virtual transfers use transaction ID instead of block index
      };
    } else {
      return {
        success: false,
        error: result.error
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Transfer failed'
    };
  }
};

/**
 * Use faucet to get test tokens (local development only)
 */
export const useFaucet = async (): Promise<{ success: boolean; message?: string; error?: string }> => {
  const backend = getBackend();
  const config = getNetworkConfig();
  
  if (!backend) {
    return { success: false, error: 'Backend not initialized' };
  }

  if (config.network !== 'local') {
    return { success: false, error: 'Faucet only available in local development' };
  }

  try {
    const result = await backend.faucet();
    if ('Ok' in result) {
      return { success: true, message: result.Ok };
    } else {
      return { success: false, error: result.Err };
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to get test tokens' };
  }
};