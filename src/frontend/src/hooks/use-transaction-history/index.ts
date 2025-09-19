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

// Types for enhanced filtering and pagination
type TransactionType = 'All' | 'Send' | 'Receive' | 'Deposit' | 'Withdraw' | 'Mint';
type TokenFilter = 'All' | 'ICP' | 'ckTestBTC';
type StatusFilter = 'All' | 'Pending' | 'Confirmed' | 'Failed';

interface FilterState {
  type: TransactionType;
  token: TokenFilter;
  status: StatusFilter;
  searchQuery: string;
}

interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

interface UseTransactionHistoryReturn {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  stats: { total: number; confirmed: number; pending: number; failed: number };
  refreshTransactions: () => Promise<void>;

  // Enhanced stateful filtering and pagination
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
  clearFilters: () => void;
  pagination: PaginationState;
  setPagination: (pagination: Partial<PaginationState>) => void;

  // Processed results based on current filters and pagination
  filteredTransactions: Transaction[];
  paginatedTransactions: Transaction[];

  // Legacy filter methods (for backward compatibility)
  filterByType: (type: string) => Transaction[];
  filterByToken: (token: string) => Transaction[];
  filterByStatus: (status: string) => Transaction[];
  searchTransactions: (query: string) => Transaction[];
  getRecentTransactions: (limit?: number) => Transaction[];
}

export const useTransactionHistory = (defaultPageSize: number = 10): UseTransactionHistoryReturn => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filters, setFiltersState] = useState<FilterState>({
    type: 'All',
    token: 'All',
    status: 'All',
    searchQuery: '',
  });

  // Pagination state
  const [pagination, setPaginationState] = useState<PaginationState>({
    currentPage: 1,
    pageSize: defaultPageSize,
    totalPages: 1,
  });

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

  // Enhanced filter and pagination functions
  const setFilters = (newFilters: Partial<FilterState>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    // Reset to first page when filters change
    setPaginationState(prev => ({ ...prev, currentPage: 1 }));
  };

  const clearFilters = () => {
    setFiltersState({
      type: 'All',
      token: 'All',
      status: 'All',
      searchQuery: '',
    });
    setPaginationState(prev => ({ ...prev, currentPage: 1 }));
  };

  const setPagination = (newPagination: Partial<PaginationState>) => {
    setPaginationState(prev => ({ ...prev, ...newPagination }));
  };

  // Computed filtered transactions based on current filter state
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Apply type filter
    if (filters.type !== 'All') {
      filtered = filtered.filter(tx => tx.tx_type === filters.type);
    }

    // Apply token filter
    if (filters.token !== 'All') {
      filtered = filtered.filter(tx => tx.token === filters.token);
    }

    // Apply status filter
    if (filters.status !== 'All') {
      filtered = filtered.filter(tx => tx.status === filters.status);
    }

    // Apply search filter
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(tx =>
        tx.from.toLowerCase().includes(query) ||
        tx.to.toLowerCase().includes(query) ||
        tx.id.toString().includes(query) ||
        tx.block_index?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [transactions, filters]);

  // Computed paginated transactions based on current pagination state
  const paginatedTransactions = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    return filteredTransactions.slice(startIndex, startIndex + pagination.pageSize);
  }, [filteredTransactions, pagination]);

  // Update total pages when filtered transactions change
  useEffect(() => {
    const totalPages = Math.ceil(filteredTransactions.length / pagination.pageSize);
    setPaginationState(prev => ({ ...prev, totalPages }));
  }, [filteredTransactions.length, pagination.pageSize]);

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

    // Enhanced stateful filtering and pagination
    filters,
    setFilters,
    clearFilters,
    pagination,
    setPagination,

    // Processed results
    filteredTransactions,
    paginatedTransactions,

    // Legacy filter methods (for backward compatibility)
    filterByType,
    filterByToken,
    filterByStatus,
    searchTransactions,
    getRecentTransactions,
  };
};