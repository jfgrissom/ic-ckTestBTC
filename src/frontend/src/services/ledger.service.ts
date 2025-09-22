import { Principal } from '@dfinity/principal';

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

// Global state for Connect2IC ledger actor
let connectLedgerActor: LedgerActor | null = null;

/**
 * Set the Connect2IC ledger actor (called by App.tsx when actor is available)
 */
export const setConnectLedgerActor = (actor: unknown): void => {
  // Handle null case when clearing the actor
  if (actor === null) {
    console.log('[Ledger Service] Clearing Connect2IC ledger actor');
    connectLedgerActor = null;
    return;
  }

  // Type guard to ensure actor has required ICRC-1 methods
  if (isValidLedgerActor(actor)) {
    console.log('[Ledger Service] Setting Connect2IC ledger actor');
    connectLedgerActor = actor;
  } else {
    console.error('[Ledger Service] Invalid ledger actor: missing required ICRC-1 methods');
    connectLedgerActor = null;
    throw new Error('Invalid ledger actor: missing required ICRC-1 methods');
  }
};

/**
 * Get current Connect2IC ledger actor
 */
export const getConnectLedgerActor = (): LedgerActor | null => {
  return connectLedgerActor;
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
 * Clear Connect2IC ledger actor
 */
export const clearConnectLedgerActor = (): void => {
  connectLedgerActor = null;
};



/**
 * Get ledger actor - uses Connect2IC actor only
 */
const getLedgerActor = (): LedgerActor => {
  if (!connectLedgerActor) {
    throw new Error('Connect2IC ledger actor not initialized. Please reconnect your wallet.');
  }

  console.log('[Ledger Service] Using Connect2IC actor');
  return connectLedgerActor;
};

/**
 * Get balance directly from ledger
 */
export const getLedgerBalance = async (owner: Principal): Promise<{ success: boolean; balance?: string; error?: string }> => {
  try {
    const actor = getLedgerActor();
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
    const actor = getLedgerActor();

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
    const actor = getLedgerActor();
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