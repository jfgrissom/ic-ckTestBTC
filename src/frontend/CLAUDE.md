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

## TypeScript Standards

### **CRITICAL RULE: NEVER Use `any` Type**

**MANDATORY**: The `any` type is STRICTLY FORBIDDEN in this TypeScript codebase. This undermines type safety and defeats the purpose of using TypeScript.

#### ❌ **FORBIDDEN - Using `any` Type**
```typescript
// NEVER DO THIS - Completely defeats TypeScript purpose
let actor: any = null;
const result: any = await someFunction();
const data: any = response.json();

// WRONG - Casting to any instead of proper typing
const ledgerActor = actor as any;
const idlFactory = factory as any;
```

#### ✅ **CORRECT - Proper TypeScript Patterns**

**1. Use Specific Interface Types:**
```typescript
// Define proper interfaces
interface BackendActor {
  get_balance(): Promise<Result<bigint, string>>;
  transfer(to: Principal, amount: bigint): Promise<Result<bigint, string>>;
}

// Use the interface
let backendActor: BackendActor | null = null;
```

**2. Use Generic Constraints:**
```typescript
// Generic with constraints instead of any
interface ActorService<T extends Record<string, (...args: any[]) => any>> {
  actor: T | null;
  setActor: (actor: T) => void;
}

// Usage with specific actor type
const ledgerService: ActorService<LedgerActor> = {
  actor: null,
  setActor: (actor: LedgerActor) => { this.actor = actor; }
};
```

**3. Use Union Types for Multiple Possibilities:**
```typescript
// Instead of any, use union types
type ApiResponse = SuccessResponse | ErrorResponse | LoadingResponse;
type ActorState = ConnectedActor | DisconnectedActor | InitializingActor;
```

**4. Use `unknown` for Truly Unknown Data:**
```typescript
// Use unknown instead of any for external data
const parseExternalData = (data: unknown): ValidatedData => {
  if (typeof data === 'object' && data !== null && 'field' in data) {
    return data as ValidatedData;
  }
  throw new Error('Invalid data structure');
};
```

**5. Proper IDL Factory Typing:**
```typescript
// For IDL factories, use proper DFX-generated types
import type { IDL } from '@dfinity/candid';

interface CanisterConfig {
  canisterId: string;
  idlFactory: IDL.InterfaceFactory;
  createActor: (canisterId: string, options?: ActorConfig) => Actor;
}

// Use the properly typed config
const ledgerConfig: CanisterConfig = {
  canisterId: mockLedger.canisterId,
  idlFactory: mockLedger.idlFactory,
  createActor: mockLedger.createActor
};
```

#### **Exception Handling Without `any`**

```typescript
// ❌ WRONG - Using any for errors
catch (error: any) {
  console.error(error.message);
}

// ✅ CORRECT - Proper error typing
catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(message);
}

// ✅ EVEN BETTER - Custom error types
interface ApiError {
  message: string;
  code?: number;
  details?: string;
}

const handleApiError = (error: unknown): ApiError => {
  if (error instanceof Error) {
    return { message: error.message };
  }
  return { message: 'An unknown error occurred' };
};
```

#### **Type Assertion Guidelines**

When you must assert types, use specific assertions:

```typescript
// ❌ WRONG - Asserting to any
const result = response as any;

// ✅ CORRECT - Specific type assertion with validation
const assertBackendActor = (actor: unknown): BackendActor => {
  if (!actor || typeof actor !== 'object') {
    throw new Error('Invalid actor: not an object');
  }

  if (!('get_balance' in actor) || typeof actor.get_balance !== 'function') {
    throw new Error('Invalid actor: missing get_balance method');
  }

  return actor as BackendActor;
};
```

#### **Gradual Typing Migration Pattern**

For legacy code that needs proper typing:

```typescript
// Step 1: Replace any with unknown
// OLD: let data: any;
let data: unknown;

// Step 2: Add type guards
const isValidData = (data: unknown): data is ExpectedType => {
  return typeof data === 'object' && data !== null && 'requiredField' in data;
};

// Step 3: Use proper types
if (isValidData(data)) {
  // TypeScript now knows data is ExpectedType
  console.log(data.requiredField);
}
```

### **Enforcement**

**BLOCKING**: Any pull request containing `any` types will be **immediately rejected**. No exceptions.

