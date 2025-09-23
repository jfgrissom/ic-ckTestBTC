import { Principal } from '@dfinity/principal';
import { getBackend } from './backend.service';
import { getConnectLedgerActor } from './ledger.service';
import * as backend from 'declarations/backend';

interface CustodialServiceResult {
  success: boolean;
  data?: any;
  error?: string;
}

interface DepositResult {
  success: boolean;
  blockIndex?: string;
  error?: string;
  receipt?: {
    blockIndex: string;
    amountDeposited: string;
    newCustodialBalance: string;
    remainingPersonalBalance: string;
  };
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
 * Generate the same deterministic subaccount as the backend
 * Must match the backend's generate_subaccount_for_user function
 */
const generateSubaccountForUser = async (userPrincipal: Principal): Promise<Uint8Array> => {
  // Get user principal bytes
  const principalBytes = userPrincipal.toUint8Array();
  const salt = new TextEncoder().encode('ckTestBTC_custodial_account');

  // Combine principal bytes + salt
  const combined = new Uint8Array(principalBytes.length + salt.length);
  combined.set(principalBytes, 0);
  combined.set(salt, principalBytes.length);

  // Hash with SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
  return new Uint8Array(hashBuffer);
};

/**
 * Transfer tokens to custodial account (backend canister + user subaccount)
 */
const transferToCustodialAccount = async (
  backendPrincipal: Principal,
  userSubaccount: Uint8Array,
  amount: string
): Promise<{ success: boolean; blockIndex?: string; error?: string }> => {
  try {
    const ledgerActor = getConnectLedgerActor();
    if (!ledgerActor) {
      throw new Error('Ledger actor not initialized. Please reconnect your wallet.');
    }

    // Convert ckTestBTC to satoshis
    const amountBigInt = BigInt(Math.floor(Number(amount) * 100000000));

    // ICRC-1 transfer arguments with subaccount
    const transferArgs = {
      from_subaccount: [] as [] | [Uint8Array], // User's default account (empty array for None)
      to: {
        owner: backendPrincipal,
        subaccount: [userSubaccount] as [] | [Uint8Array], // Array for Some(subaccount)
      },
      amount: amountBigInt,
      fee: [BigInt(10)] as [] | [bigint], // 10 satoshi fee
      memo: [] as [],
      created_at_time: [BigInt(Date.now() * 1000000)] as [] | [bigint],
    };

    console.log('[Custodial Service] Calling icrc1_transfer with args:', {
      to_owner: backendPrincipal.toString(),
      to_subaccount: Array.from(userSubaccount).map(b => b.toString(16).padStart(2, '0')).join(''),
      amount: amount + ' ckTestBTC',
      amountSatoshis: amountBigInt.toString(),
    });

    const result = await ledgerActor.icrc1_transfer(transferArgs);

    if ('Ok' in result && result.Ok !== undefined) {
      const blockIndex = result.Ok.toString();
      console.log('[Custodial Service] Transfer successful, block index:', blockIndex);
      return { success: true, blockIndex };
    } else if ('Err' in result && result.Err !== undefined) {
      const error = formatTransferError(result.Err);
      console.error('[Custodial Service] Transfer failed:', error);
      return { success: false, error };
    } else {
      console.error('[Custodial Service] Transfer failed: Unknown error');
      return { success: false, error: 'Unknown transfer error' };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Transfer failed';
    console.error('[Custodial Service] Transfer error:', error);
    return { success: false, error: errorMessage };
  }
};

// Helper to format transfer errors (copied from ledger.service.ts)
const formatTransferError = (error: any): string => {
  if ('BadFee' in error && error.BadFee) {
    const expectedFee = (Number(error.BadFee.expected_fee) / 100000000).toFixed(8);
    return `Bad fee. Expected: ${expectedFee} ckTestBTC`;
  }
  if ('InsufficientFunds' in error && error.InsufficientFunds) {
    const balance = (Number(error.InsufficientFunds.balance) / 100000000).toFixed(8);
    return `Insufficient funds. Balance: ${balance} ckTestBTC`;
  }
  if ('TooOld' in error) {
    return 'Transaction too old';
  }
  if ('CreatedInFuture' in error) {
    return 'Transaction created in future';
  }
  if ('Duplicate' in error && error.Duplicate) {
    return `Duplicate transaction. Original block: ${error.Duplicate.duplicate_of}`;
  }
  if ('TemporarilyUnavailable' in error) {
    return 'Service temporarily unavailable';
  }
  if ('GenericError' in error && error.GenericError) {
    return error.GenericError.message;
  }
  return 'Unknown transfer error';
};

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
 * Uses direct ledger transfer (PRD compliant Row 2 pattern)
 */
export const depositFunds = async (amount: string, userPrincipal: Principal): Promise<DepositResult> => {
  const backendActor = getBackend();
  if (!backendActor) {
    return { success: false, error: 'Backend not initialized' };
  }

  try {
    // Validate and convert ckTestBTC amount
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return { success: false, error: 'Invalid amount. Please enter a valid positive number.' };
    }

    if (numAmount < 0.00000001) {
      return { success: false, error: 'Amount too small. Minimum amount is 0.00000001 ckTestBTC.' };
    }

    console.log('[Custodial Service] Starting direct ledger deposit:', {
      amount: amount + ' ckTestBTC',
      userPrincipal: userPrincipal.toString(),
      backendCanisterId: backend.canisterId
    });

    // Generate the same subaccount as backend
    const userSubaccount = await generateSubaccountForUser(userPrincipal);
    console.log('[Custodial Service] Generated subaccount:', Array.from(userSubaccount).map(b => b.toString(16).padStart(2, '0')).join(''));

    // Create backend custodial account (backend canister + user subaccount)
    const backendPrincipal = Principal.fromText(backend.canisterId);

    // Step 1: Direct ledger transfer from user to backend custodial subaccount
    const transferResult = await transferToCustodialAccount(backendPrincipal, userSubaccount, amount);

    if (!transferResult.success) {
      console.error('[Custodial Service] Ledger transfer failed:', transferResult.error);
      return {
        success: false,
        error: transferResult.error || 'Transfer to custodial account failed'
      };
    }

    console.log('[Custodial Service] Ledger transfer successful, block:', transferResult.blockIndex);

    // Step 2: Notify backend to update custodial balance tracking
    try {
      // Convert amount and block index to satoshis and Nat for backend call
      const amountSatoshis = Math.floor(numAmount * 100000000);
      const blockIndexNat = BigInt(transferResult.blockIndex!);

      console.log('[Custodial Service] Notifying backend of deposit:', {
        blockIndex: transferResult.blockIndex,
        amountSatoshis: amountSatoshis
      });

      const backendResult = await backendActor.notify_deposit(blockIndexNat, BigInt(amountSatoshis));

      if ('Ok' in backendResult) {
        const receipt = backendResult.Ok;
        console.log('[Custodial Service] Backend balance tracking updated successfully');
        return {
          success: true,
          blockIndex: transferResult.blockIndex,
          receipt: {
            blockIndex: receipt.block_index.toString(),
            amountDeposited: (Number(receipt.amount_deposited.toString()) / 100000000).toFixed(8),
            newCustodialBalance: (Number(receipt.new_custodial_balance.toString()) / 100000000).toFixed(8),
            remainingPersonalBalance: (Number(receipt.remaining_personal_balance.toString()) / 100000000).toFixed(8)
          }
        };
      } else {
        console.warn('[Custodial Service] Transfer succeeded but backend balance tracking failed:', backendResult.Err);
        // The transfer already happened, so we consider this a success
        // but warn about the balance tracking issue
        return {
          success: true,
          blockIndex: transferResult.blockIndex
        };
      }
    } catch (backendError) {
      console.warn('[Custodial Service] Transfer succeeded but backend notification failed:', backendError);
      // The transfer already happened, so we consider this a success
      return {
        success: true,
        blockIndex: transferResult.blockIndex
      };
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Deposit failed';
    console.error('[Custodial Service] Deposit error:', error);
    return { success: false, error: errorMessage };
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