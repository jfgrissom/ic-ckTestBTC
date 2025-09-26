#!/bin/bash

# Generate TypeScript declarations using proper DFX protocol
# This script follows DFX 0.29.1 best practices for scalable declaration generation

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Generating TypeScript declarations using DFX 0.29.1 protocol...${NC}"

# Check if WASM file exists
WASM_FILE="target/wasm32-unknown-unknown/release/backend.wasm"
if [ ! -f "$WASM_FILE" ]; then
    echo -e "${RED}❌ WASM file not found: ${WASM_FILE}${NC}"
    echo -e "${YELLOW}💡 Run './scripts/build-backend.sh' first to build the backend${NC}"
    exit 1
fi

# Show WASM file info
WASM_SIZE=$(stat -f%z "$WASM_FILE" 2>/dev/null || stat -c%s "$WASM_FILE" 2>/dev/null)
echo -e "${GREEN}📦 Using WASM file: ${WASM_FILE} (${WASM_SIZE} bytes)${NC}"

# Step 1: Extract complete Candid interface from compiled WASM
echo -e "${GREEN}Step 1: Extracting complete Candid interface from WASM...${NC}"
candid-extractor "$WASM_FILE" > src/backend/backend.did

# Verify the extraction worked by checking for key core functions
if grep -q "get_transaction_history" src/backend/backend.did && grep -q "get_wallet_status" src/backend/backend.did; then
    echo -e "${GREEN}✅ Candid extraction successful - core functions found${NC}"

    # Check if faucet function exists (development builds only)
    if grep -q "faucet" src/backend/backend.did; then
        echo -e "${GREEN}📍 Development build detected - faucet function included${NC}"
    else
        echo -e "${YELLOW}📍 Production build detected - faucet function excluded${NC}"
    fi

    # List all functions found
    echo -e "${GREEN}📋 Functions detected:${NC}"
    grep -E "^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*:" src/backend/backend.did | sed 's/[[:space:]]*\([^:]*\).*/  - \1/' | sort
else
    echo -e "${RED}❌ Candid extraction failed - core functions missing${NC}"
    echo -e "${YELLOW}🔍 Functions found in Candid file:${NC}"
    grep -E "^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*:" src/backend/backend.did | sed 's/[[:space:]]*\([^:]*\).*/  - \1/' | sort
    exit 1
fi

# Step 2: Use standard DFX generate for TypeScript declarations
echo -e "${GREEN}Step 2: Generating TypeScript declarations with dfx generate...${NC}"
dfx generate backend
dfx generate mock_cktestbtc_ledger
dfx generate mock_cktestbtc_minter

# Verify TypeScript declarations were created
BACKEND_OK=false
LEDGER_OK=false
MINTER_OK=false

# Check backend declarations
if [ -f "src/declarations/backend/backend.did.d.ts" ] && [ -f "src/declarations/backend/backend.did.js" ]; then
    BACKEND_OK=true
    echo -e "${GREEN}✅ Backend TypeScript declarations generated${NC}"
else
    echo -e "${RED}❌ Backend TypeScript declaration generation failed${NC}"
fi

# Check ledger declarations
if [ -f "src/declarations/mock_cktestbtc_ledger/mock_cktestbtc_ledger.did.d.ts" ] && [ -f "src/declarations/mock_cktestbtc_ledger/mock_cktestbtc_ledger.did.js" ]; then
    LEDGER_OK=true
    echo -e "${GREEN}✅ Mock Ledger TypeScript declarations generated${NC}"
else
    echo -e "${RED}❌ Mock Ledger TypeScript declaration generation failed${NC}"
fi

# Check minter declarations
if [ -f "src/declarations/mock_cktestbtc_minter/mock_cktestbtc_minter.did.d.ts" ] && [ -f "src/declarations/mock_cktestbtc_minter/mock_cktestbtc_minter.did.js" ]; then
    MINTER_OK=true
    echo -e "${GREEN}✅ Mock Minter TypeScript declarations generated${NC}"
else
    echo -e "${RED}❌ Mock Minter TypeScript declaration generation failed${NC}"
fi

# Overall success check
if [ "$BACKEND_OK" = true ] && [ "$LEDGER_OK" = true ] && [ "$MINTER_OK" = true ]; then
    echo -e "${GREEN}✅ All TypeScript declarations generated successfully${NC}"

    # Show file sizes
    DTS_SIZE=$(stat -f%z "src/declarations/backend/backend.did.d.ts" 2>/dev/null || stat -c%s "src/declarations/backend/backend.did.d.ts" 2>/dev/null)
    JS_SIZE=$(stat -f%z "src/declarations/backend/backend.did.js" 2>/dev/null || stat -c%s "src/declarations/backend/backend.did.js" 2>/dev/null)
    DID_SIZE=$(stat -f%z "src/declarations/backend/backend.did" 2>/dev/null || stat -c%s "src/declarations/backend/backend.did" 2>/dev/null)

    echo -e "${GREEN}📄 Generated declaration files:${NC}"
    echo -e "  - backend declarations (${DID_SIZE} + ${DTS_SIZE} + ${JS_SIZE} bytes)"
    echo -e "  - mock_cktestbtc_ledger declarations"
    echo -e "  - mock_cktestbtc_minter declarations"

    # Verify key functions exist in TypeScript declarations
    if grep -q "get_transaction_history" src/declarations/backend/backend.did.d.ts; then
        echo -e "${GREEN}✅ Complete interface confirmed in TypeScript declarations${NC}"
    else
        echo -e "${YELLOW}⚠️ Some functions may be missing from TypeScript declarations${NC}"
    fi
else
    echo -e "${RED}❌ Not all TypeScript declarations were generated successfully${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Declaration generation complete for all local development canisters!${NC}"
echo -e "${YELLOW}📝 How this works:${NC}"
echo -e "${YELLOW}  1. candid-extractor extracts complete interface from compiled WASM${NC}"
echo -e "${YELLOW}  2. Complete interface is saved to src/backend/backend.did${NC}"
echo -e "${YELLOW}  3. dfx generate reads interfaces and generates TypeScript for all canisters${NC}"
echo -e "${YELLOW}  4. Generates declarations for: backend, mock_cktestbtc_ledger, mock_cktestbtc_minter${NC}"
echo -e "${YELLOW}  5. This supports local development with complete type safety${NC}"