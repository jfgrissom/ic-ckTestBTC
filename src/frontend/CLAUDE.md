# Frontend Development Standards

This document defines the development standards and architectural patterns for the ic-ckTestBTC frontend application.

## Component Structure Requirements

### Directory Organization

**MANDATORY**: All React components MUST follow the directory-per-component pattern:

```
src/components/
├── component-name/
│   ├── index.tsx          # Main component file
│   ├── index.test.tsx     # Unit tests (REQUIRED for all components)
│   ├── index.css          # Component-specific styles (if needed)
│   ├── types.ts           # Component-specific types (if needed)
│   └── utils.ts           # Component-specific utilities (if needed)
```

### Naming Conventions

**CRITICAL**: Strict naming rules that MUST be followed:

1. **Directory Names**:
   - ALWAYS use kebab-case for ALL component directories
   - Multi-word: `user-header/`, `balance-section/`, `send-modal/`
   - Single-word: `header/`, `footer/`, `modal/` (NOT Header/, Footer/, Modal/)
   - NO PascalCase directories allowed

2. **File Names**:
   - Main component: Always `index.tsx`
   - Tests: Always `index.test.tsx`
   - Types: `types.ts`
   - Utilities: `utils.ts`
   - Styles: `index.css` or `styles.ts` for styled-components

3. **Component Names** (inside files):
   - Use PascalCase for component names in code
   - Directory `user-header/` → Component `UserHeader`
   - Directory `modal/` → Component `Modal`

### Import/Export Patterns

```typescript
// index.tsx - Default export for main component
const UserHeader: React.FC<UserHeaderProps> = ({ ... }) => {
  // component implementation
};

export default UserHeader;

// Re-export types from types.ts
export type { UserHeaderProps } from './types';

// Named exports for utilities (if any)
export { formatUsername } from './utils';
```

### Non-Compliance Examples (What NOT to do)

❌ **WRONG** - Direct component files:
```
src/components/
├── LoginScreen.tsx        # WRONG: Should be login-screen/index.tsx
├── UserHeader.tsx         # WRONG: Should be user-header/index.tsx
└── BalanceSection.tsx     # WRONG: Should be balance-section/index.tsx
```

❌ **WRONG** - PascalCase directories:
```
src/components/
├── LoginScreen/           # WRONG: Should be login-screen/
├── UserHeader/            # WRONG: Should be user-header/
└── Modal/                 # WRONG: Should be modal/
```

✅ **CORRECT** - Proper structure:
```
src/components/
├── login-screen/
│   ├── index.tsx
│   └── index.test.tsx
├── user-header/
│   ├── index.tsx
│   └── index.test.tsx
└── modal/
    ├── index.tsx
    ├── index.test.tsx
    └── types.ts
```

## Frontend Architecture (Modular Design)

### Component Architecture
The frontend follows a **functional component architecture** with clear separation of concerns:

**Key Principles:**
- **Functional Components Only**: No class-based components - all React components use functional syntax with hooks
- **Custom Hooks**: Business logic encapsulated in reusable hooks (`useAuth`, `useWallet`, `useBackend`)
- **Service Layer**: Backend communication and business logic separated into service modules
- **Type Safety**: Comprehensive TypeScript interfaces for all data structures
- **Component Composition**: Small, focused components that compose into larger features

### Layer Responsibilities

1. **Components (`src/components/`)**
   - Pure UI rendering and user interaction
   - Receive data and callbacks as props
   - No direct backend communication or business logic
   - Component-specific CSS modules for styling

2. **Hooks (`src/hooks/`)**
   - State management and side effects
   - Orchestrate service layer calls
   - Provide clean APIs to components
   - Handle React lifecycle events

3. **Services (`src/services/`)**
   - Backend communication logic
   - Business logic implementation
   - **Stateless function modules with shared closure state**
   - Error handling and data transformation

4. **Types (`src/types/`)**
   - TypeScript interface definitions
   - Network configuration utilities
   - Prop and state type definitions
   - Ensure type safety across layers

### Error Handling
- **Browser Extension Error Filtering**: Intelligent error classification system that filters out extension-related errors while preserving application errors
- **User-Friendly Error Reporting**: Clean error boundaries that don't break on external script issues
- **Development Console Filtering**: Clean development experience with error type classification

## Modular Architecture Principles

### Component Responsibilities

**Components should ONLY handle:**
- UI rendering and presentation
- User interaction handling
- Local UI state (open/closed, hover, etc.)
- Delegating actions to hooks/services

