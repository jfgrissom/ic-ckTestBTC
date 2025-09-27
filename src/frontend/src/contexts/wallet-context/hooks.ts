import { useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useWalletContext } from './index';
import { TransferCapabilities } from './types';
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

// Transfer operations hook - implements Transfer Method Matrix from PRD
export const useTransfers = () => {
  const { state, dispatch } = useWalletContext();
  const { principal } = useAuth();

  return useMemo(() => ({
    // Transfer functions aligned with PRD matrix
    sendTokens: (recipient: string, amount: string, usePersonalFunds?: boolean) =>
      transferTokens(dispatch, recipient, amount, usePersonalFunds),

    depositToCustody: (amount: string) => {
      if (!principal) {
        throw new Error('Not authenticated');
      }
      return depositToCustody(dispatch, amount, principal);
    },

    // Transfer state
    loading: state.loading.operations,
    error: state.errors.operations,

    // Transfer capabilities based on PRD Matrix (Lines 63-67)
    transferCapabilities: (() => {
      const personalBalance = parseFloat(state.walletStatus?.personalBalance || '0');
      const custodialBalance = parseFloat(state.walletStatus?.custodialBalance || '0');

      return {
        // Row 1: Canister Primary, User Sub, Balance = Yes
        // Can send via Backend Custodian, Can withdraw, Can deposit
        canTransferCustodial: custodialBalance > 0,

        // Row 2: User Primary, No Sub, Balance = Yes
        // Can send via ckTestBTC ledger directly, Can deposit (with caveat)
        canTransferPersonal: personalBalance > 0,

        // Overall capabilities
        hasPersonalFunds: personalBalance > 0,
        hasCustodialFunds: custodialBalance > 0,
        personalBalance: state.walletStatus?.personalBalance || '0.00000000',
        custodialBalance: state.walletStatus?.custodialBalance || '0.00000000',
      };
    })(),

    // Validation function using shared validation layer
    validateSendInputs: (recipient: string, amount: string, usePersonalFunds?: boolean): FormValidationResult<{ recipient: string; amount: string; token: TokenType }> => {
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
    calculateMaxSendAmount: (token: TokenType = 'ckTestBTC', usePersonalFunds?: boolean): string => {
      if (!state.walletStatus) return '0';

      const formattedBalance = usePersonalFunds
        ? state.walletStatus.personalBalance
        : state.walletStatus.custodialBalance;

      const currentBalance = Math.floor(parseFloat(formattedBalance) * 100000000).toString();
      return calculateMaxAvailable(currentBalance, token, 'TRANSFER');
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

    // PRD Matrix compliant withdrawal - only from custodial
    withdrawFromCustody: async (address: string, amount: string, usePersonalFunds?: boolean) => {
      // PRD Matrix: Only custodial funds can be withdrawn (Row 1)
      if (usePersonalFunds) {
        throw new Error('Personal funds cannot be withdrawn directly. Transfer to custodial first.');
      }
      return withdrawTokens(dispatch, address, amount);
    },

    // Validation for withdrawals
    validateWithdrawInputs: (address: string, amount: string): FormValidationResult<{ address: string; amount: string }> => {
      const currentBalance = state.walletStatus?.custodialBalance || '0';
      const balanceInSatoshis = Math.floor(parseFloat(currentBalance) * 100000000).toString();

      const rules: FormValidationRule<{ address: string; amount: string }>[] = [
        {
          field: 'address',
          validator: (addr) => ({
            valid: addr.startsWith('tb1') && addr.length > 20,
            normalizedValue: addr,
            addressType: 'bitcoin-testnet'
          }),
          required: true,
          label: 'Bitcoin TestNet Address'
        },
        {
          field: 'amount',
          validator: (amt) => validateAndConvertAmount(amt, {
            balance: balanceInSatoshis,
            token: 'ckTestBTC',
            includesFees: true,
            operationType: 'WITHDRAW'
          }),
          required: true,
          label: 'Amount'
        }
      ];

      return validateForm({ address, amount }, rules);
    },

    // Calculate max withdrawable (only from custodial)
    calculateMaxWithdrawAmount: (): string => {
      const currentBalance = state.walletStatus?.custodialBalance || '0';
      const balanceInSatoshis = Math.floor(parseFloat(currentBalance) * 100000000).toString();
      return calculateMaxAvailable(balanceInSatoshis, 'ckTestBTC', 'WITHDRAW');
    },

    // State
    depositAddress: state.depositAddress,
    loading: state.loading.operations,
    error: state.errors.operations,

    // Capabilities aligned with PRD Matrix
    depositWithdrawalCapabilities: (() => {
      const personalBalance = parseFloat(state.walletStatus?.personalBalance || '0');
      const custodialBalance = parseFloat(state.walletStatus?.custodialBalance || '0');

      return {
        // Matrix Row 1: Canister has custody
        canWithdrawFromCustodial: custodialBalance > 0,

        // Matrix Row 2: User has direct control - cannot withdraw
        canWithdrawFromPersonal: false,

        // Deposit capabilities
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
    })(),
  }), [state.walletStatus, state.depositAddress, state.loading.operations, state.errors.operations, dispatch]);
};

// Faucet operations hook (for local development)
export const useFaucet = () => {
  const { state, dispatch } = useWalletContext();

  return useMemo(() => ({
    useFaucet: () => {
      if (!state.principal) {
        throw new Error('User principal not available for faucet operation');
      }
      return useFaucetTokens(dispatch, state.principal);
    },
    loading: state.loading.operations,
    error: state.errors.operations,
  }), [state.loading.operations, state.errors.operations, state.principal, dispatch]);
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