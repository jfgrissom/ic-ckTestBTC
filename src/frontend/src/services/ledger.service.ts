import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { getAuthClient } from './auth.service';
import { getNetworkConfig } from '@/types/backend.types';

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

type TransferResult =
  | { Ok: bigint }
  | { Err: TransferError };

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

// Candid interface for ckTestBTC ledger
const idlFactory = ({ IDL }: any) => {
  const Account = IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
  });

  const TransferArgs = IDL.Record({
    from_subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
    to: Account,
    amount: IDL.Nat,
    fee: IDL.Opt(IDL.Nat),
    memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
    created_at_time: IDL.Opt(IDL.Nat64),
  });

  const TransferError = IDL.Variant({
    BadFee: IDL.Record({ expected_fee: IDL.Nat }),
    BadBurn: IDL.Record({ min_burn_amount: IDL.Nat }),
    InsufficientFunds: IDL.Record({ balance: IDL.Nat }),
    TooOld: IDL.Null,
    CreatedInFuture: IDL.Record({ ledger_time: IDL.Nat64 }),
    Duplicate: IDL.Record({ duplicate_of: IDL.Nat }),
    TemporarilyUnavailable: IDL.Null,
    GenericError: IDL.Record({
      error_code: IDL.Nat,
      message: IDL.Text,
    }),
  });

  const TransferResult = IDL.Variant({
    Ok: IDL.Nat,
    Err: TransferError,
  });

  return IDL.Service({
    icrc1_balance_of: IDL.Func([Account], [IDL.Nat], ['query']),
    icrc1_transfer: IDL.Func([TransferArgs], [TransferResult], []),
    icrc1_fee: IDL.Func([], [IDL.Nat], ['query']),
  });
};

// Get the ledger canister ID based on environment
const getLedgerCanisterId = (): string => {
  const config = getNetworkConfig();
  if (config.network === 'local') {
    // Use mock ledger in local development
    return import.meta.env.VITE_LOCAL_MOCK_LEDGER_CANISTER_ID || 'umunu-kh777-77774-qaaca-cai';
  } else {
    // Use real ckTestBTC canister on IC
    return import.meta.env.VITE_IC_CKTESTBTC_CANISTER_ID || 'g4xu7-jiaaa-aaaan-aaaaq-cai';
  }
};

// Create ledger actor
const createLedgerActor = async () => {
  const authClient = getAuthClient();
  if (!authClient) {
    throw new Error('Auth client not initialized');
  }

  const identity = authClient.getIdentity();
  const config = getNetworkConfig();

  const agent = new HttpAgent({
    identity,
    host: config.host,
  });

  if (config.network === 'local') {
    await agent.fetchRootKey();
  }

  const canisterId = getLedgerCanisterId();
  console.log('[Ledger Service] Creating actor for canister:', canisterId);

  return Actor.createActor(idlFactory, {
    agent,
    canisterId,
  });
};

/**
 * Get balance directly from ledger
 */
export const getLedgerBalance = async (owner: Principal): Promise<{ success: boolean; balance?: string; error?: string }> => {
  try {
    const actor = await createLedgerActor();
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
  } catch (error: any) {
    console.error('[Ledger Service] Failed to get balance:', error);
    return { success: false, error: error.message || 'Failed to get balance' };
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
    const actor = await createLedgerActor();

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

    if ('Ok' in result) {
      const blockIndex = result.Ok.toString();
      console.log('[Ledger Service] Transfer successful, block index:', blockIndex);
      return { success: true, blockIndex };
    } else {
      const error = formatTransferError(result.Err);
      console.error('[Ledger Service] Transfer failed:', error);
      return { success: false, error };
    }
  } catch (error: any) {
    console.error('[Ledger Service] Transfer error:', error);
    return { success: false, error: error.message || 'Transfer failed' };
  }
};

/**
 * Get transfer fee from ledger
 */
export const getLedgerFee = async (): Promise<{ success: boolean; fee?: string; error?: string }> => {
  try {
    const actor = await createLedgerActor();
    const fee = await actor.icrc1_fee();
    const feeString = fee.toString();

    // Convert from satoshis to ckTestBTC
    const formattedFee = (Number(feeString) / 100000000).toFixed(8);

    console.log('[Ledger Service] Transfer fee:', formattedFee, 'ckTestBTC');
    return { success: true, fee: formattedFee };
  } catch (error: any) {
    console.error('[Ledger Service] Failed to get fee:', error);
    return { success: false, error: error.message || 'Failed to get fee' };
  }
};

// Helper to format transfer errors
const formatTransferError = (error: TransferError): string => {
  if ('BadFee' in error) {
    const expectedFee = (Number(error.BadFee.expected_fee) / 100000000).toFixed(8);
    return `Bad fee. Expected: ${expectedFee} ckTestBTC`;
  }
  if ('InsufficientFunds' in error) {
    const balance = (Number(error.InsufficientFunds.balance) / 100000000).toFixed(8);
    return `Insufficient funds. Balance: ${balance} ckTestBTC`;
  }
  if ('TooOld' in error) {
    return 'Transaction too old';
  }
  if ('CreatedInFuture' in error) {
    return 'Transaction created in future';
  }
  if ('Duplicate' in error) {
    return `Duplicate transaction. Original block: ${error.Duplicate.duplicate_of}`;
  }
  if ('TemporarilyUnavailable' in error) {
    return 'Service temporarily unavailable';
  }
  if ('GenericError' in error) {
    return error.GenericError.message;
  }
  return 'Unknown transfer error';
};