**Code Review Checklist:**
- [ ] Zero occurrences of `any` type in code
- [ ] All function parameters have explicit types
- [ ] All function return types are declared
- [ ] External data properly validated before use
- [ ] Error handling uses proper TypeScript patterns
- [ ] IDL factories use proper DFX-generated types

### **Benefits of Strict TypeScript**

1. **🛡 Type Safety**: Catch errors at compile time, not runtime
2. **📖 Documentation**: Types serve as living documentation
3. **🔧 Refactoring**: Safe refactoring with IDE support
4. **🧠 IntelliSense**: Better autocomplete and code suggestions
5. **🐛 Bug Prevention**: Prevent null/undefined errors
6. **👥 Team Consistency**: Clear contracts between code modules

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
4. **Zero `any` types** - TypeScript compilation must be strict

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

## Validation Architecture

### Validation Layer Structure

**MANDATORY**: All validation logic MUST use the shared validation layer in `src/lib/utils/validators/`:

```
src/lib/utils/validators/
├── addresses/           # Address validation (Principal, TestBTC, Email)
│   ├── index.ts        # Main validators and exports
│   ├── types.ts        # Validation result types
│   └── index.test.ts   # Comprehensive tests
├── amounts/            # Amount/balance validation with BigInt conversion
│   ├── index.ts        # Amount validation and conversion utilities
│   ├── types.ts        # Amount validation types
│   └── index.test.ts   # Amount validation tests
├── tokens/             # Token-specific rules and constants
│   ├── index.ts        # Token utilities and helpers
│   ├── constants.ts    # Token constants (decimals, fees, limits)
│   ├── types.ts        # Token types and interfaces
│   └── index.test.ts   # Token validation tests
└── forms/              # Form validation helpers and state management
    ├── index.ts        # Form validation utilities
    ├── types.ts        # Form validation types
    └── index.test.ts   # Form validation tests
```

### Established Library Usage

**CRITICAL**: Always use established libraries for common validation:

1. **IC Principal Validation**: Use `@dfinity/principal`
2. **BigInt Operations**: Use native BigInt with proper error handling
3. **Email Validation**: Use `validator.js`
4. **Form Validation**: Use built-in form validation helpers

### Validation Patterns

```typescript
// ✅ CORRECT - Using shared validators from @/lib
import {
  validatePrincipalAddress,
  validateAndConvertAmount,
  validateForm,
  TokenType
} from '@/lib';

const validateSendInputs = (recipient: string, amount: string, token: TokenType, balance: string) => {
  return validateForm({ recipient, amount, token }, [
    {
      field: 'recipient',
      validator: validatePrincipalAddress,
      required: true,
      label: 'Recipient'
    },
    {
      field: 'amount',
      validator: (amt) => validateAndConvertAmount(amt, {
        balance,
        token,
        includesFees: true
      }),
      required: true,
      label: 'Amount'
    }
  ]);
};

// ❌ WRONG - Inline validation in components/hooks
const validateInputs = () => {
  if (!recipient.match(/^[a-z0-9-]+$/)) { // WRONG - should use validatePrincipalAddress
    return { valid: false, error: 'Invalid format' };
  }

  if (parseFloat(amount) > parseFloat(balance)) { // WRONG - should use validateAndConvertAmount
    return { valid: false, error: 'Insufficient balance' };
  }

  // More inline validation... BAD
};
```

### Address Validation Examples

```typescript
// Principal ID validation with @dfinity/principal
import { validatePrincipalAddress } from '@/lib';

const result = validatePrincipalAddress('rdmx6-jaaaa-aaaah-qcaiq-cai');
if (result.valid) {
  console.log('Normalized:', result.normalizedAddress);
  console.log('Type:', result.addressType); // 'principal'
} else {
  console.error('Error:', result.error);
  console.error('Details:', result.details);
}

// TestBTC address validation
import { validateTestBTCAddress } from '@/lib';

const testBTCResult = validateTestBTCAddress('tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
// Supports: tb1q... (bech32), 2... (P2SH), m.../n... (legacy)
```

### Amount Validation with BigInt Conversion