**Components should NEVER contain:**
- Direct API calls
- Business logic calculations
- Data transformation logic
- Complex state management
- Validation logic (beyond simple UI validation like "field not empty")
- Amount calculations or conversions
- Filtering, sorting, or pagination logic
- Async operation orchestration
- Data fetching with useEffect

### Separation of Concerns

```typescript
// ❌ BAD - Business logic in component
const BalanceDisplay = () => {
  const [balance, setBalance] = useState('0');

  useEffect(() => {
    // Direct API call in component - WRONG
    fetch('/api/balance')
      .then(res => res.json())
      .then(data => {
        // Business logic in component - WRONG
        const formatted = (data.amount / 100000000).toFixed(8);
        setBalance(formatted);
      });
  }, []);

  return <div>{balance} ckTestBTC</div>;
};

// ✅ GOOD - Separated concerns
// hooks/use-balance.ts
const useBalance = () => {
  return useQuery({
    queryKey: ['balance'],
    queryFn: walletService.getBalance,
    select: (data) => formatCkTestBTC(data.amount)
  });
};

// components/balance-display/index.tsx
const BalanceDisplay = () => {
  const { data: balance } = useBalance();
  return <div>{balance}</div>;
};
```

### Common Architecture Violations to Avoid

#### ❌ VIOLATION: Transaction Filtering in Component
```typescript
// BAD - Component contains business logic
const TransactionList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  // WRONG - Business logic in component
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(tx => tx.type === filter || filter === 'all')
      .filter(tx => tx.description.includes(searchTerm))
      .sort((a, b) => b.date - a.date);
  }, [transactions, filter, searchTerm]);

  // WRONG - Pagination logic in component
  const paginatedTransactions = useMemo(() => {
    return filteredTransactions.slice(page * pageSize, (page + 1) * pageSize);
  }, [filteredTransactions, page, pageSize]);
}

// GOOD - All logic in hook
const TransactionList = () => {
  const {
    transactions,
    searchTerm,
    setSearchTerm,
    filter,
    setFilter,
    page,
    setPage
  } = useTransactionHistory();

  // Component only renders, no logic
  return <div>...</div>;
}
```

#### ❌ VIOLATION: Validation Logic in Modal Component
```typescript
// BAD - Modal contains validation
const SendModal = () => {
  // WRONG - Validation in component
  const validateInputs = () => {
    if (!isValidPrincipal(recipient)) {
      setError('Invalid Principal ID');
      return false;
    }
    if (parseFloat(amount) > balance) {
      setError('Insufficient balance');
      return false;
    }
    return true;
  };

  // WRONG - Amount calculation in component
  const handleMaxClick = () => {
    const maxAmount = balance - estimatedFee;
    setAmount(maxAmount.toString());
  };
}

// GOOD - Validation in hook
const SendModal = () => {
  const {
    validate,
    setMaxAmount,
    errors
  } = useWallet();

  return (
    <Modal>
      <button onClick={setMaxAmount}>Max</button>
      {errors.recipient && <span>{errors.recipient}</span>}
    </Modal>
  );
}
```

#### ❌ VIOLATION: Async Operations in Component
```typescript
// BAD - Component manages async state
const DepositModal = () => {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  // WRONG - Async orchestration in component
  useEffect(() => {
    setLoading(true);
    fetchDepositAddress()
      .then(addr => setAddress(addr))
      .finally(() => setLoading(false));
  }, []);
}

// GOOD - Hook manages async state
const DepositModal = () => {
  const { depositAddress, loading } = useDepositWithdrawal();

  return (
    <Modal>
      {loading ? 'Loading...' : depositAddress}
    </Modal>
  );
}
```

### Reusability Patterns

1. **Custom Hooks** (`src/hooks/`):
   - Data fetching and state management
   - Business logic and calculations
   - Side effects and subscriptions

2. **Service Modules** (`src/services/`):
   - API communication
   - Data transformation
   - External integrations
   - Functional modules, NOT classes

3. **Utility Functions** (`src/lib/utils/`):
   - Pure functions for formatting
   - Validation helpers
   - Common calculations

4. **Shared Components** (`src/components/shared/`):
   - Reusable UI elements
   - Common patterns (modals, forms, etc.)
   - Layout components

## Service Layer Pattern (Functional Paradigm)

Services MUST use functional modules with closure-based state management. **NO CLASS-BASED SERVICES.**

### ✅ CORRECT - Functional Module Pattern

