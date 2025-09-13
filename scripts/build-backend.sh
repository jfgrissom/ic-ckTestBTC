#!/bin/bash

# Build script for backend canister only (no deployment)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Building backend canister...${NC}"

# Export environment variables for build
export CKTESTBTC_CANISTER_ID="g4xu7-jiaaa-aaaan-aaaaq-cai"

# Get the mock_cktestbtc_ledger canister ID from dfx if it exists
if [ -f ".dfx/local/canister_ids.json" ]; then
    MOCK_LEDGER_ID=$(cat .dfx/local/canister_ids.json 2>/dev/null | grep -A1 '"mock_cktestbtc_ledger"' | grep '"local"' | cut -d'"' -f4)
    if [ ! -z "$MOCK_LEDGER_ID" ]; then
        echo -e "${YELLOW}Found mock_cktestbtc_ledger canister ID: ${MOCK_LEDGER_ID}${NC}"
        export MOCK_CKTESTBTC_LEDGER_CANISTER_ID=$MOCK_LEDGER_ID
    else
        echo -e "${YELLOW}No mock_cktestbtc_ledger canister found, using default${NC}"
    fi
fi

# Build the backend without deploying
echo -e "${GREEN}Building backend canister WASM...${NC}"
dfx build backend

# Check if build was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend build complete!${NC}"
    
    # Show WASM file info
    WASM_FILE="target/wasm32-unknown-unknown/release/backend.wasm"
    if [ -f "$WASM_FILE" ]; then
        WASM_SIZE=$(stat -f%z "$WASM_FILE" 2>/dev/null || stat -c%s "$WASM_FILE" 2>/dev/null)
        echo -e "${GREEN}📦 WASM file: ${WASM_FILE} (${WASM_SIZE} bytes)${NC}"
    fi
else
    echo -e "${RED}❌ Backend build failed!${NC}"
    exit 1
fi