```typescript
// Comprehensive amount validation with conversion
import { validateAndConvertAmount, TokenType } from '@/lib';

const result = validateAndConvertAmount('0.00123456', {
  balance: '1000000000', // Balance in smallest units (satoshis)
  token: 'ckTestBTC' as TokenType,
  includesFees: true,
  operationType: 'TRANSFER'
});

if (result.valid) {
  console.log('Converted amount:', result.convertedAmount); // BigInt in satoshis
  console.log('Formatted amount:', result.formattedAmount); // '0.00123456'
  console.log('Max available:', result.maxAvailable); // After fees
  console.log('Required fee:', result.requiredFee); // '0.00001 ckTestBTC'
} else {
  console.error('Validation failed:', result.error);
}
```

### Token Configuration Usage

```typescript
// Access token constants and utilities
import {
  TokenType,
  getTokenConfig,
  formatTokenAmount,
  calculateMaxAvailable,
  TOKEN_CONSTANTS
} from '@/lib';

const token: TokenType = 'ckTestBTC';
const config = getTokenConfig(token);

console.log('Min transfer:', config.minTransfer); // '0.00001'
console.log('Decimals:', config.decimals);        // 8
console.log('Fee:', config.fee);                  // '0.00001'

// Format amounts from smallest units
const formatted = formatTokenAmount('12345678', token); // 0.12345678
const maxSendable = calculateMaxAvailable('100000000', token); // Including fees
```

### Form Validation Usage

```typescript
// Complete form validation with multiple fields
import { validateForm, FormValidationRule } from '@/lib';

interface SendFormData {
  recipient: string;
  amount: string;
  token: TokenType;
}

const rules: FormValidationRule<SendFormData>[] = [
  {
    field: 'recipient',
    validator: validatePrincipalAddress,
    required: true,
    label: 'Recipient'
  },
  {
    field: 'amount',
    validator: (amount, formData) => validateAndConvertAmount(amount, {
      balance: getCurrentBalance(formData?.token || 'ckTestBTC'),
      token: formData?.token || 'ckTestBTC',
      includesFees: true
    }),
    required: true,
    label: 'Amount',
    dependsOn: ['token'] // Amount validation depends on token selection
  }
];

const result = validateForm(formData, rules);
if (!result.valid) {
  // result.errors contains field-specific error messages
  // result.details contains additional validation details
}
```

### Validation in Hooks Pattern

**Services and hooks MUST delegate to shared validators:**

```typescript
// ✅ CORRECT - Hook using shared validation layer
export const useWallet = () => {
  const validateSendInputs = (recipient: string, amount: string, token: TokenType) => {
    return validateForm({ recipient, amount, token }, [
      {
        field: 'recipient',
        validator: validatePrincipalAddress,
        required: true
      },
      {
        field: 'amount',
        validator: (amt) => validateAndConvertAmount(amt, {
          balance: getBalanceForToken(token),
          token,
          includesFees: true
        }),
        required: true
      }
    ]);
  };

  const calculateMaxAmount = (token: TokenType) => {
    return calculateMaxAvailable(getBalanceForToken(token), token, 'TRANSFER');
  };

  return {
    validateSendInputs,
    calculateMaxAmount,
    // ... other hook functions
  };
};

// ❌ WRONG - Hook with inline validation
export const useWallet = () => {
  const validateSendInputs = (recipient: string, amount: string) => {
    // WRONG - Inline Principal validation
    if (!recipient.match(/^[a-z0-9-]+$/)) {
      return { valid: false, error: 'Invalid Principal' };
    }

    // WRONG - Inline amount validation
    if (parseFloat(amount) <= 0) {
      return { valid: false, error: 'Invalid amount' };
    }

    // ... more inline validation
  };
};
```

### Architecture Benefits

1. **DRY Principle**: Single source of truth for validation rules
2. **Type Safety**: Comprehensive TypeScript interfaces
3. **Established Libraries**: Reliable validation using proven libraries
4. **Future-Proof**: Easy to extend without modifying components
5. **Testability**: Validators can be tested in isolation
6. **Consistency**: Same validation behavior across all components
7. **Error Handling**: Standardized error message format

### Migration Pattern for Existing Code

When refactoring components with inline validation:

1. **Identify validation logic** in components
2. **Move to appropriate validator** in `@/lib/utils/validators/`
3. **Update hooks** to use shared validators
4. **Simplify components** to only handle UI rendering
5. **Add tests** for new validation functions

## Functionality Classification Framework

### MANDATORY: Four-Layer Architecture

