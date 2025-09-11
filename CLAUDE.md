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
- **Language**: TypeScript with React
- **Build Tool**: Vite
- **Purpose**: Web interface for wallet management
- **Main Features**:
  - Add/remove wallet addresses
  - Check balances
  - View transaction history
  - Display network fee information

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
│   └── frontend/          # React frontend
│       ├── src/
│       │   ├── App.tsx   # Main application component
│       │   ├── main.tsx  # Entry point
│       │   └── *.css     # Styling
│       └── public/       # Static assets
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

## Important Notes

- The backend canister stores wallet information locally but gets real-time data from the ckTestBTC canister
- All Bitcoin operations use the testnet network for safety
- The frontend uses Vite for fast development and optimized production builds
- Candid bindings are auto-generated and should be regenerated after backend changes