```typescript
// deposit-withdrawal.service.ts
import { BackendActor } from '@/types/backend.types';
import { getBackend } from './backend.service';

// Module-level closure state
let backendActor: BackendActor | null = null;

// Exported functions instead of class methods
export const setBackendActor = (actor: BackendActor): void => {
  backendActor = actor;
};

export const getDepositAddress = async (): Promise<DepositWithdrawalResult> => {
  const backend = backendActor || getBackend();

  if (!backend) {
    return { success: false, error: 'Backend not initialized' };
  }

  try {
    const result = await backend.get_deposit_address();
    return { success: true, data: result.Ok };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Pure utility functions
export const validateTestBTCAddress = (address: string): ValidationResult => {
  // Pure function - no side effects
  const bech32Regex = /^tb1q[ac-hj-np-z02-9]{38,58}$/;
  return bech32Regex.test(address)
    ? { valid: true }
    : { valid: false, error: 'Invalid address format' };
};
```

### ❌ INCORRECT - Class-based Singleton Pattern

```typescript
// DON'T DO THIS - Avoid class-based services
class DepositWithdrawalService {
  private static instance: DepositWithdrawalService;
  private backendActor: BackendActor | null = null;

  private constructor() {}

  static getInstance(): DepositWithdrawalService {
    if (!DepositWithdrawalService.instance) {
      DepositWithdrawalService.instance = new DepositWithdrawalService();
    }
    return DepositWithdrawalService.instance;
  }

  setBackendActor(actor: BackendActor): void {
    this.backendActor = actor;
  }
}

// WRONG - Don't export class instances
export const depositWithdrawalService = DepositWithdrawalService.getInstance();
```

### Key Principles for Services

1. **Use module-level variables** for shared state (closure pattern)
2. **Export individual functions**, not class instances
3. **Keep functions pure** when possible (no side effects)
4. **Use composition** over inheritance
5. **Maintain immutability** where practical

### Benefits of Functional Services

- **Tree-shakeable**: Unused functions can be eliminated during build
- **Testable**: Individual functions are easier to test in isolation
- **Composable**: Functions can be easily combined and reused
- **No `this` confusion**: Eliminates binding issues and context problems
- **Simpler mental model**: No need to track instance state or lifecycle

## Tab-Based Architecture

For the multi-tab wallet interface, follow this structure:

```
src/components/
├── tabs/
│   ├── information-tab/
│   │   ├── index.tsx
│   │   └── index.test.tsx
│   ├── deposits-withdrawals-tab/
│   │   ├── index.tsx
│   │   └── index.test.tsx
│   ├── send-receive-tab/
│   │   ├── index.tsx
│   │   └── index.test.tsx
│   └── transactions-tab/
│       ├── index.tsx
│       └── index.test.tsx
├── modals/
│   ├── deposit-modal/
│   │   ├── index.tsx
│   │   ├── index.test.tsx
│   │   └── types.ts
│   ├── withdraw-modal/
│   │   ├── index.tsx
│   │   └── index.test.tsx
│   ├── send-modal/
│   │   ├── index.tsx
│   │   ├── index.test.tsx
│   │   └── types.ts
│   └── receive-modal/
│       ├── index.tsx
│       └── index.test.tsx
└── shared/
    ├── qr-code/
    │   ├── index.tsx
    │   └── index.test.tsx
    ├── token-balance/
    │   ├── index.tsx
    │   └── index.test.tsx
    └── transaction-list/
        ├── index.tsx
        └── index.test.tsx
```

## Quality Requirements

### Before Implementation
1. **Search for existing functionality** using Grep/Glob
2. **Evaluate reuse vs create** for similar components
3. **Plan extraction strategy** for reusable logic

### After Implementation
1. **All components MUST have tests** in `index.test.tsx`
2. **Run quality checks**:
   ```bash
   npm run lint          # Must pass with 0 errors
   npm run type-check    # Must compile successfully
   npm test             # All tests must pass
   ```
3. **Follow the component structure** exactly as specified

## Migration Strategy

When refactoring existing components to follow these standards:

1. Create the new directory structure
2. Move component code to `index.tsx`
3. Extract types to `types.ts`
4. Extract utilities to `utils.ts`
5. Add comprehensive tests in `index.test.tsx`
6. Update all imports throughout the codebase
7. Delete the old component file

## Enforcement

**BLOCKING**: No pull request will be accepted that:
- Has components as direct `.tsx` files instead of directories
- Uses PascalCase for directory names
- Lacks test files for components
- Contains business logic directly in components
- Fails lint, type-check, or test commands

## Import Path Requirements

### **MANDATORY: Use Path Aliases - NO Relative Imports**

