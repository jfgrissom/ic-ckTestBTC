import { WalletAction } from './types';
import { getWalletStatus, getBtcAddress, transfer, useFaucet } from '@/services/wallet.service';
import { depositFunds } from '@/services/custodial-wallet.service';
import { getDepositAddress, withdrawTestBTC } from '@/services/deposit-withdrawal.service';
import { getTransactionHistory, getTransactionStats } from '@/services/transaction.service';
import { Principal } from '@dfinity/principal';

// Load initial wallet data when user is authenticated and backend is ready
export const loadInitialWalletData = async (dispatch: React.Dispatch<WalletAction>) => {
  console.log('[Actions] Starting initial wallet data load...');
  dispatch({ type: 'INITIALIZE_START' });

  try {
    // Load wallet status, BTC address, and transactions in parallel
    const results = await Promise.allSettled([
      loadWalletStatus(dispatch),
      loadBtcAddress(dispatch),
      loadTransactions(dispatch),
    ]);

    // Check if any critical operations failed
    const walletResult = results[0];
    const btcAddressResult = results[1];
    const transactionsResult = results[2];

    if (walletResult.status === 'rejected') {
      console.error('[Actions] Critical error: Wallet status load failed:', walletResult.reason);
      dispatch({
        type: 'INITIALIZE_ERROR',
        payload: `Failed to load wallet status: ${walletResult.reason?.message || 'Unknown error'}`
      });
      return;
    }

    // Log non-critical failures but don't fail initialization
    if (btcAddressResult.status === 'rejected') {
      console.warn('[Actions] Non-critical: BTC address load failed:', btcAddressResult.reason);
    }

    if (transactionsResult.status === 'rejected') {
      console.warn('[Actions] Non-critical: Transactions load failed:', transactionsResult.reason);
    }

    console.log('[Actions] Initial wallet data load completed successfully');
    dispatch({ type: 'INITIALIZE_SUCCESS' });

  } catch (error) {
    console.error('[Actions] Failed to load initial wallet data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
    dispatch({ type: 'INITIALIZE_ERROR', payload: errorMessage });
  }
};

// Load wallet status (balances)
export const loadWalletStatus = async (dispatch: React.Dispatch<WalletAction>) => {
  dispatch({ type: 'LOAD_WALLET_START' });

  try {
    const result = await getWalletStatus();

    if (result.success && result.status) {
      dispatch({ type: 'LOAD_WALLET_SUCCESS', payload: result.status });
    } else {
      dispatch({ type: 'LOAD_WALLET_ERROR', payload: result.error || 'Failed to load wallet status' });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load wallet status';
    dispatch({ type: 'LOAD_WALLET_ERROR', payload: errorMessage });
  }
};

// Load BTC address
export const loadBtcAddress = async (dispatch: React.Dispatch<WalletAction>) => {
  try {
    const result = await getBtcAddress();

    if (result.success && result.address) {
      dispatch({ type: 'SET_BTC_ADDRESS', payload: result.address });
    } else {
      console.error('Error getting BTC address:', result.error);
    }
  } catch (error) {
    console.error('Failed to load BTC address:', error);
  }
};

// Load transaction history
export const loadTransactions = async (dispatch: React.Dispatch<WalletAction>) => {
  dispatch({ type: 'LOAD_TRANSACTIONS_START' });

  try {
    const result = await getTransactionHistory();

    if (result.success && result.data) {
      const stats = getTransactionStats(result.data);
      dispatch({
        type: 'LOAD_TRANSACTIONS_SUCCESS',
        payload: {
          transactions: result.data,
          stats
        }
      });
    } else {
      dispatch({ type: 'LOAD_TRANSACTIONS_ERROR', payload: result.error || 'Failed to load transactions' });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load transactions';
    dispatch({ type: 'LOAD_TRANSACTIONS_ERROR', payload: errorMessage });
  }
};

// Refresh wallet data
export const refreshWalletData = async (dispatch: React.Dispatch<WalletAction>) => {
  await loadWalletStatus(dispatch);
};

// Refresh transaction data
export const refreshTransactionData = async (dispatch: React.Dispatch<WalletAction>) => {
  await loadTransactions(dispatch);
};

// Refresh all data
export const refreshAllData = async (dispatch: React.Dispatch<WalletAction>) => {
  await Promise.all([
    loadWalletStatus(dispatch),
    loadTransactions(dispatch),
  ]);
};

// Transfer tokens (handles both personal and custodial)
export const transferTokens = async (
  dispatch: React.Dispatch<WalletAction>,
  recipient: string,
  amount: string,
  usePersonalFunds: boolean = true
) => {
  dispatch({ type: 'START_OPERATION' });

  try {
    const result = await transfer(recipient, amount, !usePersonalFunds);

    if (result.success) {
      dispatch({ type: 'OPERATION_SUCCESS' });
      // Refresh wallet status and transactions after successful transfer
      await Promise.all([
        loadWalletStatus(dispatch),
        loadTransactions(dispatch),
      ]);
      return { success: true, blockIndex: result.blockIndex, method: result.method };
    } else {
      dispatch({ type: 'OPERATION_ERROR', payload: result.error || 'Transfer failed' });
      return { success: false, error: result.error, method: result.method };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Transfer failed';
    dispatch({ type: 'OPERATION_ERROR', payload: errorMessage });
    return { success: false, error: errorMessage };
  }
};

// Use faucet to get test tokens
export const useFaucetTokens = async (dispatch: React.Dispatch<WalletAction>) => {
  dispatch({ type: 'START_OPERATION' });

  try {
    const result = await useFaucet();

    if (result.success) {
      dispatch({ type: 'OPERATION_SUCCESS' });
      // Refresh wallet status and transactions after successful faucet
      await Promise.all([
        loadWalletStatus(dispatch),
        loadTransactions(dispatch),
      ]);
      return { success: true, message: result.message };
    } else {
      dispatch({ type: 'OPERATION_ERROR', payload: result.error || 'Faucet failed' });
      return { success: false, error: result.error };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Faucet failed';
    dispatch({ type: 'OPERATION_ERROR', payload: errorMessage });
    return { success: false, error: errorMessage };
  }
};

// Deposit personal funds to custody
export const depositToCustody = async (
  dispatch: React.Dispatch<WalletAction>,
  amount: string,
  userPrincipal: Principal
) => {
  dispatch({ type: 'START_OPERATION' });

  try {
    const result = await depositFunds(amount, userPrincipal);

    if (result.success) {
      dispatch({ type: 'OPERATION_SUCCESS' });
      // Refresh wallet status and transactions after successful deposit
      await Promise.all([
        loadWalletStatus(dispatch),
        loadTransactions(dispatch),
      ]);
      return { success: true, receipt: result.receipt, blockIndex: result.blockIndex };
    } else {
      dispatch({ type: 'OPERATION_ERROR', payload: result.error || 'Deposit failed' });
      return { success: false, error: result.error };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Deposit failed';
    dispatch({ type: 'OPERATION_ERROR', payload: errorMessage });
    return { success: false, error: errorMessage };
  }
};

// Get deposit address for Bitcoin TestNet
export const getDepositAddressAction = async (dispatch: React.Dispatch<WalletAction>) => {
  dispatch({ type: 'START_OPERATION' });

  try {
    const result = await getDepositAddress();

    if (result.success && result.data) {
      dispatch({ type: 'SET_DEPOSIT_ADDRESS', payload: result.data });
      dispatch({ type: 'OPERATION_SUCCESS' });
      return { success: true, address: result.data };
    } else {
      dispatch({ type: 'OPERATION_ERROR', payload: result.error || 'Failed to get deposit address' });
      return { success: false, error: result.error };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get deposit address';
    dispatch({ type: 'OPERATION_ERROR', payload: errorMessage });
    return { success: false, error: errorMessage };
  }
};

// Withdraw TestBTC to Bitcoin address
export const withdrawTokens = async (
  dispatch: React.Dispatch<WalletAction>,
  address: string,
  amount: string
) => {
  dispatch({ type: 'START_OPERATION' });

  try {
    const result = await withdrawTestBTC(address, amount);

    if (result.success) {
      dispatch({ type: 'OPERATION_SUCCESS' });
      // Refresh wallet status and transactions after successful withdrawal
      await Promise.all([
        loadWalletStatus(dispatch),
        loadTransactions(dispatch),
      ]);
      return { success: true, message: result.message };
    } else {
      dispatch({ type: 'OPERATION_ERROR', payload: result.error || 'Withdrawal failed' });
      return { success: false, error: result.error };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Withdrawal failed';
    dispatch({ type: 'OPERATION_ERROR', payload: errorMessage });
    return { success: false, error: errorMessage };
  }
};

// Clear all errors
export const clearErrors = (dispatch: React.Dispatch<WalletAction>) => {
  dispatch({ type: 'CLEAR_ERRORS' });
};