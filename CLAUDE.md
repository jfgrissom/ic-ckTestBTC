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
- **Architecture**: Modular component-based with hooks and functional services
- **Main Features**:
  - Internet Identity authentication
  - ckTestBTC balance management
  - Send/receive ckTestBTC transactions
  - Bitcoin testnet address integration
  - Faucet functionality (local development)

**📚 For detailed frontend development guidelines, see: [`src/frontend/CLAUDE.md`](src/frontend/CLAUDE.md)**

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


## Important Notes

- The backend canister stores wallet information locally but gets real-time data from the ckTestBTC canister
- All Bitcoin operations use the testnet network for safety
- The frontend uses Vite for fast development and optimized production builds
- Candid bindings are auto-generated and should be regenerated after backend changes
- **Architecture is fully functional-based** - no class components or class-based services in the frontend
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


# Specialized Agent Workflow

This project uses a specialized agent ecosystem for optimal development efficiency and modular architecture. When working on tasks, Claude Code should automatically invoke appropriate specialists to ensure expert handling and comprehensive documentation.

## Agent Ecosystem Overview

The project maintains 8 specialized agents, each focused on specific domains:

- **Feature Management Specialist** (`.claude/feature-management-specialist.md`) - Feature tracking and FEATURES.md maintenance
- **IC/DFX Specialist** (`.claude/ic-dfx-specialist.md`) - Internet Computer infrastructure and deployment
- **Rust Backend Specialist** (`.claude/rust-backend-specialist.md`) - Modular backend development and ckTestBTC integration
- **React Frontend Specialist** (`.claude/react-frontend-specialist.md`) - Functional React/TypeScript development
- **Styling & Component Design Specialist** (`.claude/styling-component-specialist.md`) - UI/UX and ShadCN component architecture
- **DevOps & Shell Scripting Specialist** (`.claude/devops-shell-specialist.md`) - Build automation, deployment scripts, and development workflow optimization
- **Rust Testing Specialist** (`.claude/rust-testing-specialist.md`) - Backend testing and quality assurance
- **Frontend Testing Specialist** (`.claude/frontend-testing-specialist.md`) - Frontend testing and validation

## Automatic Agent Assignment Rules

### Backend Development Tasks
**Trigger**: Rust canister code, backend environment issues, ckTestBTC integration
**Invoke**: Rust Backend Specialist + IC/DFX Specialist
```
Examples:
- Modifying src/backend/src/lib.rs
- Environment variable configuration issues
- Canister deployment problems
- ckTestBTC API integration
```

### Frontend Development Tasks
**Trigger**: React components, TypeScript interfaces, UI improvements
**Invoke**: React Frontend Specialist + Styling & Component Design Specialist
```
Examples:
- Creating/modifying React components
- ShadCN component integration or wrapper creation
- Custom hook development
- Component architecture improvements
```

### Infrastructure & Deployment Tasks
**Trigger**: DFX configuration, canister management, build issues
**Invoke**: IC/DFX Specialist
```
Examples:
- dfx.json modifications
- Build script issues
- Canister deployment failures
- Environment configuration problems
```

### DevOps & Automation Tasks
**Trigger**: Shell scripts, build automation, deployment workflows, environment management
**Invoke**: DevOps & Shell Scripting Specialist
```
Examples:
- Modifying scripts/ directory files
- Build process optimization
- Deployment automation improvements
- Environment synchronization issues
- Cross-platform compatibility fixes
- DFX toolchain workarounds
- CI/CD pipeline development
```

### Testing Tasks
**Trigger**: Test creation, quality assurance, validation
**Invoke**: Appropriate Testing Specialist (Rust or Frontend)
```
Examples:
- Writing unit tests
- Integration testing
- Performance validation
- Quality gate implementation
```

### Cross-Cutting/Complex Tasks
**Trigger**: Multi-domain features, architecture changes, major bug fixes
**Invoke**: Multiple Specialists in Parallel
```
Examples:
- Full-stack feature implementation
- Architecture refactoring
- Multi-component bug fixes
- Performance optimization across layers
```

## Feature Management Integration

**CRITICAL**: The Feature Management Specialist must be invoked for ALL substantial work to maintain FEATURES.md accuracy.

### Always Invoke Feature Management Specialist For:
- **Task Completion Documentation** - Update FEATURES.md with completed work
- **New Feature Requests** - Create structured feature tracking entries
- **Progress Tracking** - Monitor implementation status across specialists
- **Requirements Validation** - Ensure work meets acceptance criteria
- **Milestone Reporting** - Track progress against project goals

### When NOT to Invoke Feature Management Specialist:
- Trivial fixes (typos, minor formatting)
- Read-only analysis tasks
- Simple troubleshooting queries

