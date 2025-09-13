#!/bin/bash

# Setup script to create all canisters if they don't exist

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up canisters...${NC}"

# Check if dfx is running
if ! dfx ping > /dev/null 2>&1; then
    echo -e "${RED}❌ DFX is not running. Please start dfx in another terminal with: dfx start --clean${NC}"
    exit 1
fi

# Check if canister_ids.json exists
if [ ! -f ".dfx/local/canister_ids.json" ]; then
    echo -e "${YELLOW}No existing canisters found, creating all canisters...${NC}"
    dfx canister create --all
else
    echo -e "${YELLOW}Checking existing canisters...${NC}"
    
    # List of expected canisters from dfx.json
    CANISTERS=("backend" "frontend" "internet_identity" "mock_cktestbtc_ledger" "mock_cktestbtc_minter" "mock_icp_ledger")
    
    # Create any missing canisters
    for canister in "${CANISTERS[@]}"; do
        if ! grep -q "\"$canister\"" .dfx/local/canister_ids.json 2>/dev/null; then
            echo -e "${YELLOW}Creating missing canister: $canister${NC}"
            dfx canister create "$canister"
        else
            echo -e "${GREEN}✓ Canister $canister already exists${NC}"
        fi
    done
fi

# Install Internet Identity if it was just created (has no module)
echo -e "${YELLOW}Checking Internet Identity installation...${NC}"
II_STATUS=$(dfx canister status internet_identity 2>/dev/null | grep "Module hash:" | cut -d: -f2 | tr -d ' ')
if [ "$II_STATUS" = "None" ]; then
    echo -e "${YELLOW}Installing Internet Identity WASM...${NC}"
    dfx deploy internet_identity
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Internet Identity installed successfully${NC}"
    else
        echo -e "${RED}❌ Failed to install Internet Identity${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Internet Identity already installed${NC}"
fi

# Deploy mock canisters if they don't have WASM modules installed
echo -e "${YELLOW}Checking mock canister deployments...${NC}"

# Check and deploy mock_cktestbtc_ledger
LEDGER_STATUS=$(dfx canister status mock_cktestbtc_ledger 2>/dev/null | grep "Module hash:" | cut -d: -f2 | tr -d ' ')
if [ "$LEDGER_STATUS" = "None" ]; then
    echo -e "${YELLOW}Deploying mock_cktestbtc_ledger WASM...${NC}"
    dfx deploy mock_cktestbtc_ledger
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Mock ckTestBTC Ledger deployed successfully${NC}"
    else
        echo -e "${RED}❌ Failed to deploy mock_cktestbtc_ledger${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Mock ckTestBTC Ledger already deployed${NC}"
fi

# Check and deploy mock_cktestbtc_minter
MINTER_STATUS=$(dfx canister status mock_cktestbtc_minter 2>/dev/null | grep "Module hash:" | cut -d: -f2 | tr -d ' ')
if [ "$MINTER_STATUS" = "None" ]; then
    echo -e "${YELLOW}Deploying mock_cktestbtc_minter WASM...${NC}"
    dfx deploy mock_cktestbtc_minter
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Mock ckTestBTC Minter deployed successfully${NC}"
    else
        echo -e "${RED}❌ Failed to deploy mock_cktestbtc_minter${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Mock ckTestBTC Minter already deployed${NC}"
fi

# Verify all canisters were created successfully
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ All canisters are ready!${NC}"
    echo -e "${GREEN}📋 Canister IDs:${NC}"
    if [ -f ".dfx/local/canister_ids.json" ]; then
        cat .dfx/local/canister_ids.json | grep -E '"(backend|mock_cktestbtc_ledger|mock_cktestbtc_minter|internet_identity)"' || echo "  (canister IDs not yet available)"
    fi
else
    echo -e "${RED}❌ Failed to create canisters${NC}"
    exit 1
fi