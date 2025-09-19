import { Principal } from '@dfinity/principal';
import { getBackend } from './backend.service';
// import { getAuthClient } from './auth.service'; // Currently unused
import { getNetworkConfig } from '@/types/backend.types';

/**
 * Get wallet balance
 */
export const getBalance = async (): Promise<{ success: boolean; balance?: string; error?: string }> => {
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
 * Now uses direct ledger transfer (ICRC-1 standard)
 */
export const transfer = async (
  recipientPrincipal: string,
  amount: string // Amount in ckTestBTC (decimal format like "0.5")
): Promise<{ success: boolean; blockIndex?: string; error?: string }> => {
  const backend = getBackend();
  if (!backend) {
    return { success: false, error: 'Backend service not available' };
  }

  try {
    const toPrincipal = Principal.fromText(recipientPrincipal);

    // Validate and convert ckTestBTC amount to satoshis
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return { success: false, error: 'Invalid amount. Please enter a valid positive number.' };
    }

    // Convert ckTestBTC amount to satoshis (multiply by 100,000,000)
    const amountSatoshis = Math.floor(numAmount * 100000000);

    if (amountSatoshis === 0) {
      return { success: false, error: 'Amount too small. Minimum amount is 0.00000001 ckTestBTC.' };
    }

    console.log('[Wallet Service] Initiating backend proxy transfer:', {
      recipient: recipientPrincipal,
      amountCkTestBTC: amount,
      amountSatoshis: amountSatoshis
    });

    // Debug: Check current balance before transfer
    try {
      const balanceResult = await backend.get_balance();
      console.log('[Wallet Service] Current backend balance before transfer:', balanceResult);
    } catch (balanceError) {
      console.warn('[Wallet Service] Could not check balance before transfer:', balanceError);
    }

    // Use backend proxy for transfer - backend handles transaction history
    const result = await backend.transfer(toPrincipal, BigInt(amountSatoshis));

    console.log('[Wallet Service] Transfer result from backend:', result);

    // Handle different possible result formats
    if (typeof result === 'object' && result !== null) {
      // Check for error response first
      if ('Err' in result) {
        console.error('[Wallet Service] Transfer failed with error:', result.Err);
        return {
          success: false,
          error: String(result.Err)
        };
      }

      // Handle success response
      if ('Ok' in result) {
        const blockIndex = String(result.Ok);
        console.log('[Wallet Service] Transfer successful, block index:', blockIndex);
        return {
          success: true,
          blockIndex
        };
      }

      // Handle other success formats
      if ('blockIndex' in result) {
        const blockIndex = String(result.blockIndex);
        console.log('[Wallet Service] Transfer successful, block index:', blockIndex);
        return {
          success: true,
          blockIndex
        };
      }

      if ('block_index' in result) {
        const blockIndex = String(result.block_index);
        console.log('[Wallet Service] Transfer successful, block index:', blockIndex);
        return {
          success: true,
          blockIndex
        };
      }

      // If it's an object but doesn't have expected fields, treat as error
      console.error('[Wallet Service] Unexpected result format:', result);
      return {
        success: false,
        error: `Unexpected response format: ${JSON.stringify(result)}`
      };
    } else {
      // If result is a primitive type (number, bigint, string), treat as block index
      const blockIndex = String(result);
      console.log('[Wallet Service] Transfer successful, block index:', blockIndex);
      return {
        success: true,
        blockIndex
      };
    }
  } catch (error: any) {
    console.error('[Wallet Service] Transfer error:', error);
    return { success: false, error: error.message || 'Transfer failed' };
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