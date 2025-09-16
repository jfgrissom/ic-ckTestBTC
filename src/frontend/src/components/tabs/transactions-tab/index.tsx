import React, { useState, useMemo } from 'react';
import TransactionItem, { Transaction } from '@/components/shared/transaction-item';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  History,
  Search,
  Filter,
  RefreshCw,
  Download,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib';

interface TransactionsTabProps {
  transactions: Transaction[];
  loading: boolean;
  onRefreshTransactions: () => void;
}

type TransactionType = 'All' | 'Send' | 'Receive' | 'Deposit' | 'Withdraw';
type TokenFilter = 'All' | 'ICP' | 'ckTestBTC';
type StatusFilter = 'All' | 'Pending' | 'Confirmed' | 'Failed';

const TRANSACTIONS_PER_PAGE = 10;

const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions,
  loading,
  onRefreshTransactions,
}) => {
  const [typeFilter, setTypeFilter] = useState<TransactionType>('All');
  const [tokenFilter, setTokenFilter] = useState<TokenFilter>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter transactions based on all criteria
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      // Type filter
      if (typeFilter !== 'All' && transaction.tx_type !== typeFilter) {
        return false;
      }

      // Token filter
      if (tokenFilter !== 'All' && transaction.token !== tokenFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'All' && transaction.status !== statusFilter) {
        return false;
      }

      // Search filter (search in addresses and transaction details)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          transaction.from.toLowerCase().includes(query) ||
          transaction.to.toLowerCase().includes(query) ||
          transaction.id.toString().includes(query) ||
          transaction.block_index?.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [transactions, typeFilter, tokenFilter, statusFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / TRANSACTIONS_PER_PAGE);
  const startIndex = (currentPage - 1) * TRANSACTIONS_PER_PAGE;
  const paginatedTransactions = filteredTransactions.slice(
    startIndex,
    startIndex + TRANSACTIONS_PER_PAGE
  );

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, tokenFilter, statusFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = transactions.length;
    const pending = transactions.filter(tx => tx.status === 'Pending').length;
    const confirmed = transactions.filter(tx => tx.status === 'Confirmed').length;
    const failed = transactions.filter(tx => tx.status === 'Failed').length;
    const sends = transactions.filter(tx => tx.tx_type === 'Send').length;
    const receives = transactions.filter(tx => tx.tx_type === 'Receive').length;
    const deposits = transactions.filter(tx => tx.tx_type === 'Deposit').length;
    const withdrawals = transactions.filter(tx => tx.tx_type === 'Withdraw').length;

    return {
      total,
      pending,
      confirmed,
      failed,
      sends,
      receives,
      deposits,
      withdrawals,
    };
  }, [transactions]);

  const handleClearFilters = () => {
    setTypeFilter('All');
    setTokenFilter('All');
    setStatusFilter('All');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'Failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Send':
        return <TrendingUp className="h-4 w-4 text-red-600" />;
      case 'Receive':
        return <TrendingDown className="h-4 w-4 text-green-600" />;
      case 'Deposit':
        return <ArrowUpDown className="h-4 w-4 text-blue-600" />;
      case 'Withdraw':
        return <ArrowUpDown className="h-4 w-4 text-purple-600" />;
      default:
        return <History className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Transactions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
            <div className="text-sm text-gray-600">Confirmed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filters & Search</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={onRefreshTransactions}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by address, transaction ID, or block index..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Selects */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Transaction Type
              </label>
              <Select value={typeFilter} onValueChange={(value: TransactionType) => setTypeFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Types</SelectItem>
                  <SelectItem value="Send">Send</SelectItem>
                  <SelectItem value="Receive">Receive</SelectItem>
                  <SelectItem value="Deposit">Deposit</SelectItem>
                  <SelectItem value="Withdraw">Withdraw</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Token
              </label>
              <Select value={tokenFilter} onValueChange={(value: TokenFilter) => setTokenFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Tokens</SelectItem>
                  <SelectItem value="ICP">ICP</SelectItem>
                  <SelectItem value="ckTestBTC">ckTestBTC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Status
              </label>
              <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleClearFilters}
                variant="outline"
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Active Filters */}
          {(typeFilter !== 'All' || tokenFilter !== 'All' || statusFilter !== 'All' || searchQuery) && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600">Active filters:</span>
              {typeFilter !== 'All' && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  {getTypeIcon(typeFilter)}
                  <span>{typeFilter}</span>
                </Badge>
              )}
              {tokenFilter !== 'All' && (
                <Badge variant="secondary">{tokenFilter}</Badge>
              )}
              {statusFilter !== 'All' && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  {getStatusIcon(statusFilter)}
                  <span>{statusFilter}</span>
                </Badge>
              )}
              {searchQuery && (
                <Badge variant="secondary">
                  Search: "{searchQuery}"
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <History className="h-5 w-5" />
              <span>Transaction History</span>
              {filteredTransactions.length !== transactions.length && (
                <Badge variant="outline">
                  {filteredTransactions.length} of {transactions.length}
                </Badge>
              )}
            </div>
            <Button variant="outline" size="sm" disabled>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              <span className="text-gray-600">Loading transactions...</span>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History className="h-12 w-12 mx-auto mb-4 opacity-30" />
              {transactions.length === 0 ? (
                <>
                  <p className="text-lg font-medium">No transactions yet</p>
                  <p className="text-sm mt-1">
                    Your transaction history will appear here once you start using your wallet
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium">No transactions match your filters</p>
                  <p className="text-sm mt-1">
                    Try adjusting your search criteria or clearing filters
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedTransactions.map((transaction) => (
                <TransactionItem key={transaction.id} transaction={transaction} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1}-{Math.min(startIndex + TRANSACTIONS_PER_PAGE, filteredTransactions.length)} of {filteredTransactions.length}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Show first, last, current, and pages around current
                      return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                    })
                    .map((page, index, array) => {
                      // Add ellipsis between non-consecutive pages
                      const showEllipsis = index > 0 && page - array[index - 1] > 1;
                      return (
                        <React.Fragment key={page}>
                          {showEllipsis && <span className="text-gray-400">...</span>}
                          <Button
                            variant={page === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        </React.Fragment>
                      );
                    })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-gray-600 space-y-2">
            <h4 className="font-medium text-gray-800">Transaction Information</h4>
            <p>
              • <strong>Confirmed:</strong> Transaction has been processed and is irreversible
            </p>
            <p>
              • <strong>Pending:</strong> Transaction is being processed by the network
            </p>
            <p>
              • <strong>Failed:</strong> Transaction could not be completed
            </p>
            <p>
              • <strong>Block Index:</strong> Unique identifier for confirmed transactions
            </p>
            <p>
              • <strong>Timestamps:</strong> All times shown in your local timezone
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionsTab;