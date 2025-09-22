import { useState } from 'react';
import { getICPBalance, transferICP, formatICPBalance, parseICPAmount } from '@/services/icp.service';

interface UseICPReturn {
  balance: string;
  loading: boolean;
  error: string | null;
  refreshBalance: () => Promise<void>;
  transfer: (to: string, amount: string) => Promise<{ success: boolean; blockIndex?: string; error?: string }>;
  formatBalance: (balance: string) => string;
  parseAmount: (amount: string) => string;
}

export const useICP = (): UseICPReturn => {
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshBalance = async (): Promise<void> => {

    setLoading(true);
    setError(null);

    try {
      const result = await getICPBalance();

      if (result.success && result.data) {
        setBalance(result.data);
      } else {
        setError(result.error || 'Failed to get ICP balance');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (to: string, amount: string): Promise<{ success: boolean; blockIndex?: string; error?: string }> => {

    setLoading(true);
    setError(null);

    try {
      const amountInE8s = parseICPAmount(amount);
      const result = await transferICP(to, amountInE8s);

      if (result.success) {
        await refreshBalance();
        return {
          success: true,
          blockIndex: result.blockIndex,
        };
      } else {
        setError(result.error || 'Transfer failed');
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transfer failed';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh will be handled by calling component

  return {
    balance,
    loading,
    error,
    refreshBalance,
    transfer: handleTransfer,
    formatBalance: formatICPBalance,
    parseAmount: parseICPAmount,
  };
};