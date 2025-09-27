import { Principal } from '@dfinity/principal';
import { createAuthenticatedActor, updateActorIdentity } from '@/services/actor.service';
import { getIdentity } from '@/services/auth.service';
import { idlFactory } from 'declarations/mock_cktestbtc_ledger';
import { canisterId } from 'declarations/mock_cktestbtc_ledger';
import { Identity } from '@dfinity/agent';

// ICRC-1 Token Standard types
interface Account {
  owner: Principal;
  subaccount?: [] | [Uint8Array];
}

interface TransferArgs {
  from_subaccount?: [] | [Uint8Array];
  to: Account;
  amount: bigint;
  fee?: [] | [bigint];
  memo?: [] | [Uint8Array];
  created_at_time?: [] | [bigint];
}

interface TransferResult {
  Ok?: bigint;
  Err?: TransferError;
}

// Proper interface for ICRC-1 ledger actor
interface LedgerActor {
  icrc1_balance_of(account: Account): Promise<bigint>;
  icrc1_transfer(args: TransferArgs): Promise<TransferResult>;
  icrc1_fee(): Promise<bigint>;
}

interface TransferError {
  BadFee?: { expected_fee: bigint };
  BadBurn?: { min_burn_amount: bigint };
  InsufficientFunds?: { balance: bigint };
  TooOld?: null;
  CreatedInFuture?: { ledger_time: bigint };
  Duplicate?: { duplicate_of: bigint };
  TemporarilyUnavailable?: null;
  GenericError?: { error_code: bigint; message: string };
}

// Module-level state for ledger actor (functional paradigm)
let ledgerActor: LedgerActor | null = null;

/**
 * Initialize or update ledger actor with current identity
 * Creates a new authenticated actor for ledger communication
 */
export const initializeLedgerActor = async (): Promise<void> => {
  const identity = getIdentity();
  if (!identity) {
    console.log('[LedgerService] No identity available for ledger actor');
    ledgerActor = null;
    return;
  }

  try {
    ledgerActor = await createAuthenticatedActor<LedgerActor>(
      canisterId,
      idlFactory,
      identity
    );
    console.log('[LedgerService] Ledger actor initialized with principal:',
      identity.getPrincipal().toString());
  } catch (error) {
    console.error('[LedgerService] Failed to initialize ledger actor:', error);
    ledgerActor = null;
  }
};

/**
 * Update ledger actor with new identity
 * Called when user authentication changes
 */
export const updateLedgerActor = async (identity: Identity | null): Promise<void> => {
  if (!identity) {
    console.log('[LedgerService] Clearing ledger actor (no identity)');
    ledgerActor = null;
    return;
  }

  try {
    ledgerActor = await updateActorIdentity<LedgerActor>(
      canisterId,
      idlFactory,
      identity
    );
    console.log('[LedgerService] Ledger actor updated with principal:',
      identity.getPrincipal().toString());
  } catch (error) {
    console.error('[LedgerService] Failed to update ledger actor:', error);
    ledgerActor = null;
  }
};

/**
 * Set the Connect2IC ledger actor (for compatibility)
 * @deprecated Use initializeLedgerActor() or updateLedgerActor() instead
 */
export const setConnectLedgerActor = (actor: unknown): void => {
  console.warn('[LedgerService] setConnectLedgerActor is deprecated. Use initializeLedgerActor() instead.');
  // Handle null case when clearing the actor
  if (actor === null) {
    console.log('[Ledger Service] Clearing ledger actor');
    ledgerActor = null;
    return;
  }

  // Type guard to ensure actor has required ICRC-1 methods
  if (isValidLedgerActor(actor)) {
    console.log('[Ledger Service] Setting ledger actor');
    ledgerActor = actor;
  } else {
    console.error('[Ledger Service] Invalid ledger actor: missing required ICRC-1 methods');
    ledgerActor = null;
    throw new Error('Invalid ledger actor: missing required ICRC-1 methods');
  }
};

/**
 * Get current ledger actor
 * @deprecated Use getLedgerActor() instead
 */
export const getConnectLedgerActor = (): LedgerActor | null => {
  return ledgerActor;
};

/**
 * Type guard to validate ledger actor interface
 */
