import { Principal } from '@dfinity/principal';
import { getBackend } from './backend.service';

interface CustodialServiceResult {
  success: boolean;
  data?: any;
  error?: string;
}

interface DepositResult {
  success: boolean;
  blockIndex?: string;
  error?: string;
}

interface WithdrawResult {
  success: boolean;
  blockIndex?: string;
  error?: string;
}

interface VirtualTransferResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

interface VirtualBalanceResult {
  success: boolean;
  balance?: string;
  error?: string;
}

/**
 * Get user's virtual balance in the custodial wallet
 */
export const getVirtualBalance = async (): Promise<VirtualBalanceResult> => {
  const backend = getBackend();
  if (!backend) {
    return { success: false, error: 'Backend not initialized' };
  }

  try {
    const result = await backend.get_virtual_balance_formatted();
    const balanceValue = result.toString();
    // Convert from smallest unit (satoshi-like) to ckTestBTC
    const formattedBalance = (Number(balanceValue) / 100000000).toFixed(8);
    return { success: true, balance: formattedBalance };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to load virtual balance' };
  }
};

/**
 * Deposit ckTestBTC from user's wallet to the custodial backend
 */
export const depositFunds = async (amount: string): Promise<DepositResult> => {
  const backend = getBackend();
  if (!backend) {
    return { success: false, error: 'Backend not initialized' };
  }

  try {
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


    const result = await backend.deposit_funds(BigInt(amountSatoshis));

    if ('Ok' in result) {
      const blockIndex = result.Ok.toString();
      return {
        success: true,
        blockIndex
      };
    } else {
      console.error('[Custodial Service] Deposit failed:', result.Err);
      return {
        success: false,
        error: String(result.Err)
      };
    }
  } catch (error: any) {
    console.error('[Custodial Service] Deposit error:', error);
    return { success: false, error: error.message || 'Deposit failed' };
  }
};

/**
 * Withdraw ckTestBTC from custodial backend to user's wallet
 */
export const withdrawFunds = async (amount: string): Promise<WithdrawResult> => {
  const backend = getBackend();
  if (!backend) {
    return { success: false, error: 'Backend not initialized' };
  }

  try {
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


    const result = await backend.withdraw_funds(BigInt(amountSatoshis));

    if ('Ok' in result) {
      const blockIndex = result.Ok.toString();
      return {
        success: true,
        blockIndex
      };
    } else {
      console.error('[Custodial Service] Withdrawal failed:', result.Err);
      return {
        success: false,
        error: String(result.Err)
      };
    }
  } catch (error: any) {
    console.error('[Custodial Service] Withdrawal error:', error);
    return { success: false, error: error.message || 'Withdrawal failed' };
  }
};

/**
 * Transfer virtual balance between users (instant, no on-chain transaction)
 */
export const virtualTransfer = async (
  recipientPrincipal: string,
  amount: string
): Promise<VirtualTransferResult> => {
  const backend = getBackend();
  if (!backend) {
    return { success: false, error: 'Backend not initialized' };
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


    const result = await backend.virtual_transfer(toPrincipal, BigInt(amountSatoshis));

    if ('Ok' in result) {
      const transactionId = result.Ok.toString();
      return {
        success: true,
        transactionId
      };
    } else {
      console.error('[Custodial Service] Virtual transfer failed:', result.Err);
      return {
        success: false,
        error: String(result.Err)
      };
    }
  } catch (error: any) {
    console.error('[Custodial Service] Virtual transfer error:', error);
    return { success: false, error: error.message || 'Virtual transfer failed' };
  }
};

/**
 * Get custodial transaction history
 */
export const getCustodialTransactionHistory = async (): Promise<CustodialServiceResult> => {
  const backend = getBackend();
  if (!backend) {
    return { success: false, error: 'Backend not initialized' };
  }

  try {
    if (!('get_custodial_transaction_history' in backend)) {
      console.warn('get_custodial_transaction_history method not implemented in backend');
      return {
        success: true,
        data: [], // Return empty array for now
      };
    }

    const transactions = await (backend as any).get_custodial_transaction_history();

    // Transform transactions to frontend format
    const formattedTransactions = transactions.map((tx: any) => ({
      id: Number(tx.id),
      type: tx.tx_type,
      fromUser: tx.from_user?.[0]?.toString() || null,
      toUser: tx.to_user?.[0]?.toString() || null,
      virtualAmount: tx.virtual_amount?.[0] ? (Number(tx.virtual_amount[0]) / 100000000).toFixed(8) : null,
      onChainAmount: tx.on_chain_amount?.[0] ? (Number(tx.on_chain_amount[0]) / 100000000).toFixed(8) : null,
      blockIndex: tx.block_index?.[0]?.toString() || null,
      status: tx.status,
      timestamp: Number(tx.timestamp),
    }));

    return {
      success: true,
      data: formattedTransactions,
    };
  } catch (error: any) {
    console.error('[Custodial Service] Failed to get transaction history:', error);
    return {
      success: false,
      error: error.message || 'Failed to get custodial transaction history',
    };
  }
};

/**
 * Get backend reserve status (solvency information)
 */
export const getReserveStatus = async (): Promise<CustodialServiceResult> => {
  const backend = getBackend();
  if (!backend) {
    return { success: false, error: 'Backend not initialized' };
  }

  try {
    if (!('get_reserve_status' in backend)) {
      console.warn('get_reserve_status method not implemented in backend');
      return {
        success: false,
        error: 'Reserve status functionality not yet implemented',
      };
    }

    const status = await (backend as any).get_reserve_status();

    return {
      success: true,
      data: {
        totalVirtualBalances: (Number(status.total_virtual_balances) / 100000000).toFixed(8),
        backendActualBalance: (Number(status.backend_actual_balance) / 100000000).toFixed(8),
        reserveRatio: status.reserve_ratio,
        isSolvent: status.is_solvent,
      },
    };
  } catch (error: any) {
    console.error('[Custodial Service] Failed to get reserve status:', error);
    return {
      success: false,
      error: error.message || 'Failed to get reserve status',
    };
  }
};