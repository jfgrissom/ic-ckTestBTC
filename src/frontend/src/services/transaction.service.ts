import { getBackend } from '@/services/backend.service';
// import { Transaction as BackendTransaction } from '@/declarations/backend/backend.did'; // TODO: Fix declarations path
// Temporary type definition until declarations are properly generated
interface BackendTransaction {
  id: string;
  amount: bigint;
  from_address: string;
  to_address: string;
  timestamp: bigint;
  block_index?: bigint[];
  // Additional properties that are accessed in the code
  tx_type: { Send?: null; Receive?: null; Deposit?: null; Withdraw?: null; Mint?: null };
  status: { Pending?: null; Confirmed?: null; Failed?: null };
  token: string;
  from: string;
  to: string;
}
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

const transformBackendTransaction = (backendTx: BackendTransaction): Transaction => {
  let txType: 'Send' | 'Receive' | 'Deposit' | 'Withdraw' | 'Mint';
  if ('Send' in backendTx.tx_type) txType = 'Send';
  else if ('Receive' in backendTx.tx_type) txType = 'Receive';
  else if ('Deposit' in backendTx.tx_type) txType = 'Deposit';
  else if ('Withdraw' in backendTx.tx_type) txType = 'Withdraw';
  else txType = 'Mint';

  let status: 'Pending' | 'Confirmed' | 'Failed';
  if ('Pending' in backendTx.status) status = 'Pending';
  else if ('Confirmed' in backendTx.status) status = 'Confirmed';
  else status = 'Failed';

  return {
    id: Number(backendTx.id),
    tx_type: txType,
    token: backendTx.token,
    amount: (Number(backendTx.amount) / 100000000).toFixed(8),
    from: backendTx.from,
    to: backendTx.to,
    status: status,
    timestamp: Number(backendTx.timestamp),
    block_index: backendTx.block_index && backendTx.block_index.length > 0 ? backendTx.block_index[0].toString() : undefined,
  };
};

export const getTransactionHistory = async (): Promise<TransactionServiceResult> => {
  const backendActor = await getBackend();

  if (!backendActor) {
    return { success: false, error: 'Backend not initialized' };
  }

  try {
    const result = await backendActor.get_transaction_history();
    const transactions = result.map(transformBackendTransaction);

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
};

export const getTransaction = async (id: number): Promise<TransactionResult> => {
  const backendActor = await getBackend();

  if (!backendActor) {
    return { success: false, error: 'Backend not initialized' };
  }

  try {
    if (!('get_transaction' in backendActor)) {
      console.warn('get_transaction method not implemented in backend');
      return {
        success: false,
        error: 'Transaction not found',
      };
    }

    const result = await backendActor.get_transaction(BigInt(id));

    if (result.length > 0) {
      const transaction = transformBackendTransaction(result[0]);
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
};

export const filterByType = (transactions: Transaction[], type: string): Transaction[] => {
  if (type === 'All') return transactions;
  return transactions.filter(tx => tx.tx_type === type);
};

export const filterByToken = (transactions: Transaction[], token: string): Transaction[] => {
  if (token === 'All') return transactions;
  return transactions.filter(tx => tx.token === token);
};

export const filterByStatus = (transactions: Transaction[], status: string): Transaction[] => {
  if (status === 'All') return transactions;
  return transactions.filter(tx => tx.status === status);
};

export const searchTransactions = (transactions: Transaction[], query: string): Transaction[] => {
  if (!query.trim()) return transactions;

  const searchTerm = query.toLowerCase();
  return transactions.filter(tx =>
    tx.from.toLowerCase().includes(searchTerm) ||
    tx.to.toLowerCase().includes(searchTerm) ||
    tx.id.toString().includes(searchTerm) ||
    (tx.block_index && tx.block_index.includes(searchTerm))
  );
};

export const getTransactionStats = (transactions: Transaction[]) => {
  const total = transactions.length;
  const confirmed = transactions.filter(tx => tx.status === 'Confirmed').length;
  const pending = transactions.filter(tx => tx.status === 'Pending').length;
  const failed = transactions.filter(tx => tx.status === 'Failed').length;

  return { total, confirmed, pending, failed };
};

export const getRecentTransactions = (transactions: Transaction[], limit: number = 5): Transaction[] => {
  return transactions
    .filter(tx => tx.tx_type === 'Send' || tx.tx_type === 'Receive')
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
};