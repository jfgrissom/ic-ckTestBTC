import { useState, useEffect } from 'react';
import {
  depositWithdrawalService,
  getDepositAddress,
  withdrawTestBTC,
  validateTestBTCAddress,
  formatCkTestBTCAmount,
  parseCkTestBTCAmount
} from '@/services/deposit-withdrawal.service';
import { useBackend } from '@/hooks/useBackend';

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

  const { backend: backendActor } = useBackend();

  // Set backend actor when available
  useEffect(() => {
    if (backendActor) {
      depositWithdrawalService.setBackendActor(backendActor);
    }
  }, [backendActor]);

  const handleGetDepositAddress = async (): Promise<{ success: boolean; address?: string; error?: string }> => {
    if (!backendActor) {
      return { success: false, error: 'Backend not initialized' };
    }

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
    if (!backendActor) {
      return { success: false, error: 'Backend not initialized' };
    }

    setLoading(true);
    setError(null);

    try {
      // Validate address first
      const addressValidation = validateTestBTCAddress(address);
      if (!addressValidation.valid) {
        setError(addressValidation.error || 'Invalid address');
        return {
          success: false,
          error: addressValidation.error,
        };
      }

      // Parse amount to satoshis
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
    return depositWithdrawalService.isValidWithdrawalAmount(amount, balance);
  };

  const formatAmount = (amount: string): string => {
    return formatCkTestBTCAmount(amount);
  };

  const parseAmount = (amount: string): string => {
    return parseCkTestBTCAmount(amount);
  };

  const getMinimumAmount = (): string => {
    return depositWithdrawalService.getMinimumWithdrawalAmount();
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