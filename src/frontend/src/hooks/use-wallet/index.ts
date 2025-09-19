import { useState, useEffect } from 'react';
import { getBalance, getBtcAddress, transfer, useFaucet } from '@/services/wallet.service';
import { WalletState, WalletActions, TransactionState, TransactionActions } from '@/types/wallet.types';
import { useTransactionHistory } from '@/hooks/use-transaction-history';
import { useICP } from '@/hooks/use-icp';
import { useBackend } from '@/hooks/use-backend';
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
  // ICP integration
  icpBalance: string;
  icpLoading: boolean;
  icpError: string | null;
  refreshICPBalance: () => Promise<void>;
  transferICP: (to: string, amount: string) => Promise<{ success: boolean; blockIndex?: string; error?: string }>;
  formatICPBalance: (balance: string) => string;
  parseICPAmount: (amount: string) => string;
  // Transaction history integration
  transactionHistory: any[];
  transactionLoading: boolean;
  transactionError: string | null;
  transactionStats: { total: number; confirmed: number; pending: number; failed: number };
  refreshTransactions: () => Promise<void>;
  getRecentTransactions: (limit?: number) => any[];
  // Validation functions using shared validation layer
  validateSendInputs: (recipient: string, amount: string, token: TokenType) => FormValidationResult<{ recipient: string; amount: string; token: TokenType }>;
  calculateMaxSendableAmount: (token: TokenType) => string;
  getBalanceForToken: (token: TokenType) => string;
}

export const useWallet = (isAuthenticated: boolean): UseWalletReturn => {
  const [balance, setBalance] = useState<string>('0');
  const [btcAddress, setBtcAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [sendAmount, setSendAmount] = useState('');
  const [sendTo, setSendTo] = useState('');

  const { backend } = useBackend();
  const { showError } = useError();

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

  const loadBalance = async (): Promise<void> => {
    setLoading(true);
    try {
      const result = await getBalance();
      if (result.success && result.balance) {
        setBalance(result.balance);
      } else {
        console.error('Error getting balance:', result.error);
      }
    } catch (error) {
      console.error('Failed to load balance:', error);
    } finally {
      setLoading(false);
    }
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

  const handleSend = async (recipient?: string, amount?: string): Promise<void> => {
    const finalRecipient = recipient || sendTo;
    const finalAmount = amount || sendAmount;

    if (!finalRecipient || !finalAmount) return;

    setLoading(true);
    try {
      const result = await transfer(finalRecipient, finalAmount);
      if (result.success) {
        showError({
          title: 'Transfer Successful',
          message: `Your ckTestBTC transfer has been completed successfully.`,
          details: `Block index: ${result.blockIndex}`,
          severity: 'info'
        });
        // Only clear state if we were using internal state
        if (!recipient) setSendAmount('');
        if (!amount) setSendTo('');
        await loadBalance();
        // Refresh transaction history after successful send
        await refreshTransactions();
      } else {
        showError({
          title: 'Transfer Failed',
          message: 'Unable to complete the ckTestBTC transfer.',
          details: result.error,
          severity: 'error'
        });
      }
    } catch (error: any) {
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
          message: result.message || 'Successfully received test ckTestBTC tokens.',
          severity: 'info'
        });
        await loadBalance();
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
    } catch (error: any) {
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
    token: TokenType
  ): FormValidationResult<{ recipient: string; amount: string; token: TokenType }> => {
    const currentBalance = getBalanceForToken(token);

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
  const calculateMaxSendableAmount = (token: TokenType): string => {
    const currentBalance = getBalanceForToken(token);
    return calculateMaxAvailable(currentBalance, token, 'TRANSFER');
  };

  // Load initial data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadBalance();
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
    refreshBalance,
    setSendAmount,
    setSendTo,
    handleSend,
    handleFaucet,
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
  };
};