**CRITICAL**: Before implementing ANY feature, ALL functionality MUST be classified into these four layers. This prevents architecture violations and ensures clean separation of concerns.

#### 1. 🎨 **Presentation Logic** (Components Only)

**ALLOWED IN COMPONENTS:**
- JSX rendering and UI composition
- User interaction handling (onClick, onChange, onSubmit)
- Local UI state management (modals open/closed, hover states, form focus)
- Visual feedback and animations
- Event delegation to parent components via props
- Conditional rendering based on props

**EXAMPLES:**
```typescript
// ✅ CORRECT - Pure presentation logic
const SendButton: React.FC<{ onSend: () => void; disabled: boolean }> = ({ onSend, disabled }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onSend}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn("btn", isHovered && "btn-hover")}
    >
      Send Transaction
    </button>
  );
};
```

**BELONGS IN**: Components (`src/components/`)

#### 2. 🧠 **Business Logic** (Hooks + Services)

**BUSINESS LOGIC INCLUDES:**
- Data processing and transformations
- Domain-specific calculations (fees, balances, conversions)
- Workflow orchestration and state management
- Transaction preparation and formatting
- Complex state transitions
- Data aggregation and statistics

**EXAMPLES:**
```typescript
// ✅ CORRECT - Business logic in hook
export const useWallet = () => {
  const calculateTransactionFee = (amount: string, token: TokenType): string => {
    const config = getTokenConfig(token);
    return (parseFloat(amount) * parseFloat(config.fee)).toFixed(config.decimals);
  };

  const prepareTransaction = (recipient: string, amount: string, token: TokenType) => {
    const convertedAmount = convertToSmallestUnits(amount, token);
    const fee = calculateTransactionFee(amount, token);
    return { recipient, amount: convertedAmount, fee };
  };

  return { calculateTransactionFee, prepareTransaction };
};
```

**BELONGS IN**: Hooks (`src/hooks/`) and Services (`src/services/`)

#### 3. ✅ **Validation Logic** (Shared Validation Layer)

**VALIDATION LOGIC INCLUDES:**
- Input validation and sanitization
- Business rule enforcement
- Data integrity checks
- Error message generation
- Constraint validation (min/max amounts, address formats)
- Cross-field validation dependencies

**EXAMPLES:**
```typescript
// ✅ CORRECT - Validation in shared layer
export const validateTransferInputs = (
  recipient: string,
  amount: string,
  token: TokenType,
  balance: string
): FormValidationResult => {
  return validateForm({ recipient, amount }, [
    {
      field: 'recipient',
      validator: validatePrincipalAddress,
      required: true,
      label: 'Recipient'
    },
    {
      field: 'amount',
      validator: (amt) => validateAndConvertAmount(amt, {
        balance,
        token,
        includesFees: true
      }),
      required: true,
      label: 'Amount'
    }
  ]);
};
```

**BELONGS IN**: Validation Layer (`src/lib/utils/validators/`)

#### 4. 🔌 **External Connectivity Logic** (Services Only)

**CONNECTIVITY LOGIC INCLUDES:**
- API communication and HTTP requests
- Backend actor management and canister calls
- Network error handling and retry logic
- Data serialization/deserialization
- External service integration
- WebSocket connections and real-time data

**EXAMPLES:**
```typescript
// ✅ CORRECT - Connectivity in service
export const transferTokens = async (
  recipient: string,
  amount: bigint,
  token: TokenType
): Promise<TransferResult> => {
  const backend = getBackend();

  if (!backend) {
    return { success: false, error: 'Backend not initialized' };
  }

  try {
    const result = await backend.transfer_tokens({
      to: recipient,
      amount,
      token: token
    });

    return result.Ok
      ? { success: true, blockIndex: result.Ok }
      : { success: false, error: result.Err };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transfer failed'
    };
  }
};
```

**BELONGS IN**: Services (`src/services/`)

### Pre-Implementation Protocol

**MANDATORY STEPS** before writing ANY code:

#### 1. **CLASSIFY** - Function Classification Audit
```markdown
For each function you plan to implement, document:
- Function name: `calculateMaxSendableAmount`
- Functionality: Calculates maximum amount user can send including fees
- Classification: 🧠 Business Logic
- Belongs in: Hook (`useWallet`)
- Reason: Involves domain calculations and fee considerations
```

