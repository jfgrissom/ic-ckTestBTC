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

### Reusability Patterns

1. **Custom Hooks** (`src/hooks/`):
   - Data fetching and state management
   - Business logic and calculations
   - Side effects and subscriptions

2. **Service Modules** (`src/services/`):
   - API communication
   - Data transformation
   - External integrations

3. **Utility Functions** (`src/lib/utils/`):
   - Pure functions for formatting
   - Validation helpers
   - Common calculations

4. **Shared Components** (`src/components/shared/`):
   - Reusable UI elements
   - Common patterns (modals, forms, etc.)
   - Layout components

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

This structure ensures consistency, maintainability, and scalability across the entire frontend codebase.