# PRD: Multi-Token ckTestBTC Wallet

## Project Overview

A comprehensive wallet application for managing ckTestBTC (chain-key Bitcoin
testnet) tokens on the Internet Computer, with full support for Bitcoin testnet
integration and ICP fee management.

## Problem Statement

Users need a simple, intuitive interface to:

- Convert **TestBTC** (Bitcoin testnet) coins to ckTestBTC tokens
- Manage ckTestBTC balances and transfers
- Handle ICP tokens for transaction fees
- Track transaction history across multiple token types
- Securely authenticate via Internet Identity

**IMPORTANT**: This application works exclusively with **Bitcoin testnet4** (TestBTC). No mainnet Bitcoin (BTC) is involved.

## Solution

A React-based web application that provides a unified interface for multi-token
wallet operations, with local mock canisters for development and production
integration with IC mainnet canisters.

## Core Features

### 1. Multi-Token Balance Display

- **ckTestBTC Balance**: Current holdings in smallest units (satoshis)
- **ICP Balance**: Available balance for transaction fees
- **Real-time Updates**: Automatic balance refresh
- **Visual Indicators**: Clear denomination display (8 decimals for ckTestBTC)

### 2. Three-Address System

- **Bitcoin Testnet Address**:
  - Generated via `get_btc_address()` from ckTestBTC minter
  - Format: `tb1q...` (bech32 testnet)
  - Purpose: Receive TestBTC deposits for minting
  - Controlled by threshold ECDSA
- **IC Account Address (ckTestBTC)**:
  - ICRC-1 account identifier (64-character hex)
  - Purpose: Receive direct ckTestBTC transfers
  - Derived from Principal + subaccount
- **Principal ID**:
  - Core IC identity
  - Can receive both ckTestBTC and ICP (default subaccount)
  - Format: `rdmx6-jaaaa-aaaaa-aaadq-cai`

### 3. Token Operations

#### ckTestBTC Operations

- **Send**: ICRC-1 transfers to other IC accounts
- **Receive**: Display addresses/QR codes for incoming transfers

#### Transfer Method Matrix

The wallet supports multiple operations based on account ownership and balance location:

| Primary Account | Sub Account | Account Balance | Send ckTestBTC via Backend Custodian | Send ckTestBTC via ckTestBTC ledger | Withdraw from Backend Custodian | Deposit to Backend Custodian                              |
| --------------- | ----------- | --------------- | ------------------------------------ | ----------------------------------- | ------------------------------- | --------------------------------------------------------- |
| Canister        | User        | Yes             | Yes                                  | No                                  | Yes                             | Yes                                                       |
| User            |             | Yes             | No                                   | Yes                                 | No                              | Yes (caveat: Custodial Sub Account must be created first) |
| Canister        | User        | No              | No                                   | No                                  | No                              | Yes (caveat: BTC TestNet account must be created first)   |
| User            |             | No              | No                                   | No                                  | No                              | No                                                        |

**Operation Method Logic:**

**Send Operations:**
- **Backend Custodian**: Used for custodial funds (canister-controlled subaccounts)
  - Backend canister has authority to transfer from user's custodial subaccount
  - Enables instant transfers within the custodial system
  - Requires registered subaccount with available balance
- **Direct Ledger**: Used for personal funds (user-controlled accounts)
  - User directly authorizes transfer via ICRC-1 standard
  - Real blockchain transactions with block confirmations
  - User maintains full control of their personal account

**Withdrawal Operations:**
- **Backend Custodian Only**: Only custodial funds can be withdrawn to Bitcoin testnet
  - Converts ckTestBTC from custodial balance to TestBTC on Bitcoin testnet
  - Requires custodial subaccount with available balance
  - Personal funds must be deposited to custodial first before withdrawal

**Deposit Operations:**
- **To Backend Custodian**: Moves personal funds into custodial management
  - Row 1: Direct deposit from existing personal balance
  - Row 2: Creates custodial subaccount, then deposits personal funds
  - Row 3: Creates Bitcoin testnet address, enables future TestBTC deposits
  - Row 4: No operation possible (no funds available)

**Security**: No delegation mechanisms - each method only operates on accounts it controls

- **Mint (Onboard)**: Convert **TestBTC** → ckTestBTC
  1. Get Bitcoin testnet deposit address
  2. Send **TestBTC** to address
  3. Call `update_balance` to mint ckTestBTC
