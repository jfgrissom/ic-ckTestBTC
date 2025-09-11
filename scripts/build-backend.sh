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

# Get the local token canister ID from dfx if it exists
if [ -f ".dfx/local/canister_ids.json" ]; then
    LOCAL_TOKEN_ID=$(cat .dfx/local/canister_ids.json 2>/dev/null | grep -A1 '"local_token"' | grep '"local"' | cut -d'"' -f4)
    if [ ! -z "$LOCAL_TOKEN_ID" ]; then
        echo -e "${YELLOW}Found local_token canister ID: ${LOCAL_TOKEN_ID}${NC}"
        export LOCAL_TOKEN_CANISTER_ID=$LOCAL_TOKEN_ID
    else
        echo -e "${YELLOW}No local_token canister found, using default${NC}"
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