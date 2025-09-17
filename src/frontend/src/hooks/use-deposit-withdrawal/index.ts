import { useState } from 'react';
import {
  getDepositAddress,
  withdrawTestBTC,
  validateTestBTCAddress,
  formatCkTestBTCAmount,
  parseCkTestBTCAmount,
  isValidWithdrawalAmount,
  getMinimumWithdrawalAmount,
} from '@/services/deposit-withdrawal.service';

interface UseDepositWithdrawalReturn {
  loading: boolean;
  error: string | null;
  getDepositAddress: () => Promise<{ success: boolean; address?: string; error?: string }>;
  withdrawTestBTC: (address: string, amount: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  validateAddress: (address: string) => { valid: boolean; error?: string };
  validateAmount: (amount: string, balance: string) => { valid: boolean; error?: string };
  formatAmount: (amount: string) => string;
  parseAmount: (amount: string) => string;
  getMinimumAmount: () => string;
}

export const useDepositWithdrawal = (): UseDepositWithdrawalReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetDepositAddress = async (): Promise<{ success: boolean; address?: string; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const result = await getDepositAddress();

      if (result.success && result.data) {
        return {
          success: true,
          address: result.data,
        };
      } else {
        const errorMessage = result.error || 'Failed to get deposit address';
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawTestBTC = async (address: string, amount: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const addressValidation = validateTestBTCAddress(address);
      if (!addressValidation.valid) {
        setError(addressValidation.error || 'Invalid address');
        return {
          success: false,
          error: addressValidation.error,
        };
      }

      const amountInSatoshis = parseCkTestBTCAmount(amount);
      const result = await withdrawTestBTC(address, amountInSatoshis);

      if (result.success) {
        return {
          success: true,
          message: result.message || 'Withdrawal initiated successfully',
        };
      } else {
        const errorMessage = result.error || 'Withdrawal failed';
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Withdrawal failed';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  const validateAddress = (address: string): { valid: boolean; error?: string } => {
    return validateTestBTCAddress(address);
  };

  const validateAmount = (amount: string, balance: string): { valid: boolean; error?: string } => {
    return isValidWithdrawalAmount(amount, balance);
  };

  const formatAmount = (amount: string): string => {
    return formatCkTestBTCAmount(amount);
  };

  const parseAmount = (amount: string): string => {
    return parseCkTestBTCAmount(amount);
  };

  const getMinimumAmount = (): string => {
    return getMinimumWithdrawalAmount();
  };

  return {
    loading,
    error,
    getDepositAddress: handleGetDepositAddress,
    withdrawTestBTC: handleWithdrawTestBTC,
    validateAddress,
    validateAmount,
    formatAmount,
    parseAmount,
    getMinimumAmount,
  };
};