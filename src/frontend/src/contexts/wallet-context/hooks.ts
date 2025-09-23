import { useMemo } from 'react';
import { Principal } from '@dfinity/principal';
import { useConnect } from '@connect2ic/react';
import { useWalletContext } from './index';
import { TransferCapabilities, DepositWithdrawalCapabilities } from './types';
import {
  refreshWalletData,
  refreshTransactionData,
  refreshAllData,
  transferTokens,
  useFaucetTokens,
  depositToCustody,
  getDepositAddressAction,
  withdrawTokens,
  clearErrors,
} from './actions';
import {
  validatePrincipalAddress,
  validateAndConvertAmount,
  validateForm,
  calculateMaxAvailable,
  TokenType,
  FormValidationRule,
  FormValidationResult
} from '@/lib';

// Basic state access hook
export const useWalletState = () => {
  const { state } = useWalletContext();
  return {
    isAuthenticated: state.isAuthenticated,
    principal: state.principal,
    backendReady: state.backendReady,
    walletStatus: state.walletStatus,
    btcAddress: state.btcAddress,
    depositAddress: state.depositAddress,
    loading: state.loading,
    errors: state.errors,
    initialized: state.initialized,
  };
};

// Basic actions hook
export const useWalletActions = () => {
  const { dispatch } = useWalletContext();

  return useMemo(() => ({
    refreshWallet: () => refreshWalletData(dispatch),
    refreshTransactions: () => refreshTransactionData(dispatch),
    refreshAll: () => refreshAllData(dispatch),
    clearErrors: () => clearErrors(dispatch),
  }), [dispatch]);
};

// Wallet balance specific hook
export const useWalletBalance = () => {
  const { state } = useWalletContext();
  const { dispatch } = useWalletContext();

  return useMemo(() => ({
    walletStatus: state.walletStatus,
    loading: state.loading.wallet || state.loading.initial,
    error: state.errors.wallet || state.errors.initialization,
    initialized: state.initialized,
    refresh: () => refreshWalletData(dispatch),

    // Convenience getters
    custodialBalance: state.walletStatus?.custodialBalance || '0.00000000',
    personalBalance: state.walletStatus?.personalBalance || '0.00000000',
    totalAvailable: state.walletStatus?.totalAvailable || '0.00000000',
    canDeposit: state.walletStatus?.canDeposit || false,
  }), [state.walletStatus, state.loading.wallet, state.loading.initial, state.errors.wallet, state.errors.initialization, state.initialized, dispatch]);
};

// Transaction history hook
export const useTransactions = () => {
  const { state } = useWalletContext();
  const { dispatch } = useWalletContext();

  return useMemo(() => ({
    transactions: state.transactions,
    stats: state.transactionStats,
    loading: state.loading.transactions,
    error: state.errors.transactions,
    refresh: () => refreshTransactionData(dispatch),

    // Utility functions
    getRecent: (limit: number = 10) => state.transactions.slice(0, limit),
    getByType: (type: string) => state.transactions.filter(tx => tx.tx_type === type),
  }), [state.transactions, state.transactionStats, state.loading.transactions, state.errors.transactions, dispatch]);
};

// Transfer operations hook - supports all 4 FEATURES.md scenarios
export const useTransfers = () => {
  const { state, dispatch } = useWalletContext();
  const { principal } = useConnect();

  return useMemo(() => ({
    // Transfer functions
    sendPersonalFunds: (recipient: string, amount: string) =>
      transferTokens(dispatch, recipient, amount, true), // usePersonalFunds = true

    sendCustodialFunds: (recipient: string, amount: string) =>
      transferTokens(dispatch, recipient, amount, false), // usePersonalFunds = false

    depositToCustody: (amount: string) => {
      if (!principal) {
        throw new Error('Not authenticated');
      }
      return depositToCustody(dispatch, amount, Principal.fromText(principal));
    },

    // Transfer state
    loading: state.loading.operations,
    error: state.errors.operations,

    // Validation function using shared validation layer
    validateTransfer: (recipient: string, amount: string, usePersonalFunds: boolean): FormValidationResult<{ recipient: string; amount: string; token: TokenType }> => {
      // Determine balance based on transfer method
      let currentBalance: string;
      if (state.walletStatus) {
        const formattedBalance = usePersonalFunds
          ? state.walletStatus.personalBalance
          : state.walletStatus.custodialBalance;

        // Convert formatted balance to smallest units for validation
        currentBalance = Math.floor(parseFloat(formattedBalance) * 100000000).toString();
      } else {
        currentBalance = '0';
      }

      const rules: FormValidationRule<{ recipient: string; amount: string; token: TokenType }>[] = [
        {
          field: 'recipient',
          validator: validatePrincipalAddress,
          required: true,
          label: 'Recipient'
        },
        {
          field: 'amount',
          validator: (amt) => validateAndConvertAmount(amt, {
            balance: currentBalance,
            token: 'ckTestBTC',
            includesFees: true,
            operationType: 'TRANSFER'
          }),
          required: true,
          label: 'Amount'
        }
      ];

      return validateForm({ recipient, amount, token: 'ckTestBTC' }, rules);
    },

    // Calculate maximum sendable amount
    calculateMaxSendable: (usePersonalFunds: boolean): string => {
      if (!state.walletStatus) return '0';

      const formattedBalance = usePersonalFunds
        ? state.walletStatus.personalBalance
        : state.walletStatus.custodialBalance;

      const currentBalance = Math.floor(parseFloat(formattedBalance) * 100000000).toString();
      return calculateMaxAvailable(currentBalance, 'ckTestBTC', 'TRANSFER');
    },
  }), [state.walletStatus, state.loading.operations, state.errors.operations, principal, dispatch]);
};

