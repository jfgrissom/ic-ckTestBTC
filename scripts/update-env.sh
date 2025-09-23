#!/bin/bash

# Script to dynamically update environment variables with current canister IDs

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Updating environment variables with current canister IDs...${NC}"

# Get current canister IDs
BACKEND_ID=$(dfx canister id backend 2>/dev/null)
II_ID=$(dfx canister id internet_identity 2>/dev/null)
FRONTEND_ID=$(dfx canister id frontend 2>/dev/null)
MOCK_LEDGER_ID=$(dfx canister id mock_cktestbtc_ledger 2>/dev/null)
MOCK_MINTER_ID=$(dfx canister id mock_cktestbtc_minter 2>/dev/null)

# Check if we got the required IDs
if [ -z "$BACKEND_ID" ] || [ -z "$II_ID" ] || [ -z "$FRONTEND_ID" ] || [ -z "$MOCK_LEDGER_ID" ]; then
    echo -e "${RED}❌ Failed to get required canister IDs${NC}"
    echo "Backend ID: $BACKEND_ID"
    echo "Internet Identity ID: $II_ID"
    echo "Frontend ID: $FRONTEND_ID"
    echo "Mock Ledger ID: $MOCK_LEDGER_ID"
    echo "Mock Minter ID: $MOCK_MINTER_ID"
    echo -e "${YELLOW}This usually means canisters haven't been created yet.${NC}"
    echo -e "${YELLOW}Run 'npm run dfx:create' first, then try again.${NC}"
    exit 1
fi

# Update .env file for frontend
cat > .env << EOF
# Environment variables for development
VITE_DFX_NETWORK=local
VITE_CANISTER_ID_INTERNET_IDENTITY=$II_ID
VITE_CANISTER_ID_BACKEND=$BACKEND_ID
VITE_CANISTER_ID_FRONTEND=$FRONTEND_ID

# Mock Canister IDs for local development
VITE_CANISTER_ID_MOCK_CKTESTBTC_LEDGER=$MOCK_LEDGER_ID
VITE_CANISTER_ID_MOCK_CKTESTBTC_MINTER=$MOCK_MINTER_ID
EOF

# Export environment variables for backend build
export LOCAL_MOCK_LEDGER_CANISTER_ID=$MOCK_LEDGER_ID
export LOCAL_MOCK_MINTER_CANISTER_ID=$MOCK_MINTER_ID
export IC_CKTESTBTC_CANISTER_ID="g4xu7-jiaaa-aaaan-aaaaq-cai"

# Also update dfx.json env section for persistent storage across DFX restarts
cat > dfx_env_temp.json << EOF
{
  "LOCAL_MOCK_LEDGER_CANISTER_ID": "$MOCK_LEDGER_ID",
  "LOCAL_MOCK_MINTER_CANISTER_ID": "$MOCK_MINTER_ID",
  "IC_CKTESTBTC_CANISTER_ID": "g4xu7-jiaaa-aaaan-aaaaq-cai"
}
EOF

# Use jq to update the dfx.json env section if jq is available
if command -v jq &> /dev/null; then
    jq --argjson new_env "$(cat dfx_env_temp.json)" '.env = $new_env' dfx.json > dfx_temp.json && mv dfx_temp.json dfx.json
    rm dfx_env_temp.json
    echo -e "${GREEN}✅ dfx.json env section updated${NC}"

    # Verify the update was successful
    STORED_LEDGER_ID=$(jq -r '.env.LOCAL_MOCK_LEDGER_CANISTER_ID' dfx.json)
    if [ "$STORED_LEDGER_ID" = "$MOCK_LEDGER_ID" ]; then
        echo -e "${GREEN}✅ dfx.json verification passed - environment variables are persisted${NC}"
    else
        echo -e "${RED}❌ dfx.json verification failed - stored: $STORED_LEDGER_ID, expected: $MOCK_LEDGER_ID${NC}"
        exit 1
    fi
else
    rm dfx_env_temp.json
    echo -e "${RED}❌ jq not found - dfx.json env section cannot be updated${NC}"
    echo -e "${YELLOW}Please install jq: brew install jq (macOS) or apt-get install jq (Linux)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables updated:${NC}"
echo -e "${YELLOW}VITE_CANISTER_ID_BACKEND=$BACKEND_ID${NC}"
echo -e "${YELLOW}VITE_CANISTER_ID_INTERNET_IDENTITY=$II_ID${NC}"
echo -e "${YELLOW}VITE_CANISTER_ID_FRONTEND=$FRONTEND_ID${NC}"
echo -e "${YELLOW}VITE_CANISTER_ID_MOCK_CKTESTBTC_LEDGER=$MOCK_LEDGER_ID${NC}"
echo -e "${YELLOW}VITE_CANISTER_ID_MOCK_CKTESTBTC_MINTER=$MOCK_MINTER_ID${NC}"
echo -e "${YELLOW}LOCAL_MOCK_LEDGER_CANISTER_ID=$MOCK_LEDGER_ID${NC}"
echo -e "${YELLOW}LOCAL_MOCK_MINTER_CANISTER_ID=$MOCK_MINTER_ID${NC}"