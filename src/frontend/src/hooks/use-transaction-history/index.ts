import { useState, useEffect } from 'react';
import { transactionService, getTransactionHistory } from '@/services/transaction.service';
import { Transaction } from '@/components/shared/transaction-item';
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

  console.log('useTransactionHistory: Hook initialized, backendActor:', !!backendActor);

  // Set backend actor when available
  useEffect(() => {
    console.log('useTransactionHistory: Backend actor changed:', !!backendActor);
    if (backendActor) {
      console.log('useTransactionHistory: Setting backend actor on transaction service');
      transactionService.setBackendActor(backendActor);
    }
  }, [backendActor]);

  const refreshTransactions = async (): Promise<void> => {
    console.log('useTransactionHistory: refreshTransactions called, backendActor:', !!backendActor);

    // Check global backend service instead of React hook state
    const { getBackend } = await import('@/services/backend.service');
    const globalBackend = getBackend();
    console.log('useTransactionHistory: Global backend available:', !!globalBackend);

    if (!globalBackend) {
      console.log('useTransactionHistory: Global backend not initialized');
      setError('Backend not initialized');
      return;
    }

    console.log('useTransactionHistory: Starting transaction refresh');
    setLoading(true);
    setError(null);

    try {
      console.log('useTransactionHistory: Calling getTransactionHistory service');
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

  // Filter transactions by type
  const filterByType = (type: string): Transaction[] => {
    return transactionService.filterByType(transactions, type);
  };

  // Filter transactions by token
  const filterByToken = (token: string): Transaction[] => {
    return transactionService.filterByToken(transactions, token);
  };

  // Filter transactions by status
  const filterByStatus = (status: string): Transaction[] => {
    return transactionService.filterByStatus(transactions, status);
  };

  // Search transactions
  const searchTransactions = (query: string): Transaction[] => {
    return transactionService.searchTransactions(transactions, query);
  };

  // Get recent transactions for send/receive tab
  const getRecentTransactions = (limit: number = 5): Transaction[] => {
    return transactionService.getRecentTransactions(transactions, limit);
  };

  // Calculate transaction statistics
  const stats = transactionService.getTransactionStats(transactions);

  // Load transactions when backend becomes available
  useEffect(() => {
    console.log('useTransactionHistory: Load effect triggered, backendActor:', !!backendActor);
    if (backendActor) {
      console.log('useTransactionHistory: Calling refreshTransactions');
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