- **Burn (Offboard)**: Convert ckTestBTC → **TestBTC**
  1. Call `retrieve_btc` or `retrieve_btc_with_approval`
  2. Burn ckTestBTC tokens
  3. Withdraw **TestBTC** to specified Bitcoin testnet address

#### ICP Operations

- **Send**: ICP ledger transfers
- **Receive**: Display IC addresses for ICP deposits
- **Fee Management**: Monitor ICP balance for transaction costs

### 4. Transaction History

Comprehensive audit trail with categorization:

- **TestBTC Deposits**: Bitcoin testnet4 transactions (with txid)
- **ckTestBTC Mints**: Conversion from **TestBTC** → ckTestBTC
- **ckTestBTC Sends**: Outgoing ICRC-1 transfers
- **ckTestBTC Receives**: Incoming ICRC-1 transfers
- **ckTestBTC Burns**: Conversion ckTestBTC → **TestBTC** 
- **TestBTC Withdrawals**: Bitcoin testnet4 withdrawals (with txid)
- **ICP Sends/Receives**: ICP ledger operations

**Note**: All Bitcoin operations use **testnet4** only. No mainnet Bitcoin (BTC) involved.

### 5. Internet Identity Integration

- **Authentication**: Secure login via Internet Identity
- **Principal Management**: Link wallet to user's IC identity
- **Session Management**: Maintain authenticated sessions

## Technical Architecture

### Token Standards & Networks

- **TestBTC**: Bitcoin testnet4 (native Bitcoin testnet, NOT mainnet BTC)
- **ckTestBTC**: ICRC-1/ICRC-2 token on IC mainnet (represents TestBTC 1:1)
- **ICP**: ICP ledger token on IC mainnet (for transaction fees)

**CRITICAL**: This application handles **TestBTC only**. Zero mainnet Bitcoin (BTC) exposure.

### Canister Architecture

#### Production (IC Mainnet)

- **ckTestBTC Ledger**: `mc6ru-gyaaa-aaaar-qaaaq-cai`
- **ckTestBTC Minter**: `ml52i-qqaaa-aaaar-qaaba-cai`
- **ICP Ledger**: `rrkah-fqaaa-aaaaa-aaaaq-cai`
- **Internet Identity**: `rdmx6-jaaaa-aaaaa-aaadq-cai`

#### Local Development (Mock Canisters)

- **Mock ckTestBTC Ledger**: ICRC-1/2 implementation
- **Mock ckTestBTC Minter**: Bitcoin address generation simulation
- **Mock ICP Ledger**: ICP balance and transfer simulation

### Backend API Gateway

Central routing canister that:

- Detects environment (local vs IC mainnet)
- Routes calls to appropriate canisters
- Provides unified API for frontend
- Handles authentication context

### Frontend Components

#### Core UI Components

- **Dashboard**: Multi-token balance overview
- **Send Form**: Token selector, recipient, amount, memo
- **Receive Modal**: Three-address display with QR codes
- **Transaction List**: Filterable history with transaction details
- **Mint Flow**: Bitcoin testnet deposit instructions
- **Burn Flow**: Bitcoin testnet withdrawal form

#### Address Display Component

```
┌─────────────────────────────────────────┐
│ Receive Tokens                          │
├─────────────────────────────────────────┤
│ Bitcoin Testnet4 (for TestBTC deposits)│
│ tb1q... [QR] [Copy]                     │
├─────────────────────────────────────────┤
│ ckTestBTC/ICP Account                   │
│ d4685b31... [QR] [Copy]                 │
├─────────────────────────────────────────┤
│ Principal ID                            │
│ rdmx6-jaaaa... [QR] [Copy]              │
└─────────────────────────────────────────┘
```

## File Structure