// Transfer capabilities hook - determines what user can do
export const useTransferCapabilities = (): TransferCapabilities => {
  const { walletStatus } = useWalletBalance();

  return useMemo(() => {
    const personalBalance = parseFloat(walletStatus?.personalBalance || '0');
    const custodialBalance = parseFloat(walletStatus?.custodialBalance || '0');

    return {
      // All 4 FEATURES.md transfer scenarios
      canSendPersonalToUser: personalBalance > 0,           // Scenario 1: Send non-custodial to IC user
      canDepositToCustody: personalBalance > 0,             // Scenario 2: Send non-custodial to custodial wallet
      canSendCustodialToUser: custodialBalance > 0,         // Scenario 3: Send custodial to IC user
      canSendCustodialToCustodial: custodialBalance > 0,    // Scenario 4: Send custodial to custodial wallet

      // Additional capabilities
      hasAnyFunds: personalBalance > 0 || custodialBalance > 0,
      hasPersonalFunds: personalBalance > 0,
      hasCustodialFunds: custodialBalance > 0,

      // Balance information
      personalBalance: walletStatus?.personalBalance || '0.00000000',
      custodialBalance: walletStatus?.custodialBalance || '0.00000000',
      totalAvailable: walletStatus?.totalAvailable || '0.00000000',
    };
  }, [walletStatus]);
};

// Deposit and withdrawal operations hook
export const useDepositWithdrawal = () => {
  const { state, dispatch } = useWalletContext();

  return useMemo(() => ({
    // Operations
    getDepositAddress: () => getDepositAddressAction(dispatch),
    withdraw: (address: string, amount: string) => withdrawTokens(dispatch, address, amount),

    // State
    depositAddress: state.depositAddress,
    loading: state.loading.operations,
    error: state.errors.operations,

    // Capabilities
    getCapabilities: (): DepositWithdrawalCapabilities => {
      const personalBalance = parseFloat(state.walletStatus?.personalBalance || '0');
      const custodialBalance = parseFloat(state.walletStatus?.custodialBalance || '0');

      return {
        canWithdrawFromCustodial: custodialBalance > 0,
        canWithdrawFromPersonal: false, // Personal funds cannot be withdrawn directly
        canDepositFromCustodial: custodialBalance > 0,
        canDepositFromPersonal: personalBalance > 0,
        canCreateBtcAccount: custodialBalance === 0 && personalBalance === 0,
        canDeposit: personalBalance > 0 || custodialBalance >= 0,

        custodialBalance: state.walletStatus?.custodialBalance || '0.00000000',
        personalBalance: state.walletStatus?.personalBalance || '0.00000000',
        hasWithdrawableFunds: custodialBalance > 0,
        requiresSubaccountCreation: personalBalance > 0 && custodialBalance === 0,
        requiresBtcAddressCreation: personalBalance === 0 && custodialBalance === 0,
      };
    },
  }), [state.walletStatus, state.depositAddress, state.loading.operations, state.errors.operations, dispatch]);
};

// Faucet operations hook (for local development)
export const useFaucet = () => {
  const { state, dispatch } = useWalletContext();

  return useMemo(() => ({
    useFaucet: () => useFaucetTokens(dispatch),
    loading: state.loading.operations,
    error: state.errors.operations,
  }), [state.loading.operations, state.errors.operations, dispatch]);
};

// Authentication hook
export const useAuthentication = () => {
  const { state } = useWalletContext();

  return useMemo(() => ({
    isAuthenticated: state.isAuthenticated,
    principal: state.principal,
    backendReady: state.backendReady,
    initialized: state.initialized,
  }), [state.isAuthenticated, state.principal, state.backendReady, state.initialized]);
};