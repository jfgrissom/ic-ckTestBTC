# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Internet Computer (IC) project that provides a web interface for managing ckTestBTC (testnet Bitcoin) wallets. The project consists of a Rust backend canister that communicates with the ckTestBTC canister (`g4xu7-jiaaa-aaaan-aaaaq-cai`) and a React TypeScript frontend.

## Architecture

### Backend (Rust Canister)
- **Location**: `src/backend/`
- **Language**: Rust using ic-cdk
- **Purpose**: Manages wallet information and communicates with the ckTestBTC canister
- **Main Features**:
  - Get Bitcoin testnet balances for addresses
  - Retrieve UTXOs for addresses
  - Send Bitcoin transactions
  - Get current fee percentiles
  - Get block headers
  - Manage local wallet list and transaction history

### Frontend (React TypeScript)
- **Location**: `src/frontend/`
- **Language**: TypeScript with React (Functional Components)
- **Build Tool**: Vite
- **Purpose**: Web interface for wallet management
- **Architecture**: Modular component-based with hooks and services
- **Main Features**:
  - Internet Identity authentication
  - ckTestBTC balance management
  - Send/receive ckTestBTC transactions
  - Bitcoin testnet address integration
  - Faucet functionality (local development)

### ckTestBTC Integration
The backend canister communicates with the ckTestBTC canister at `g4xu7-jiaaa-aaaan-aaaaq-cai` which provides:
- Bitcoin testnet balance queries
- UTXO management  
- Transaction broadcasting
- Fee estimation
- Block header access

**IMPORTANT**: This canister is configured to ONLY access Bitcoin testnet. Mainnet and regtest networks are not supported for safety reasons.

## Common Development Commands

### Project Setup
```bash
# Install dependencies
npm install

# Generate Candid bindings
dfx generate backend
```

### Development
```bash
# Start local replica
dfx start --clean

# Deploy canisters locally
dfx deploy

# Start frontend development server
npm run dev
```

### Building
```bash
# Build frontend
npm run build

# Build backend (happens during dfx deploy)
dfx build backend
```

### Testing
```bash
# Build and check Rust code
cargo check --manifest-path src/backend/Cargo.toml

# Run TypeScript compiler
npx tsc --noEmit
```

## Project Structure

```
ic-ckTestBTC/
├── src/
│   ├── backend/           # Rust canister code
│   │   ├── src/lib.rs    # Main canister logic
│   │   ├── backend.did   # Candid interface
│   │   └── Cargo.toml    # Rust dependencies
│   └── frontend/          # React frontend (Modular Architecture)
│       ├── src/
│       │   ├── components/          # Reusable UI components
│       │   │   ├── auth/           # Authentication components
│       │   │   │   ├── LoginScreen.tsx
│       │   │   │   ├── LoginScreen.css
│       │   │   │   ├── UserHeader.tsx
│       │   │   │   └── UserHeader.css
│       │   │   └── wallet/         # Wallet components
│       │   │       ├── BalanceSection.tsx
│       │   │       ├── BalanceSection.css
│       │   │       ├── SendSection.tsx
│       │   │       ├── SendSection.css
│       │   │       ├── ReceiveSection.tsx
│       │   │       └── ReceiveSection.css
│       │   ├── hooks/              # Custom React hooks
│       │   │   ├── useAuth.ts      # Authentication management
│       │   │   ├── useWallet.ts    # Wallet operations
│       │   │   └── useBackend.ts   # Backend actor management
│       │   ├── services/           # Business logic services
│       │   │   ├── auth.service.ts # Authentication service
│       │   │   ├── wallet.service.ts # Wallet operations service
│       │   │   └── backend.service.ts # Backend communication
│       │   ├── types/              # TypeScript interfaces
│       │   │   ├── auth.types.ts   # Authentication types
│       │   │   ├── wallet.types.ts # Wallet types
│       │   │   └── backend.types.ts # Backend types
│       │   ├── utils/              # Utility functions
│       │   │   └── error-filter.ts # Error filtering system
│       │   ├── App.tsx             # Main application (orchestrator)
│       │   ├── App.css             # Global styles
│       │   └── main.tsx            # Entry point
│       └── public/                 # Static assets
├── dfx.json              # DFX configuration
├── package.json          # Node.js dependencies
└── vite.config.ts        # Vite configuration
```

## Key Configuration Files