const isValidLedgerActor = (actor: unknown): actor is LedgerActor => {
  if (!actor || typeof actor !== 'object') {
    return false;
  }

  const requiredMethods = ['icrc1_balance_of', 'icrc1_transfer', 'icrc1_fee'];
  return requiredMethods.every(method =>
    method in actor && typeof (actor as Record<string, unknown>)[method] === 'function'
  );
};

/**
 * Clear ledger actor
 */
export const clearConnectLedgerActor = (): void => {
  ledgerActor = null;
};



/**
 * Get ledger actor - attempts to initialize if not available
 */
const getLedgerActor = async (): Promise<LedgerActor> => {
  if (!ledgerActor) {
    // Try to initialize if we have an identity
    await initializeLedgerActor();

    if (!ledgerActor) {
      throw new Error('Ledger actor not initialized. Please reconnect your wallet.');
    }
  }

  console.log('[Ledger Service] Using authenticated ledger actor');
  return ledgerActor;
};

/**
 * Get ledger actor synchronously - returns null if not initialized
 */
const getLedgerActorSync = (): LedgerActor | null => {
  return ledgerActor;
};

/**
 * Get balance directly from ledger
 */
export const getLedgerBalance = async (owner: Principal): Promise<{ success: boolean; balance?: string; error?: string }> => {
  try {
    const actor = await getLedgerActor();
    const account: Account = {
      owner,
      subaccount: [], // Use empty array for None in Candid optional
    };

    const balance = await actor.icrc1_balance_of(account);
    const balanceString = balance.toString();

    // Convert from satoshis to ckTestBTC
    const formattedBalance = (Number(balanceString) / 100000000).toFixed(8);

    console.log('[Ledger Service] Balance for', owner.toString(), ':', formattedBalance, 'ckTestBTC');
    return { success: true, balance: formattedBalance };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get balance';
    console.error('[Ledger Service] Failed to get balance:', error);
    return { success: false, error: errorMessage };
  }
};

/**
 * Transfer tokens directly via ledger
 */
export const transferViaLedger = async (
  to: Principal,
  amount: string // Amount in ckTestBTC
): Promise<{ success: boolean; blockIndex?: string; error?: string }> => {
  try {
    const actor = await getLedgerActor();

    // Convert ckTestBTC to satoshis
    const amountBigInt = BigInt(Math.floor(Number(amount) * 100000000));

    const transferArgs: TransferArgs = {
      from_subaccount: [], // Use empty array for None in Candid optional
      to: {
        owner: to,
        subaccount: [], // Use empty array for None in Candid optional
      },
      amount: amountBigInt,
      fee: [BigInt(10)], // Use array for Some(value) in Candid optional
      memo: [], // Use empty array for None in Candid optional
      created_at_time: [BigInt(Date.now() * 1000000)], // Use array for Some(value) in Candid optional
    };

    console.log('[Ledger Service] Transferring:', {
      to: to.toString(),
      amount: amount + ' ckTestBTC',
      amountSatoshis: amountBigInt.toString(),
    });

    const result = await actor.icrc1_transfer(transferArgs);

    if ('Ok' in result && result.Ok !== undefined) {
      const blockIndex = result.Ok.toString();
      console.log('[Ledger Service] Transfer successful, block index:', blockIndex);
      return { success: true, blockIndex };
    } else if ('Err' in result && result.Err !== undefined) {
      const error = formatTransferError(result.Err);
      console.error('[Ledger Service] Transfer failed:', error);
      return { success: false, error };
    } else {
      console.error('[Ledger Service] Transfer failed: Unknown error');
      return { success: false, error: 'Unknown transfer error' };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Transfer failed';
    console.error('[Ledger Service] Transfer error:', error);
    return { success: false, error: errorMessage };
  }
};

/**
 * Get transfer fee from ledger
 */
export const getLedgerFee = async (): Promise<{ success: boolean; fee?: string; error?: string }> => {
  try {
    const actor = await getLedgerActor();
    const fee = await actor.icrc1_fee();
    const feeString = fee.toString();

    // Convert from satoshis to ckTestBTC
    const formattedFee = (Number(feeString) / 100000000).toFixed(8);

    console.log('[Ledger Service] Transfer fee:', formattedFee, 'ckTestBTC');
    return { success: true, fee: formattedFee };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get fee';
    console.error('[Ledger Service] Failed to get fee:', error);
    return { success: false, error: errorMessage };
  }
};

// Helper to format transfer errors
const formatTransferError = (error: TransferError): string => {
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