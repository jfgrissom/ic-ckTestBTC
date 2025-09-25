import { WalletState, WalletAction } from './types';

// Initial state
export const initialWalletState: WalletState = {
  // Authentication & Backend
  isAuthenticated: false,
  principal: null,
  backendReady: false,

  // Wallet Data
  walletStatus: null,
  btcAddress: '',

  // Transactions
  transactions: [],
  transactionStats: {
    total: 0,
    confirmed: 0,
    pending: 0,
    failed: 0,
  },

  // Deposit/Withdrawal
  depositAddress: '',

  // Loading States
  loading: {
    initial: false,
    wallet: false,
    transactions: false,
    operations: false,
  },

  // Error States
  errors: {
    wallet: null,
    transactions: null,
    operations: null,
    initialization: null,
  },

  // Initialization
  initialized: false,
};

// Wallet reducer
export const walletReducer = (state: WalletState, action: WalletAction): WalletState => {
  switch (action.type) {
    case 'AUTH_CHANGED':
      // Handle authentication state changes
      if (!action.payload.isAuthenticated) {
        // User logged out - reset to initial state
        return {
          ...initialWalletState,
          isAuthenticated: false,
          principal: null,
        };
      }

      // Check if this is a different user logging in
      const isDifferentUser = state.principal &&
                              state.principal !== action.payload.principal;

      // User logged in - prepare for data loading but don't start loading yet
      // If it's a different user, clear previous user's data
      return {
        ...(isDifferentUser ? initialWalletState : state),
        isAuthenticated: action.payload.isAuthenticated,
        principal: action.payload.principal,
        loading: {
          ...initialWalletState.loading,
          initial: false, // Reset loading state - initialization will set this when it starts
        },
        errors: {
          wallet: null,
          transactions: null,
          operations: null,
          initialization: null,
        },
        initialized: false,
      };

    case 'BACKEND_READY':
      return {
        ...state,
        backendReady: true,
      };

    case 'BACKEND_NOT_READY':
      return {
        ...state,
        backendReady: false,
        initialized: false,
      };

    case 'INITIALIZE_START':
      return {
        ...state,
        loading: {
          ...state.loading,
          initial: true,
        },
        errors: {
          ...state.errors,
          initialization: null,
        },
        initialized: false,
      };

    case 'INITIALIZE_SUCCESS':
      return {
        ...state,
        loading: {
          ...state.loading,
          initial: false,
        },
        errors: {
          ...state.errors,
          initialization: null,
        },
        initialized: true,
      };

    case 'INITIALIZE_ERROR':
      return {
        ...state,
        loading: {
          ...state.loading,
          initial: false,
        },
        errors: {
          ...state.errors,
          initialization: action.payload,
        },
        initialized: false,
      };

    case 'LOAD_WALLET_START':
      return {
        ...state,
        loading: {
          ...state.loading,
          wallet: true,
        },
        errors: {
          ...state.errors,
          wallet: null,
        },
      };

    case 'LOAD_WALLET_SUCCESS':
      return {
        ...state,
        walletStatus: action.payload,
        loading: {
          ...state.loading,
          wallet: false,
          initial: false, // Initial loading complete once wallet loads
        },
        errors: {
          ...state.errors,
          wallet: null,
        },
        initialized: true,
      };

    case 'LOAD_WALLET_ERROR':
      return {
        ...state,
        loading: {
          ...state.loading,
          wallet: false,
          initial: false,
        },
        errors: {
          ...state.errors,
          wallet: action.payload,
        },
        // Set default wallet status on error to ensure UI displays
        walletStatus: state.walletStatus || {
          custodialBalance: '0.00000000',
          personalBalance: '0.00000000',
          totalAvailable: '0.00000000',
          canDeposit: false,
        },
        initialized: true,
      };

    case 'LOAD_TRANSACTIONS_START':
      return {
        ...state,
        loading: {
          ...state.loading,
          transactions: true,
        },
        errors: {
          ...state.errors,
          transactions: null,
        },
      };

    case 'LOAD_TRANSACTIONS_SUCCESS':
      return {
        ...state,
        transactions: action.payload.transactions,
        transactionStats: action.payload.stats,
        loading: {
          ...state.loading,
          transactions: false,
        },
        errors: {
          ...state.errors,
          transactions: null,
        },
      };

    case 'LOAD_TRANSACTIONS_ERROR':
      return {
        ...state,
        loading: {
          ...state.loading,
          transactions: false,
        },
        errors: {
          ...state.errors,
          transactions: action.payload,
        },
      };

    case 'SET_BTC_ADDRESS':
      return {
        ...state,
        btcAddress: action.payload,
      };

    case 'SET_DEPOSIT_ADDRESS':
      return {
        ...state,
        depositAddress: action.payload,
      };

    case 'START_OPERATION':
      return {
        ...state,
        loading: {
          ...state.loading,
          operations: true,
        },
        errors: {
          ...state.errors,
          operations: null,
        },
      };

    case 'OPERATION_SUCCESS':
      return {
        ...state,
        loading: {
          ...state.loading,
          operations: false,
        },
        errors: {
          ...state.errors,
          operations: null,
        },
        // Note: Actual data refresh is handled by action creators
      };

    case 'OPERATION_ERROR':
      return {
        ...state,
        loading: {
          ...state.loading,
          operations: false,
        },
        errors: {
          ...state.errors,
          operations: action.payload,
        },
      };

    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: {
          wallet: null,
          transactions: null,
          operations: null,
          initialization: null,
        },
      };

    case 'SET_INITIALIZED':
      return {
        ...state,
        initialized: true,
      };

    default:
      return state;
  }
};