import { useState } from 'react';
import {
  getDepositAddress,
  withdrawTestBTC,
  formatCkTestBTCAmount,
  parseCkTestBTCAmount,
  getMinimumWithdrawalAmount,
} from '@/services/deposit-withdrawal.service';
import {
  validateTestBTCAddress,
  validateAndConvertAmount,
  validateForm,
  calculateMaxAvailable,
  TokenType,
  FormValidationRule,
  FormValidationResult
} from '@/lib';

interface UseDepositWithdrawalReturn {
  loading: boolean;
  error: string | null;
  getDepositAddress: () => Promise<{ success: boolean; address?: string; error?: string }>;
  withdrawTestBTC: (address: string, amount: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  // Enhanced validation functions using shared validation layer
  validateWithdrawalInputs: (address: string, amount: string, balance: string) => FormValidationResult<{ address: string; amount: string }>;
  validateAddress: (address: string) => { valid: boolean; error?: string };
  validateAmount: (amount: string, balance: string) => { valid: boolean; error?: string };
  calculateMaxWithdrawal: (balance: string) => string;
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

  // Enhanced validation function using shared validation layer
  const validateWithdrawalInputs = (
    address: string,
    amount: string,
    balance: string
  ): FormValidationResult<{ address: string; amount: string }> => {
    const rules: FormValidationRule<{ address: string; amount: string }>[] = [
      {
        field: 'address',
        validator: validateTestBTCAddress,
        required: true,
        label: 'TestBTC Address'
      },
      {
        field: 'amount',
        validator: (amt) => validateAndConvertAmount(amt, {
          balance,
          token: 'ckTestBTC' as TokenType,
          includesFees: true,
          operationType: 'WITHDRAW'
        }),
        required: true,
        label: 'Withdrawal Amount'
      }
    ];

    return validateForm({ address, amount }, rules);
  };

  // Calculate maximum withdrawal amount
  const calculateMaxWithdrawal = (balance: string): string => {
    return calculateMaxAvailable(balance, 'ckTestBTC' as TokenType, 'WITHDRAW');
  };

  // Legacy validation methods for backward compatibility
  const validateAddress = (address: string): { valid: boolean; error?: string } => {
    const result = validateTestBTCAddress(address);
    return {
      valid: result.valid,
      error: result.error
    };
  };

  const validateAmount = (amount: string, balance: string): { valid: boolean; error?: string } => {
    const result = validateAndConvertAmount(amount, {
      balance,
      token: 'ckTestBTC' as TokenType,
      includesFees: true,
      operationType: 'WITHDRAW'
    });
    return {
      valid: result.valid,
      error: result.error
    };
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
    // Enhanced validation functions
    validateWithdrawalInputs,
    calculateMaxWithdrawal,
    // Legacy validation methods for backward compatibility
    validateAddress,
    validateAmount,
    formatAmount,
    parseAmount,
    getMinimumAmount,
  };
};