```
ic-ckTestBTC/
├── PRD.md                    # This document
├── CLAUDE.md                 # Development guidelines
├── FEATURES.md               # Feature documentation
├── dfx.json                  # Multi-canister configuration
├── Cargo.toml                # Rust workspace
├── package.json              # Frontend dependencies
├── src/
│   ├── backend/              # API gateway canister
│   │   ├── src/lib.rs       # Multi-token routing logic
│   │   ├── backend.did      # Candid interface
│   │   └── Cargo.toml       # Dependencies
│   ├── mock_ckbtc_ledger/   # ICRC-1/2 mock (renamed from local_token)
│   │   ├── src/lib.rs       # Token operations
│   │   ├── mock_ckbtc_ledger.did
│   │   └── Cargo.toml
│   ├── mock_ckbtc_minter/   # Bitcoin operations mock
│   │   ├── src/lib.rs       # Address generation, mint/burn
│   │   ├── mock_ckbtc_minter.did
│   │   └── Cargo.toml
│   ├── mock_icp_ledger/     # ICP operations mock
│   │   ├── src/lib.rs       # ICP balance and transfers
│   │   ├── mock_icp_ledger.did
│   │   └── Cargo.toml
│   └── frontend/            # React TypeScript application
│       ├── src/
│       │   ├── components/
│       │   │   ├── auth/          # Internet Identity components
│       │   │   ├── wallet/        # Multi-token wallet components
│       │   │   └── common/        # Shared UI components
│       │   ├── hooks/             # Multi-token wallet hooks
│       │   ├── services/          # Multi-canister communication
│       │   ├── types/             # Multi-token type definitions
│       │   └── utils/
│       └── public/
└── scripts/                 # Build and deployment scripts
```

## Development Strategy

### Local Development

1. **Mock Canisters**: Fast iteration with simulated blockchain operations
2. **Environment Detection**: Backend automatically routes to mocks when running
   locally
3. **Realistic Data**: Mock canisters return realistic-looking addresses and
   transaction data
4. **Hot Reload**: Frontend development with immediate feedback

### Production Deployment

1. **IC Mainnet**: Deploy backend to Internet Computer mainnet
2. **Real Canisters**: Backend routes to actual ckTestBTC and ICP canisters
3. **Testnet Integration**: Real Bitcoin testnet4 address generation and
   monitoring
4. **Production Security**: Full threshold ECDSA and Internet Identity
   integration

## Success Criteria

### Functional Requirements

- [ ] Users can view ckTestBTC and ICP balances
- [ ] Users can generate Bitcoin testnet deposit addresses
- [ ] Users can convert TestBTC to ckTestBTC (mint)
- [ ] Users can convert ckTestBTC to TestBTC (burn)
- [ ] Users can send/receive ckTestBTC via ICRC-1
- [ ] Users can send/receive ICP for fees
- [ ] Users can view complete transaction history
- [ ] Users can authenticate via Internet Identity

### Technical Requirements

- [ ] Local mock canisters for development
- [ ] Environment-based canister routing
- [ ] ICRC-1/ICRC-2 standard compliance
- [ ] Bitcoin testnet4 integration
- [ ] Responsive web interface
- [ ] Error handling and user feedback
- [ ] Transaction state management

### User Experience Requirements

- [ ] Intuitive multi-token interface
- [ ] Clear address type differentiation
- [ ] QR code generation for addresses
- [ ] Transaction status indicators
- [ ] Fee estimation and warnings
- [ ] Mobile-responsive design

## Risk Mitigation

### Technical Risks

- **Canister Communication**: Comprehensive error handling for inter-canister
  calls
- **Bitcoin Integration**: Proper handling of Bitcoin testnet confirmation times
- **Fee Management**: Clear warnings for insufficient ICP balances
- **State Consistency**: Transaction atomicity across multiple canisters

### Security Considerations

- **Testnet Only**: **ZERO mainnet Bitcoin (BTC) exposure** - TestBTC only
- **Authentication**: Secure Internet Identity integration
- **Address Validation**: Proper Bitcoin **testnet4** address format validation (tb1q...)
- **Transaction Verification**: Confirmation of all operations before execution
- **Network Isolation**: All Bitcoin operations restricted to testnet4 network

## Future Enhancements

### Phase 2 Features

- **Portfolio View**: USD value estimation for educational purposes
- **Advanced History**: Export transaction history
- **Multi-Subaccount**: Support for multiple subaccounts per user
- **Batch Operations**: Multiple transfers in single transaction
- **Integration APIs**: Webhook support for external applications

### Technical Improvements

- **Caching Layer**: Improved performance for balance queries
- **WebSocket Integration**: Real-time balance updates
- **Progressive Web App**: Offline capability and mobile app experience
- **Advanced Analytics**: Transaction pattern analysis and insights
