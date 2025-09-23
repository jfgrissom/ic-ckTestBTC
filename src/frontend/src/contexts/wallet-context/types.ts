import { WalletStatus } from '@/services/wallet.service';
import { Transaction } from '@/services/transaction.service';

// Core wallet state
export interface WalletState {
  // Authentication & Backend
  isAuthenticated: boolean;
  principal: string | null;
  backendReady: boolean;

  // Wallet Data
  walletStatus: WalletStatus | null;
  btcAddress: string;

  // Transactions
  transactions: Transaction[];
  transactionStats: {
    total: number;
    confirmed: number;
    pending: number;
    failed: number;
  };

  // Deposit/Withdrawal
  depositAddress: string;

  // Loading States (consolidated)
  loading: {
    initial: boolean;      // First-time data loading
    wallet: boolean;       // Wallet operations (balance, status)
    transactions: boolean; // Transaction operations
    operations: boolean;   // Send/receive/deposit/withdraw operations
  };

  // Error States
  errors: {
    wallet: string | null;
    transactions: string | null;
    operations: string | null;
    initialization: string | null; // New: Track initialization errors
  };

  // Initialization Flag
  initialized: boolean;
}

// Wallet actions
export type WalletAction =
  | { type: 'AUTH_CHANGED'; payload: { isAuthenticated: boolean; principal: string | null } }
  | { type: 'BACKEND_READY' }
  | { type: 'BACKEND_NOT_READY' }
  | { type: 'INITIALIZE_START' } // New: Track initialization start
  | { type: 'INITIALIZE_SUCCESS' } // New: Track successful initialization
  | { type: 'INITIALIZE_ERROR'; payload: string } // New: Track initialization errors
  | { type: 'LOAD_WALLET_START' }
  | { type: 'LOAD_WALLET_SUCCESS'; payload: WalletStatus }
  | { type: 'LOAD_WALLET_ERROR'; payload: string }
  | { type: 'LOAD_TRANSACTIONS_START' }
  | { type: 'LOAD_TRANSACTIONS_SUCCESS'; payload: { transactions: Transaction[]; stats: WalletState['transactionStats'] } }
  | { type: 'LOAD_TRANSACTIONS_ERROR'; payload: string }
  | { type: 'SET_BTC_ADDRESS'; payload: string }
  | { type: 'SET_DEPOSIT_ADDRESS'; payload: string }
  | { type: 'START_OPERATION'; payload?: string }
  | { type: 'OPERATION_SUCCESS'; payload?: { refreshWallet?: boolean; refreshTransactions?: boolean } }
  | { type: 'OPERATION_ERROR'; payload: string }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SET_INITIALIZED' };

// Context value type
export interface WalletContextValue {
  state: WalletState;
  dispatch: React.Dispatch<WalletAction>;
}

// Transfer capabilities interface
export interface TransferCapabilities {
  canSendPersonalToUser: boolean;      // FEATURES.md scenario 1
  canDepositToCustody: boolean;        // FEATURES.md scenario 2
  canSendCustodialToUser: boolean;     // FEATURES.md scenario 3
  canSendCustodialToCustodial: boolean; // FEATURES.md scenario 4

  hasAnyFunds: boolean;
  hasPersonalFunds: boolean;
  hasCustodialFunds: boolean;

  personalBalance: string;
  custodialBalance: string;
  totalAvailable: string;
}

// Deposit/Withdrawal capabilities
export interface DepositWithdrawalCapabilities {
  canWithdrawFromCustodial: boolean;
  canWithdrawFromPersonal: boolean;
  canDepositFromCustodial: boolean;
  canDepositFromPersonal: boolean;
  canCreateBtcAccount: boolean;
  canDeposit: boolean;

  custodialBalance: string;
  personalBalance: string;
  hasWithdrawableFunds: boolean;
  requiresSubaccountCreation: boolean;
  requiresBtcAddressCreation: boolean;
}