## Agent Invocation Workflow

### 1. Task Analysis Phase
When receiving a user request:
```markdown
1. **Classify Task Type**: Determine primary domain (backend, frontend, infrastructure, etc.)
2. **Identify Complexity**: Single-domain vs cross-cutting task
3. **Determine Specialists**: Map task requirements to appropriate agents
4. **Plan Coordination**: Identify dependencies and sequencing needs
```

### 2. Specialist Invocation Phase
```markdown
1. **Use Task Tool**: Invoke appropriate specialists with detailed context
2. **Parallel Execution**: Run independent specialists simultaneously when possible
3. **Sequential Coordination**: Handle dependencies between specialists appropriately
4. **Progress Monitoring**: Track specialist completion and integration needs
```

### 3. Integration & Documentation Phase
```markdown
1. **Feature Management Specialist**: Always invoke for substantial work completion
2. **FEATURES.md Updates**: Ensure all significant work is documented
3. **Quality Validation**: Verify work meets acceptance criteria
4. **User Reporting**: Provide comprehensive completion summary
```

## Agent Coordination Patterns

### Simple Task Pattern
```
User Request → Task Analysis → Single Specialist → Feature Management → User Response
```

### Complex Task Pattern
```
User Request → Task Analysis → Multiple Specialists (Parallel) → Integration → Feature Management → User Response
```

### Full-Stack Feature Pattern
```
User Request → Feature Management (Planning) → Backend Specialists + Frontend Specialists (Parallel) → Testing Specialists → Feature Management (Validation) → User Response
```

## Quality Gates & Anti-Monolith Principles

All specialists must enforce modular, reusable development:

### Code Quality Standards
- **Component Size Limits**: Functions <50 lines, Components <100 lines
- **Single Responsibility**: Each component/function serves ONE purpose
- **Reuse Validation**: Check existing codebase before creating new components
- **Composition Verification**: Complex features built from simple, reusable parts
- **Functional Patterns**: No classes in frontend code, functional composition throughout

### Documentation Quality Standards
- **Clear Descriptions**: Each feature has unambiguous scope and purpose
- **Acceptance Criteria**: Specific, measurable completion requirements
- **Technical Context**: Integration points with existing architecture
- **Implementation Notes**: Technical decisions and architectural choices documented

## Example Agent Invocations

### Console Error Fix (Recent Example)
```
Task: Fix React forwardRef warnings and backend environment errors
Specialists Invoked:
1. React Frontend Specialist (ForwardRefButton wrapper creation)
2. Styling & Component Design Specialist (ShadCN component guidelines)
3. IC/DFX Specialist (backend environment variable deployment)
4. Feature Management Specialist (FEATURES.md documentation)
```

### New Feature Development
```
Task: Implement transaction history feature
Specialists Invoked:
1. Feature Management Specialist (requirements analysis, FEATURES.md entry)
2. Rust Backend Specialist (transaction storage and retrieval)
3. React Frontend Specialist (history display components)
4. Styling & Component Design Specialist (history UI design)
5. Testing Specialists (validation and quality assurance)
6. Feature Management Specialist (completion validation and documentation)
```

### DevOps Automation Task
```
Task: Optimize build process and add deployment validation
Specialists Invoked:
1. DevOps & Shell Scripting Specialist (script optimization and validation logic)
2. IC/DFX Specialist (canister deployment coordination)
3. Feature Management Specialist (automation improvements documentation)
```

## Specialist Communication Protocol

### Task Handoff Requirements
- **Comprehensive Context**: Each specialist receives full task background
- **Clear Deliverables**: Specific output expectations and quality criteria
- **Dependency Mapping**: Prerequisites and integration requirements
- **Success Criteria**: Measurable completion indicators

### Status Reporting Requirements
- **Progress Updates**: Regular updates on task advancement
- **Blocker Escalation**: Immediate notification of blocking issues
- **Quality Metrics**: Test coverage, performance metrics, etc.
- **Completion Confirmation**: Clear notification when deliverables are ready

## Success Metrics

### Development Efficiency
- **Faster Feature Delivery**: Specialist expertise reduces implementation time
- **Higher Quality**: Domain experts ensure best practices and patterns
- **Better Architecture**: Modular, reusable components through specialist focus
- **Comprehensive Documentation**: Feature Management ensures complete tracking

### Code Quality Through Modularity
- **Component Reuse**: Measure percentage of new features built from existing components
- **Pattern Consistency**: Validate consistent use of established architectural patterns
- **Test Coverage**: Backend >80%, Frontend >85% coverage targets for all modules
- **Documentation Accuracy**: FEATURES.md reflects actual project state

This specialized agent system ensures expert handling of all development domains while maintaining comprehensive project documentation and modular, reusable architecture.