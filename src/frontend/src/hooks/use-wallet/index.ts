import { useState, useEffect } from 'react';
import { getBtcAddress, transfer, useFaucet, getWalletStatus, WalletStatus } from '@/services/wallet.service';
import { depositFunds } from '@/services/custodial-wallet.service';
import { Principal } from '@dfinity/principal';
import { useConnect } from '@connect2ic/react';
import { WalletState, WalletActions, TransactionState, TransactionActions } from '@/types/wallet.types';
import { useTransactionHistory } from '@/hooks/use-transaction-history';
import { Transaction } from '@/services/transaction.service';
import { useICP } from '@/hooks/use-icp';
import { useError } from '@/contexts/error-context';
import {
  validatePrincipalAddress,
  validateAndConvertAmount,
  validateForm,
  calculateMaxAvailable,
  TokenType,
  FormValidationRule,
  FormValidationResult
} from '@/lib';

interface UseWalletReturn extends WalletState, WalletActions, TransactionState, TransactionActions {
  handleFaucet: () => Promise<void>;
  // Custodial wallet functionality
  walletStatus?: WalletStatus;
  handleDepositToCustody: (amount: string) => Promise<void>;
  refreshWalletStatus: () => Promise<void>;
  // ICP integration
  icpBalance: string;
  icpLoading: boolean;
  icpError: string | null;
  refreshICPBalance: () => Promise<void>;
  transferICP: (to: string, amount: string) => Promise<{ success: boolean; blockIndex?: string; error?: string }>;
  formatICPBalance: (balance: string) => string;
  parseICPAmount: (amount: string) => string;
  // Transaction history integration
  transactionHistory: Transaction[];
  transactionLoading: boolean;
  transactionError: string | null;
  transactionStats: { total: number; confirmed: number; pending: number; failed: number };
  refreshTransactions: () => Promise<void>;
  getRecentTransactions: (limit?: number) => any[];
  // Validation functions using shared validation layer
  validateSendInputs: (recipient: string, amount: string, token: TokenType) => FormValidationResult<{ recipient: string; amount: string; token: TokenType }>;
  calculateMaxSendableAmount: (token: TokenType) => string;
  getBalanceForToken: (token: TokenType) => string;
  getTransferCapabilities: () => {
    canTransferPersonal: boolean;
    canTransferCustodial: boolean;
    personalBalance: string;
    custodialBalance: string;
    hasPersonalFunds: boolean;
    hasCustodialFunds: boolean;
  };
  // Extended matrix capability functions
  getWithdrawCapabilities: () => {
    canWithdrawFromCustodial: boolean;
    canWithdrawFromPersonal: boolean;
    custodialBalance: string;
    hasWithdrawableFunds: boolean;
  };
  getDepositCapabilities: () => {
    canDepositFromCustodial: boolean;
    canDepositFromPersonal: boolean;
    canCreateBtcAccount: boolean;
    canDeposit: boolean;
    personalBalance: string;
    custodialBalance: string;
    requiresSubaccountCreation: boolean;
    requiresBtcAddressCreation: boolean;
  };
}