#### 2. **VALIDATE** - Layer Violation Check
```markdown
- [ ] No business logic in components
- [ ] No validation logic outside shared validators
- [ ] No API calls outside services
- [ ] No presentation logic in hooks/services
```

#### 3. **EXTRACT** - Separation of Concerns Planning
```markdown
If violations found:
- Identify misplaced logic
- Plan extraction to appropriate layer
- Design clean interfaces between layers
- Document data flow and dependencies
```

#### 4. **DOCUMENT** - Architectural Decision Recording
```markdown
Document in code comments:
// ARCHITECTURE: Business logic for calculating maximum sendable amount
// LAYER: 🧠 Business Logic (Hook)
// DEPENDENCIES: Token configuration, fee calculation
// INTERFACES: Returns formatted string for UI display
```

### Post-Implementation Verification

**MANDATORY STEPS** after writing code:

#### 1. **AUDIT** - Layer Compliance Review
- Review each function for correct layer placement
- Verify no cross-layer violations
- Check interface boundaries are clean
- Validate single responsibility principle

#### 2. **TEST** - Separation Verification
- Test each layer independently
- Verify business logic works without UI
- Test validation layer with various inputs
- Confirm services handle network failures gracefully

#### 3. **DOCUMENT** - Update Project Documentation
- Update FEATURES.md with architectural decisions
- Document any complex layer interactions
- Note any technical debt or future refactoring needs

### Common Violation Patterns to Avoid

#### ❌ **SEVERE VIOLATIONS**

```typescript
// ❌ WRONG - Business logic in component
const SendModal = () => {
  const calculateFee = (amount: string) => {
    return (parseFloat(amount) * 0.0001).toFixed(8); // BUSINESS LOGIC IN COMPONENT
  };

  const validateAddress = (addr: string) => {
    return addr.match(/^[a-z0-9-]+$/); // VALIDATION IN COMPONENT
  };

  const sendTransaction = async () => {
    const result = await fetch('/api/send'); // API CALL IN COMPONENT
  };
};
```

#### ✅ **CORRECT PATTERNS**

```typescript
// ✅ CORRECT - Component delegates to appropriate layers
const SendModal = ({
  onSend,
  onValidate,
  onCalculateFee
}: SendModalProps) => {
  const [amount, setAmount] = useState(''); // UI STATE ONLY

  const handleSend = () => {
    const validation = onValidate(address, amount); // DELEGATE TO VALIDATION
    if (validation.valid) {
      onSend(address, amount); // DELEGATE TO BUSINESS LOGIC
    }
  };

  return <form onSubmit={handleSend}>...</form>; // PRESENTATION ONLY
};
```

### Enforcement Mechanisms

#### Code Review Checklist
```markdown
**Architecture Compliance Checklist:**
- [ ] All functions classified into appropriate layers
- [ ] No business logic in presentation components
- [ ] Validation logic uses shared validation layer
- [ ] External connectivity isolated in services
- [ ] Each function has single responsibility
- [ ] Layer interfaces are clean and well-defined
- [ ] No circular dependencies between layers
```

#### Automated Detection Patterns
```markdown
**RED FLAGS** that indicate violations:
- `fetch()`, `axios`, or API calls in components
- Mathematical calculations in component render methods
- Validation regex or business rules in components
- Direct backend actor usage outside services
- Complex state management logic in components
```

### Benefits of Four-Layer Architecture

1. **🧪 Testability**: Each layer can be tested independently
2. **🔄 Reusability**: Business logic can be shared across components
3. **🛠 Maintainability**: Changes isolated to appropriate layers
4. **📖 Readability**: Clear separation makes code self-documenting
5. **🚀 Scalability**: New features follow established patterns
6. **🔒 Reliability**: Validation and error handling centralized
7. **⚡ Performance**: Business logic optimized independently from UI

### Developer Workflow Integration

```markdown
**For Every Feature/Bug Fix:**

1. **Planning Phase**:
   - Classify all required functionality
   - Design layer interactions
   - Identify reusable components

2. **Implementation Phase**:
   - Implement layers bottom-up (validation → business → connectivity → presentation)
   - Test each layer as you build
   - Maintain clean interfaces

3. **Review Phase**:
   - Audit layer compliance
   - Verify architectural decisions
   - Update documentation
```

This framework ensures every piece of code has a clear purpose and place in the architecture, preventing violations before they occur.

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