import { useState, useEffect, useMemo } from 'react';
import {
  getTransactionHistory,
  filterByType as filterByTypeService,
  filterByToken as filterByTokenService,
  filterByStatus as filterByStatusService,
  searchTransactions as searchTransactionsService,
  getRecentTransactions as getRecentTransactionsService,
  getTransactionStats,
  Transaction,
} from '@/services/transaction.service';
import { useBackend } from '@/hooks/use-backend';

interface UseTransactionHistoryReturn {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  stats: { total: number; confirmed: number; pending: number; failed: number };
  refreshTransactions: () => Promise<void>;
  filterByType: (type: string) => Transaction[];
  filterByToken: (token: string) => Transaction[];
  filterByStatus: (status: string) => Transaction[];
  searchTransactions: (query: string) => Transaction[];
  getRecentTransactions: (limit?: number) => Transaction[];
}

export const useTransactionHistory = (): UseTransactionHistoryReturn => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { backend: backendActor } = useBackend();

  const refreshTransactions = async (): Promise<void> => {
    const { getBackend } = await import('@/services/backend.service');
    const globalBackend = getBackend();

    if (!globalBackend) {
      setError('Backend not initialized');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const result = await getTransactionHistory();

      if (result.success && result.data) {
        setTransactions(result.data);
      } else {
        setError(result.error || 'Failed to load transaction history');
        setTransactions([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const filterByType = (type: string): Transaction[] => {
    return filterByTypeService(transactions, type);
  };

  const filterByToken = (token: string): Transaction[] => {
    return filterByTokenService(transactions, token);
  };

  const filterByStatus = (status: string): Transaction[] => {
    return filterByStatusService(transactions, status);
  };

  const searchTransactions = (query: string): Transaction[] => {
    return searchTransactionsService(transactions, query);
  };

  const getRecentTransactions = (limit: number = 5): Transaction[] => {
    return getRecentTransactionsService(transactions, limit);
  };

  const stats = useMemo(() => getTransactionStats(transactions), [transactions]);

  useEffect(() => {
    if (backendActor) {
      refreshTransactions();
    }
  }, [backendActor]);

  return {
    transactions,
    loading,
    error,
    stats,
    refreshTransactions,
    filterByType,
    filterByToken,
    filterByStatus,
    searchTransactions,
    getRecentTransactions,
  };
};