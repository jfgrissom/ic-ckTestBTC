import { Principal } from '@dfinity/principal';
import { getBackend } from './backend.service';
// import { getAuthClient } from './auth.service'; // Currently unused
import { getNetworkConfig } from '@/types/backend.types';
import { getVirtualBalance as getCustodialBalance } from './custodial-wallet.service';

// Interface for comprehensive wallet status
export interface WalletStatus {
  custodialBalance: string;  // Formatted balance in custody
  personalBalance: string;   // Formatted balance in personal account
  totalAvailable: string;    // Total of both balances
  canDeposit: boolean;       // True if personal balance > 0
}

/**
 * Get comprehensive wallet status showing both custodial and personal balances
 */
export const getWalletStatus = async (): Promise<{ success: boolean; status?: WalletStatus; error?: string }> => {
  const backend = getBackend();
  if (!backend) {
    return { success: false, error: 'Backend not initialized' };
  }

  try {
    const result = await backend.get_wallet_status();
    if ('Ok' in result) {
      const status = result.Ok;

      // Convert from smallest units to formatted values
      const custodialBalance = (Number(status.custodial_balance.toString()) / 100000000).toFixed(8);
      const personalBalance = (Number(status.personal_balance.toString()) / 100000000).toFixed(8);
      const totalAvailable = (Number(status.total_available.toString()) / 100000000).toFixed(8);

      return {
        success: true,
        status: {
          custodialBalance,
          personalBalance,
          totalAvailable,
          canDeposit: status.can_deposit
        }
      };
    } else {
      return { success: false, error: result.Err };
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to get wallet status' };
  }
};

/**
 * Deposit personal funds into custody
 */
export const depositToCustody = async (amount: string): Promise<{ success: boolean; receipt?: any; error?: string }> => {
  const backend = getBackend();
  if (!backend) {
    return { success: false, error: 'Backend not initialized' };
  }

  try {
    // Convert amount to smallest units (satoshis)
    const amountInSatoshis = Math.floor(Number(amount) * 100000000);

    const result = await backend.deposit_to_custody(BigInt(amountInSatoshis));
    if ('Ok' in result) {
      const receipt = result.Ok;
      return {
        success: true,
        receipt: {
          blockIndex: receipt.block_index.toString(),
          amountDeposited: (Number(receipt.amount_deposited.toString()) / 100000000).toFixed(8),
          newCustodialBalance: (Number(receipt.new_custodial_balance.toString()) / 100000000).toFixed(8),
          remainingPersonalBalance: (Number(receipt.remaining_personal_balance.toString()) / 100000000).toFixed(8)
        }
      };
    } else {
      return { success: false, error: result.Err };
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to deposit to custody' };
  }
};

/**
 * Get wallet balance - now uses custodial balance from wallet status
 * Keeping for backward compatibility
 */
export const getBalance = async (useVirtualBalance: boolean = true): Promise<{ success: boolean; balance?: string; error?: string }> => {
  // Get comprehensive wallet status
  const statusResult = await getWalletStatus();

  if (statusResult.success && statusResult.status) {
    // Return custodial balance as the primary balance
    return { success: true, balance: statusResult.status.custodialBalance };
  }

  // Fallback to old method if status fails
  if (useVirtualBalance) {
    try {
      const virtualResult = await getCustodialBalance();
      if (virtualResult.success) {
        return { success: true, balance: virtualResult.balance };
      }
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
 * Uses direct backend transfer to ckTestBTC ledger for real transactions
 */
export const transfer = async (
  recipientPrincipal: string,
  amount: string // Amount in ckTestBTC (decimal format like "0.5")
): Promise<{ success: boolean; blockIndex?: string; error?: string }> => {
  const backend = getBackend();
  if (!backend) {
    return { success: false, error: 'Backend not initialized' };
  }

  try {
    // Validate principal format
    Principal.fromText(recipientPrincipal);

    // Convert amount to smallest units (satoshis)
    const amountInSatoshis = Math.floor(Number(amount) * 100000000);

    // Use backend's direct transfer function for real ckTestBTC transactions
    const result = await backend.transfer(
      Principal.fromText(recipientPrincipal),
      BigInt(amountInSatoshis)
    );

    if ('Ok' in result) {
      return {
        success: true,
        blockIndex: result.Ok.toString()
      };
    } else {
      return {
        success: false,
        error: result.Err
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