**CRITICAL RULE**: All imports MUST use the `@/` path alias. Relative imports (`../`, `./`) are FORBIDDEN except for imports within the same component directory.

**✅ CORRECT Import Patterns:**
```typescript
// Types
import { LoginScreenProps } from '@/types/auth.types';
import { WalletState } from '@/types/wallet.types';

// Shared Components
import TokenBalance from '@/components/shared/token-balance';
import QRCode from '@/components/shared/qr-code';

// UI Components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Services
import { getBalance } from '@/services/wallet.service';
import { initAuth } from '@/services/auth.service';

// Hooks
import { useAuth } from '@/hooks/useAuth';

// Utilities
import { cn } from '@/lib';
```

**❌ FORBIDDEN Import Patterns:**
```typescript
// NEVER use relative paths - NO EXCEPTIONS
import { LoginScreenProps } from '../../../types/auth.types';  // WRONG
import TokenBalance from '../../shared/token-balance';         // WRONG
import { getBalance } from '../services/wallet.service';       // WRONG
import { ComponentSpecificType } from './types';               // WRONG
import { helperFunction } from './utils';                      // WRONG
```

**NO EXCEPTIONS**: ALL imports must use @/ path aliases, even for same-directory imports.

### **Path Alias Configuration**

The project is configured with these aliases in `tsconfig.json`:
- `@/*` → `src/frontend/src/*`
- `@/components/` → `src/frontend/src/components/`
- `@/services/` → `src/frontend/src/services/`
- `@/types/` → `src/frontend/src/types/`
- `@/hooks/` → `src/frontend/src/hooks/`
- `@/lib/` → `src/frontend/src/lib/`

## Frontend File Organization Standards

### Directory Naming Convention

**IMPORTANT**: All utility modules must follow the directory-per-module pattern:

- ✅ **Correct**: `src/lib/utils/error-filters/index.ts`
- ✅ **Correct**: `src/lib/utils/styles/index.ts`
- ❌ **Incorrect**: `src/lib/utils/error-filter.ts`
- ❌ **Incorrect**: `src/lib/utils/styles.ts`

**Rules**:
1. Each utility module gets its own directory under `src/lib/utils/`
2. The main export file is always named `index.ts`
3. Use plural directory names (e.g., `error-filters`, `styles`, `validators`)
4. Export from directories, not files directly

**Benefits**:
- **Scalability**: Easy to add related utilities to the same module
- **Consistency**: Uniform import patterns across the application
- **Organization**: Clear separation of concerns
- **Extensibility**: Room for growth without refactoring

**Import Examples**:
```typescript
// ✅ Good - imports from directory
import { setupErrorFiltering } from '@/lib/utils/error-filters'
import { cn } from '@/lib/utils/styles'

// ✅ Also good - using the centralized lib index
import { setupErrorFiltering, cn } from '@/lib'
```

This convention applies to all utility modules in the frontend codebase.

## Architecture Violation Severity Levels

### 🔴 SEVERE Violations (Must Fix Immediately)
- Components containing data filtering, sorting, or pagination logic
- Components with complex state management using multiple useState/useMemo
- Business logic calculations directly in component render methods

### 🟠 HIGH Violations (Fix Before Merge)
- Validation logic beyond simple "field not empty" checks
- Amount calculations or data transformations in components
- Components that re-implement utility functions locally

### 🟡 MODERATE Violations (Fix in Next Iteration)
- Components managing async operation states (loading, error)
- Direct useEffect for data fetching instead of using hooks
- Components orchestrating multiple service calls

### 🟢 MINOR Violations (Code Review Note)
- Not using shared utilities from @/lib
- Duplicating formatters or helpers across components

## Enforcement

**BLOCKING**: No pull request will be accepted that contains:
- Relative imports using `../` or complex `./` paths
- Direct file paths that could use aliases
- Class-based service implementations
- Services not following functional module patterns
- **Components with embedded business logic (SEVERE/HIGH violations)**
- **Components performing data transformations or calculations**
- **Components containing validation beyond UI-level checks**
- **Components with filtering, sorting, or pagination logic**

### Code Review Checklist for Components
- [ ] Component only handles UI rendering and user interactions
- [ ] All business logic is delegated to hooks
- [ ] No data transformations in the component
- [ ] No validation logic beyond simple UI validation
- [ ] Uses shared utilities from @/lib
- [ ] Async operations managed by hooks, not component
- [ ] No complex state management with multiple useState/useMemo

This structure ensures consistency, maintainability, and scalability across the entire frontend codebase.