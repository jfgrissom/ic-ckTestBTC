#!/bin/bash

# Build script for backend canister only (no deployment)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Building backend canister...${NC}"

# Load environment variables from dfx.json - ensuring persistence across DFX restarts
if [ -z "$LOCAL_MOCK_LEDGER_CANISTER_ID" ]; then
    echo -e "${YELLOW}Environment variables not set in current shell, loading from persistent storage...${NC}"

    # Always try to load from dfx.json first (primary method for persistence)
    if command -v jq &> /dev/null && [ -f "dfx.json" ]; then
        echo -e "${YELLOW}Loading environment variables from dfx.json...${NC}"
        eval "$(jq -r '.env | to_entries[] | "export \(.key)=\"\(.value)\""' dfx.json)"

        if [ ! -z "$LOCAL_MOCK_LEDGER_CANISTER_ID" ]; then
            echo -e "${GREEN}✅ Environment variables loaded from dfx.json persistent storage${NC}"
        else
            echo -e "${YELLOW}⚠️  dfx.json env section is empty, attempting fallback...${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  jq not available or dfx.json not found, attempting fallback...${NC}"
    fi

    # Fallback: get canister IDs directly and update dfx.json
    if [ -z "$LOCAL_MOCK_LEDGER_CANISTER_ID" ]; then
        echo -e "${YELLOW}Attempting to get canister IDs directly and update persistent storage...${NC}"
        MOCK_LEDGER_ID=$(dfx canister id mock_cktestbtc_ledger 2>/dev/null)
        if [ ! -z "$MOCK_LEDGER_ID" ]; then
            export LOCAL_MOCK_LEDGER_CANISTER_ID=$MOCK_LEDGER_ID
            export IC_CKTESTBTC_CANISTER_ID="${IC_CKTESTBTC_CANISTER_ID:-g4xu7-jiaaa-aaaan-aaaaq-cai}"
            echo -e "${YELLOW}Found canister ID: ${MOCK_LEDGER_ID}, updating persistent storage...${NC}"
            # Update dfx.json for future builds
            if command -v jq &> /dev/null; then
                jq --arg ledger_id "$MOCK_LEDGER_ID" --arg ic_id "${IC_CKTESTBTC_CANISTER_ID}" '.env.LOCAL_MOCK_LEDGER_CANISTER_ID = $ledger_id | .env.IC_CKTESTBTC_CANISTER_ID = $ic_id' dfx.json > dfx_temp.json && mv dfx_temp.json dfx.json
                echo -e "${GREEN}✅ dfx.json persistent storage updated${NC}"
            fi
        else
            echo -e "${RED}❌ Could not find mock_cktestbtc_ledger canister ID${NC}"
            echo -e "${YELLOW}Run 'npm run dfx:create' first to create canisters, then 'npm run update:env' to set environment variables${NC}"
            exit 1
        fi
    fi
fi

# Ensure all required environment variables are set
export LOCAL_MOCK_LEDGER_CANISTER_ID="${LOCAL_MOCK_LEDGER_CANISTER_ID}"
export IC_CKTESTBTC_CANISTER_ID="${IC_CKTESTBTC_CANISTER_ID:-g4xu7-jiaaa-aaaan-aaaaq-cai}"

echo -e "${YELLOW}Building with environment variables:${NC}"
echo -e "${YELLOW}  LOCAL_MOCK_LEDGER_CANISTER_ID=${LOCAL_MOCK_LEDGER_CANISTER_ID}${NC}"
echo -e "${YELLOW}  IC_CKTESTBTC_CANISTER_ID=${IC_CKTESTBTC_CANISTER_ID}${NC}"

# Build the backend without deploying
echo -e "${GREEN}Building backend canister WASM...${NC}"
LOCAL_MOCK_LEDGER_CANISTER_ID="$LOCAL_MOCK_LEDGER_CANISTER_ID" IC_CKTESTBTC_CANISTER_ID="$IC_CKTESTBTC_CANISTER_ID" dfx build backend

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