- `dfx.json`: Defines canisters and network configuration
- `Cargo.toml`: Rust workspace configuration
- `src/backend/Cargo.toml`: Backend canister dependencies
- `vite.config.ts`: Frontend build configuration
- `tsconfig.json`: TypeScript configuration

## Network Configuration

The project is configured to work with:
- **Local development**: Uses dfx local replica on `127.0.0.1:4943`
- **IC mainnet**: Can be deployed to Internet Computer mainnet
- **ckTestBTC canister**: Hardcoded to `g4xu7-jiaaa-aaaan-aaaaq-cai` (testnet Bitcoin integration)

## Frontend Architecture (Modular Design)

### Component Architecture
The frontend follows a **functional component architecture** with clear separation of concerns:

**Key Principles:**
- **Functional Components Only**: No class-based components - all React components use functional syntax with hooks
- **Custom Hooks**: Business logic encapsulated in reusable hooks (`useAuth`, `useWallet`, `useBackend`)
- **Service Layer**: Backend communication and business logic separated into service classes
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
   - Singleton pattern for shared state
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

## Important Notes

- The backend canister stores wallet information locally but gets real-time data from the ckTestBTC canister
- All Bitcoin operations use the testnet network for safety
- The frontend uses Vite for fast development and optimized production builds
- Candid bindings are auto-generated and should be regenerated after backend changes
- **Architecture is fully functional-based** - no class components used anywhere in the codebase
- **Modular design** allows easy extension and maintenance of wallet features
- **Generated Types Integration** - Backend types use auto-generated declarations to prevent type drift

## Critical Development Guidelines

### NEVER Manually Edit Declaration Files
**IMPORTANT**: Never manually edit files in `src/declarations/` directory:
- `backend.did` - Candid interface definition
- `backend.did.js` - JavaScript interface bindings  
- `*.ts` - TypeScript declaration files

These files are auto-generated during deployment (`dfx deploy` or `dfx generate`) and any manual changes will be **overwritten**. 

If functions are missing from declarations:
1. Fix the Rust code to ensure proper Candid export
2. Use simple, Candid-compatible return types (String, Nat, etc.)
3. Avoid complex custom enums that may not export properly
4. Redeploy to regenerate declarations automatically

### Candid Export Best Practices

**Modern Candid Generation (ic-cdk v0.11.0+)**:
The project uses `ic_cdk::export_candid!()` macro for automatic Candid generation. This is the current standard approach as of 2024.

**Proper Function Export Requirements**:
1. Functions MUST have `#[query]` or `#[update]` annotations
2. The `ic_cdk::export_candid!()` macro MUST be present at end of `lib.rs`
3. Function signatures must use Candid-compatible types
4. All custom types need `#[derive(CandidType, Serialize, Deserialize)]`

**Troubleshooting Missing Functions in Candid Interface**:
If functions work via `dfx canister call` but don't appear in generated `.did` files:

1. **Check Tool Installation**:
   ```bash
   cargo install candid-extractor
   ```

2. **Manual Candid Extraction** (for debugging):
   ```bash
   # Build the canister
   cargo build --release --target wasm32-unknown-unknown --package backend
   
   # Extract Candid manually
   candid-extractor target/wasm32-unknown-unknown/release/backend.wasm > backend_manual.did
   ```

3. **Common Issues**:
   - Missing `#[query]` or `#[update]` annotations
   - Function not public (`pub fn`)
   - Complex return types that don't export properly
   - Missing `ic_cdk::export_candid!()` macro

4. **Fix Patterns**:
   - Use `Result<T, String>` instead of custom enums
   - Ensure all custom types derive CandidType
   - Keep function signatures simple and Candid-compatible

**Testing Candid Export**:
```bash
# Test function exists in canister
dfx canister call backend function_name

# Check if function appears in generated interface
cat src/declarations/backend/backend.did

# Manual extraction for comparison (shows what SHOULD be generated)
candid-extractor target/wasm32-unknown-unknown/release/backend.wasm
```

**Known Issues**:
- **DFX Candid Generation Bug**: As of dfx 0.29.1, `dfx generate` has a bug where it doesn't extract all functions from WASM files that `candid-extractor` can properly extract
- **Workaround**: The deployment script uses `candid-extractor` manually to ensure complete Candid interfaces
- **Verification**: Always compare `dfx generate` output with `candid-extractor` output to confirm completeness

**Version Information**:
- Current project dfx version: 0.29.1
- candid-extractor works correctly and shows complete interface
- Issue persists across dfx versions 0.28.0 → 0.29.1

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