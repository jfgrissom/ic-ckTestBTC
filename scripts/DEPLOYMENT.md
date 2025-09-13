# Deployment Automation Documentation

This document explains the robust deployment automation system that ensures environment variables are always properly set in the backend canister, even after complete DFX restarts.

## Problem Solved

**Issue**: Backend canister environment variables (like `LOCAL_MOCK_LEDGER_CANISTER_ID`) were not being set consistently after DFX restarts, causing "environment variable not set" errors in the web console.

**Root Cause**:
1. Rust `option_env!()` macro reads environment variables at **compile time**, not runtime
2. Environment variables were being exported in shell sessions that didn't persist across build processes
3. The npm workflow didn't guarantee environment variables were set **before** backend compilation

## Solution Architecture

### 1. Persistent Storage in dfx.json

Environment variables are now stored persistently in the `dfx.json` file's `env` section:

```json
{
  "env": {
    "LOCAL_MOCK_LEDGER_CANISTER_ID": "umunu-kh777-77774-qaaca-cai",
    "LOCAL_MOCK_MINTER_CANISTER_ID": "ulvla-h7777-77774-qaacq-cai",
    "IC_CKTESTBTC_CANISTER_ID": "g4xu7-jiaaa-aaaan-aaaaq-cai"
  }
}
```

### 2. Improved npm Script Workflow

Updated `package.json` scripts ensure proper sequencing:

```json
{
  "dfx:setup": "npm run dfx:create && npm run update:env && npm run dfx:deploy",
  "predev": "npm run dfx:setup"
}
```

**Flow**: `npm run dev` → `predev` → `dfx:setup` → `dfx:create` + `update:env` + `dfx:deploy`

This ensures environment variables are updated **before** any backend building/deployment occurs.

### 3. Robust Script Updates

#### deploy-backend.sh
- Loads environment variables from `dfx.json` using `jq`
- Falls back to `update-env.sh` if needed
- Validates variables are set before building
- Provides detailed error messages and retry logic

#### build-backend.sh
- Always loads environment variables from `dfx.json` first
- Falls back to direct canister ID lookup if needed
- Ensures variables are exported before compilation

#### update-env.sh
- Updates both `.env` file (frontend) and `dfx.json` (backend)
- Validates the update was successful
- Requires `jq` to be installed (fails gracefully if not available)

#### validate-env-setup.sh
- New comprehensive validation script
- Tests the entire workflow from canister creation to backend deployment
- Provides detailed success/failure reporting
- Can be used to debug issues after DFX restarts

## Usage

### Normal Development Workflow

```bash
# Start DFX (clean restart)
dfx start --clean

# Start development (handles all setup automatically)
npm run dev
```

The `predev` hook ensures:
1. All canisters are created
2. Environment variables are updated and persisted in dfx.json
3. Backend is built and deployed with proper environment variables
4. Frontend development server starts

### Debugging Environment Issues

If you encounter environment variable issues:

```bash
# Run the validation script
./scripts/validate-env-setup.sh

# Or manually run individual steps:
npm run dfx:create      # Create canisters
npm run update:env      # Update environment variables
npm run dfx:deploy      # Deploy backend with environment variables
```

### Manual Environment Variable Update

```bash
# Force update environment variables
npm run update:env

# Check current dfx.json env section
jq '.env' dfx.json

# Check current .env file
cat .env
```

## Dependencies

- **jq**: Required for JSON manipulation in dfx.json
  - macOS: `brew install jq`
  - Linux: `apt-get install jq`
  - Windows: Download from https://stedolan.github.io/jq/

## Error Recovery

### If environment variables are still not set:

1. **Check dfx.json**: Ensure the `env` section contains the canister IDs
2. **Run validation**: `./scripts/validate-env-setup.sh`
3. **Force update**: `npm run update:env`
4. **Check jq**: Ensure `jq` is installed and working
5. **Clean restart**: Stop DFX, `dfx start --clean`, then `npm run dev`

### If canisters don't exist:

```bash
# Recreate all canisters
npm run dfx:create

# Update environment variables with new IDs
npm run update:env

# Rebuild and deploy
npm run dfx:deploy
```

## Technical Details

### Environment Variable Flow

1. **Canister Creation**: `setup-canisters.sh` creates all required canisters
2. **ID Extraction**: `update-env.sh` gets canister IDs using `dfx canister id`
3. **Storage**: IDs are stored in `dfx.json` env section using `jq`
4. **Loading**: Build scripts load variables from `dfx.json` using `jq`
5. **Compilation**: Rust `option_env!()` macro reads variables at compile time
6. **Deployment**: Built WASM contains hardcoded canister IDs

### Validation Steps

The validation script tests:
- [ ] DFX is running
- [ ] All canisters can be created
- [ ] Environment variables can be updated
- [ ] dfx.json env section is properly configured
- [ ] Backend builds successfully
- [ ] Backend deploys successfully
- [ ] Backend functions are callable

## Files Modified

- `package.json`: Updated `dfx:setup` script sequencing
- `scripts/deploy-backend.sh`: Added dfx.json environment loading
- `scripts/build-backend.sh`: Added dfx.json environment loading
- `scripts/update-env.sh`: Added dfx.json validation
- `scripts/validate-env-setup.sh`: New comprehensive validation script

## Benefits of This Solution

1. **Persistence**: Environment variables survive DFX restarts
2. **Robustness**: Multiple fallback mechanisms prevent failures
3. **Validation**: Comprehensive testing ensures setup works
4. **Automation**: No manual intervention required
5. **Debugging**: Clear error messages and validation tools
6. **Consistency**: Same variables used across all build processes

## Future Improvements

- Add support for different environments (local, testnet, mainnet)
- Automatic jq installation if missing
- Integration with CI/CD pipelines
- Canister upgrade handling