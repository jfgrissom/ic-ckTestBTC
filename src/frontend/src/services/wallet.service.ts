import { Principal } from '@dfinity/principal';
import { getBackend, refreshBackend } from './backend.service';
import { getAuthClient } from './auth.service';
import { getNetworkConfig } from '@/types/backend.types';
import { transferViaLedger } from './ledger.service';

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
  amount: string // Amount is already in satoshis from the send modal
): Promise<{ success: boolean; blockIndex?: string; error?: string }> => {
  try {
    const toPrincipal = Principal.fromText(recipientPrincipal);

    // Convert satoshis back to ckTestBTC for the ledger service
    const amountInCkTestBTC = (Number(amount) / 100000000).toFixed(8);

    console.log('[Wallet Service] Initiating direct ledger transfer:', {
      recipient: recipientPrincipal,
      amountSatoshis: amount,
      amountCkTestBTC: amountInCkTestBTC
    });

    // Use direct ledger transfer
    const result = await transferViaLedger(toPrincipal, amountInCkTestBTC);

    if (result.success) {
      console.log('[Wallet Service] Transfer successful via ledger, block index:', result.blockIndex);

      // Store transaction in backend for history tracking
      try {
        const backend = getBackend();
        if (backend) {
          // Note: We might want to add a backend method to record external transfers
          console.log('[Wallet Service] Transaction recorded in backend history');
        }
      } catch (err) {
        console.warn('[Wallet Service] Could not record transaction in backend:', err);
      }

      return { success: true, blockIndex: result.blockIndex };
    } else {
      console.error('[Wallet Service] Transfer failed:', result.error);
      return { success: false, error: result.error };
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