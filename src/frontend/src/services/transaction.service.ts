import { BackendActor } from '@/types/backend.types';

// Import and re-export Transaction type from shared component for consistency
import { Transaction } from '@/components/shared/transaction-item';
export type { Transaction } from '@/components/shared/transaction-item';

interface TransactionServiceResult {
  success: boolean;
  data?: Transaction[];
  error?: string;
}

interface TransactionResult {
  success: boolean;
  data?: Transaction;
  error?: string;
}

// Define the backend transaction type to match our Rust backend
interface BackendTransaction {
  id: number;
  tx_type: { Send?: null; Receive?: null; Deposit?: null; Withdraw?: null };
  token: string;
  amount: bigint;
  from: string;
  to: string;
  status: { Pending?: null; Confirmed?: null; Failed?: null };
  timestamp: bigint;
  block_index?: bigint;
}

class TransactionService {
  private backendActor: BackendActor | null = null;

  setBackendActor(actor: BackendActor): void {
    this.backendActor = actor;
  }

  async getTransactionHistory(): Promise<TransactionServiceResult> {
    if (!this.backendActor) {
      return { success: false, error: 'Backend not initialized' };
    }

    try {
      // Check if the method exists in the backend
      if (!('get_transaction_history' in this.backendActor)) {
        console.warn('get_transaction_history method not implemented in backend');
        return {
          success: true,
          data: [], // Return empty array for now
        };
      }

      const result = await (this.backendActor as any).get_transaction_history();

      // Transform backend transactions to frontend format
      const transactions = result.map(this.transformBackendTransaction);

      return {
        success: true,
        data: transactions,
      };
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getTransaction(id: number): Promise<TransactionResult> {
    if (!this.backendActor) {
      return { success: false, error: 'Backend not initialized' };
    }

    try {
      // Check if the method exists in the backend
      if (!('get_transaction' in this.backendActor)) {
        console.warn('get_transaction method not implemented in backend');
        return {
          success: false,
          error: 'Transaction not found',
        };
      }

      const result = await (this.backendActor as any).get_transaction(BigInt(id));

      if (result.length > 0) {
        const transaction = this.transformBackendTransaction(result[0]);
        return {
          success: true,
          data: transaction,
        };
      } else {
        return {
          success: false,
          error: 'Transaction not found',
        };
      }
    } catch (error) {
      console.error('Failed to get transaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private transformBackendTransaction(backendTx: BackendTransaction): Transaction {
    // Transform transaction type
    let txType: 'Send' | 'Receive' | 'Deposit' | 'Withdraw';
    if ('Send' in backendTx.tx_type) txType = 'Send';
    else if ('Receive' in backendTx.tx_type) txType = 'Receive';
    else if ('Deposit' in backendTx.tx_type) txType = 'Deposit';
    else txType = 'Withdraw';

    // Transform status
    let status: 'Pending' | 'Confirmed' | 'Failed';
    if ('Pending' in backendTx.status) status = 'Pending';
    else if ('Confirmed' in backendTx.status) status = 'Confirmed';
    else status = 'Failed';

    return {
      id: backendTx.id,
      tx_type: txType,
      token: backendTx.token,
      amount: backendTx.amount.toString(),
      from: backendTx.from,
      to: backendTx.to,
      status: status,
      timestamp: Number(backendTx.timestamp),
      block_index: backendTx.block_index?.toString(),
    };
  }

  // Filter transactions by type
  filterByType(transactions: Transaction[], type: string): Transaction[] {
    if (type === 'All') return transactions;
    return transactions.filter(tx => tx.tx_type === type);
  }

  // Filter transactions by token
  filterByToken(transactions: Transaction[], token: string): Transaction[] {
    if (token === 'All') return transactions;
    return transactions.filter(tx => tx.token === token);
  }

  // Filter transactions by status
  filterByStatus(transactions: Transaction[], status: string): Transaction[] {
    if (status === 'All') return transactions;
    return transactions.filter(tx => tx.status === status);
  }

  // Search transactions
  searchTransactions(transactions: Transaction[], query: string): Transaction[] {
    if (!query.trim()) return transactions;

    const searchTerm = query.toLowerCase();
    return transactions.filter(tx =>
      tx.from.toLowerCase().includes(searchTerm) ||
      tx.to.toLowerCase().includes(searchTerm) ||
      tx.id.toString().includes(searchTerm) ||
      (tx.block_index && tx.block_index.includes(searchTerm))
    );
  }

  // Get transaction statistics
  getTransactionStats(transactions: Transaction[]) {
    const total = transactions.length;
    const confirmed = transactions.filter(tx => tx.status === 'Confirmed').length;
    const pending = transactions.filter(tx => tx.status === 'Pending').length;
    const failed = transactions.filter(tx => tx.status === 'Failed').length;

    return { total, confirmed, pending, failed };
  }

  // Get recent transactions (for send/receive tab)
  getRecentTransactions(transactions: Transaction[], limit: number = 5): Transaction[] {
    return transactions
      .filter(tx => tx.tx_type === 'Send' || tx.tx_type === 'Receive')
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }
}

export const transactionService = new TransactionService();

// Export methods for use in hooks
export const getTransactionHistory = () => transactionService.getTransactionHistory();
export const getTransaction = (id: number) => transactionService.getTransaction(id);