export const useWallet = (isAuthenticated: boolean): UseWalletReturn => {
  const [balance, setBalance] = useState<string>('0');
  const [btcAddress, setBtcAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [sendAmount, setSendAmount] = useState('');
  const [sendTo, setSendTo] = useState('');
  const [walletStatus, setWalletStatus] = useState<WalletStatus | undefined>(undefined);

  const { showError } = useError();
  const { principal } = useConnect();

  // Initialize ICP functionality
  const {
    balance: icpBalance,
    loading: icpLoading,
    error: icpError,
    refreshBalance: refreshICPBalance,
    transfer: transferICP,
    formatBalance: formatICPBalance,
    parseAmount: parseICPAmount,
  } = useICP();

  // Initialize transaction history functionality
  const {
    transactions: transactionHistory,
    loading: transactionLoading,
    error: transactionError,
    stats: transactionStats,
    refreshTransactions,
    getRecentTransactions,
  } = useTransactionHistory();

  const loadWalletStatus = async (): Promise<void> => {
    setLoading(true);
    try {
      const result = await getWalletStatus();
      if (result.success && result.status) {
        setWalletStatus(result.status);
        // Update legacy balance for backward compatibility
        setBalance(result.status.custodialBalance);
      } else {
        console.error('Error getting wallet status:', result.error);
      }
    } catch (error) {
      console.error('Failed to load wallet status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBalance = async (): Promise<void> => {
    // Use the new wallet status instead of old balance
    await loadWalletStatus();
  };

  const refreshWalletStatus = async (): Promise<void> => {
    await loadWalletStatus();
  };

  const loadBtcAddress = async (): Promise<void> => {
    try {
      const result = await getBtcAddress();
      if (result.success && result.address) {
        setBtcAddress(result.address);
      } else {
        console.error('Error getting BTC address:', result.error);
      }
    } catch (error) {
      console.error('Failed to load BTC address:', error);
    }
  };

  const refreshBalance = async (): Promise<void> => {
    await loadBalance();
  };

  const handleSend = async (
    recipient?: string,
    amount?: string,
    usePersonalFunds: boolean = true
  ): Promise<void> => {
    const finalRecipient = recipient || sendTo;
    const finalAmount = amount || sendAmount;

    if (!finalRecipient || !finalAmount) return;

    setLoading(true);
    try {
      // Use dual transfer based on fund source selection
      const result = await transfer(finalRecipient, finalAmount, !usePersonalFunds);

      if (result.success) {
        const methodName = result.method === 'direct' ? 'personal funds' : 'custodial wallet';
        showError({
          title: 'Transfer Successful',
          message: `Your ckTestBTC transfer from ${methodName} has been completed successfully.`,
          details: `Block index: ${result.blockIndex} (via ${result.method} transfer)`,
          severity: 'info'
        });
        // Only clear state if we were using internal state
        if (!recipient) setSendAmount('');
        if (!amount) setSendTo('');
        await loadWalletStatus();
        // Refresh transaction history after successful send
        await refreshTransactions();
      } else {
        const methodName = result.method === 'direct' ? 'personal funds' : 'custodial wallet';
        showError({
          title: 'Transfer Failed',
          message: `Unable to complete the ckTestBTC transfer from ${methodName}.`,
          details: result.error,
          severity: 'error'
        });
      }
    } catch (error: unknown) {
      showError({
        title: 'Transfer Error',
        message: 'An unexpected error occurred during the transfer.',
        details: error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFaucet = async (): Promise<void> => {
    setLoading(true);
    try {
      const result = await useFaucet();
      if (result.success) {
        showError({
          title: 'Test Tokens Received',
          message: result.message || 'Successfully received test ckTestBTC tokens in your personal account.',
          details: 'Use the "Deposit to Wallet" button to move them into your custodial wallet.',
          severity: 'info'
        });
        await loadWalletStatus(); // Load wallet status to show personal balance
        // Refresh transaction history after successful faucet
        await refreshTransactions();
      } else {
        showError({
          title: 'Faucet Error',
          message: 'Unable to get test tokens from the faucet.',
          details: result.error,
          severity: 'error',
          onRetry: handleFaucet
        });
      }
    } catch (error: unknown) {
      showError({
        title: 'Faucet Request Failed',
        message: 'Failed to request test tokens from the faucet.',
        details: error.message,
        severity: 'error',
        onRetry: handleFaucet
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDepositToCustody = async (amount: string): Promise<void> => {
    if (!principal) {
      showError({
        title: 'Authentication Required',
        message: 'Please authenticate to deposit funds.',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      const userPrincipal = Principal.fromText(principal);
      console.log('[UseWallet] Starting direct ledger deposit for user:', principal);

      const result = await depositFunds(amount, userPrincipal);
      if (result.success) {
        const depositedAmount = result.receipt?.amountDeposited || amount;
        showError({
          title: 'Deposit Successful',
          message: `Successfully deposited ${depositedAmount} ckTestBTC to your custodial wallet.`,
          details: `Block index: ${result.blockIndex}`,
          severity: 'info'
        });
        await loadWalletStatus(); // Refresh wallet status
        await refreshTransactions(); // Refresh transaction history
      } else {
        showError({
          title: 'Deposit Failed',
          message: 'Unable to deposit funds to custodial wallet.',
          details: result.error,
          severity: 'error'
        });
      }
    } catch (error: unknown) {
      showError({
        title: 'Deposit Error',
        message: 'An unexpected error occurred during the deposit.',
        details: error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get balance for a specific token
  const getBalanceForToken = (token: TokenType): string => {
    switch (token) {
      case 'ICP':
        return icpBalance;
      case 'ckTestBTC':
        return balance;
      default:
        return '0';
    }
  };

  // Validation function using shared validation layer
  const validateSendInputs = (
    recipient: string,
    amount: string,
    token: TokenType,
    usePersonalFunds?: boolean
  ): FormValidationResult<{ recipient: string; amount: string; token: TokenType }> => {
    // For ckTestBTC, determine balance based on transfer method
    let currentBalance: string;
    if (token === 'ckTestBTC' && usePersonalFunds !== undefined && walletStatus) {
      const formattedBalance = usePersonalFunds
        ? walletStatus.personalBalance
        : walletStatus.custodialBalance;

      // Convert formatted balance (e.g., "1.00000000") to smallest units (e.g., "100000000")
      // The validation function expects balance in satoshis, not formatted values
      currentBalance = Math.floor(parseFloat(formattedBalance) * 100000000).toString();
    } else {
      currentBalance = getBalanceForToken(token);
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
          token,
          includesFees: true,
          operationType: 'TRANSFER'
        }),
        required: true,
        label: 'Amount'
      }
    ];

    return validateForm({ recipient, amount, token }, rules);
  };

  // Calculate maximum sendable amount for a token
  const calculateMaxSendableAmount = (token: TokenType, usePersonalFunds?: boolean): string => {
    // For ckTestBTC, determine balance based on transfer method
    let currentBalance: string;
    if (token === 'ckTestBTC' && usePersonalFunds !== undefined && walletStatus) {
      const formattedBalance = usePersonalFunds
        ? walletStatus.personalBalance
        : walletStatus.custodialBalance;

      // Convert formatted balance (e.g., "1.00000000") to smallest units (e.g., "100000000")
      // The calculateMaxAvailable function expects balance in satoshis, not formatted values
      currentBalance = Math.floor(parseFloat(formattedBalance) * 100000000).toString();
    } else {
      currentBalance = getBalanceForToken(token);
    }
    return calculateMaxAvailable(currentBalance, token, 'TRANSFER');
  };

  // Get transfer capabilities based on balance matrix
  const getTransferCapabilities = () => {
    const personalBalance = walletStatus?.personalBalance || '0.00000000';
    const custodialBalance = walletStatus?.custodialBalance || '0.00000000';

    return {
      canTransferPersonal: parseFloat(personalBalance) > 0, // Row 2: User + Balance = Direct Ledger
      canTransferCustodial: parseFloat(custodialBalance) > 0, // Row 1: Canister + User Subaccount + Balance = Backend Proxy
      personalBalance,
      custodialBalance,
      hasPersonalFunds: parseFloat(personalBalance) > 0,
      hasCustodialFunds: parseFloat(custodialBalance) > 0,
    };
  };

  // Get withdrawal capabilities based on matrix rules
  const getWithdrawCapabilities = () => {
    const personalBalance = walletStatus?.personalBalance || '0.00000000';
    const custodialBalance = walletStatus?.custodialBalance || '0.00000000';

    return {
      // Row 1: Canister + User Subaccount + Balance = Can withdraw from custodial
      canWithdrawFromCustodial: parseFloat(custodialBalance) > 0,
      // Row 2: User + Balance = Cannot withdraw (no custodial access)
      canWithdrawFromPersonal: false, // Personal funds cannot be withdrawn directly
      custodialBalance,
      hasWithdrawableFunds: parseFloat(custodialBalance) > 0,
    };
  };

  // Get deposit capabilities based on matrix rules
  const getDepositCapabilities = () => {
    const personalBalance = walletStatus?.personalBalance || '0.00000000';
    const custodialBalance = walletStatus?.custodialBalance || '0.00000000';

    return {
      // Row 1: Canister + User Subaccount + Balance = Can deposit (already has subaccount)
      canDepositFromCustodial: parseFloat(custodialBalance) > 0,
      // Row 2: User + Balance = Can deposit (will create custodial subaccount)
      canDepositFromPersonal: parseFloat(personalBalance) > 0,
      // Row 3: Canister + User Subaccount + No Balance = Can deposit (will create BTC address)
      canCreateBtcAccount: parseFloat(custodialBalance) === 0 && parseFloat(personalBalance) === 0,
      // Row 4: User + No Balance = Cannot deposit
      canDeposit: parseFloat(personalBalance) > 0 || parseFloat(custodialBalance) >= 0, // Allow deposit if any account exists
      personalBalance,
      custodialBalance,
      requiresSubaccountCreation: parseFloat(personalBalance) > 0 && parseFloat(custodialBalance) === 0,
      requiresBtcAddressCreation: parseFloat(personalBalance) === 0 && parseFloat(custodialBalance) === 0,
    };
  };

  // Load initial data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadWalletStatus(); // Use comprehensive wallet status instead of just balance
      loadBtcAddress();
    }
  }, [isAuthenticated]);

  return {
    balance,
    btcAddress,
    loading,
    sendAmount,
    sendTo,
    loadBalance,
    loadBtcAddress,
    refreshBalance: refreshWalletStatus, // Use wallet status refresh
    setSendAmount,
    setSendTo,
    handleSend,
    handleFaucet,
    // Custodial wallet functionality
    walletStatus,
    handleDepositToCustody,
    refreshWalletStatus,
    // ICP integration
    icpBalance,
    icpLoading,
    icpError,
    refreshICPBalance,
    transferICP,
    formatICPBalance,
    parseICPAmount,
    // Transaction history integration
    transactionHistory,
    transactionLoading,
    transactionError,
    transactionStats,
    refreshTransactions,
    getRecentTransactions,
    // Validation functions
    validateSendInputs,
    calculateMaxSendableAmount,
    getBalanceForToken,
    getTransferCapabilities,
    // New capability functions for extended matrix
    getWithdrawCapabilities,
    getDepositCapabilities,
  };
};