#!/bin/bash

# Deploy script for backend canister with dynamic canister IDs
# This script is designed for LOCAL DEVELOPMENT ONLY

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Function to detect network
detect_network() {
    # Check if dfx is configured for IC network
    if dfx ping --network ic &>/dev/null; then
        echo "ic"
    else
        echo "local"
    fi
}

# SAFETY CHECK: Prevent accidental IC deployment
echo -e "${BLUE}🔍 Detecting deployment network...${NC}"
CURRENT_NETWORK=$(detect_network)

if [ "$CURRENT_NETWORK" = "ic" ]; then
    echo -e "${BOLD}${RED}❌ DEPLOYMENT BLOCKED${NC}"
    echo -e "${RED}This script is for LOCAL DEVELOPMENT only.${NC}"
    echo -e "${YELLOW}For IC production deployment, use: ${BOLD}npm run deploy:ic${NC}"
    echo ""
    echo -e "${YELLOW}💡 This prevents accidental deployment to production.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Local network detected - proceeding with deployment${NC}"
echo -e "${BOLD}${BLUE}🏠 LOCAL DEVELOPMENT DEPLOYMENT${NC}"
echo -e "${GREEN}Starting backend deployment...${NC}"

# Note: Canisters should already be created by dfx:setup, but ensure they exist
echo -e "${GREEN}Verifying canisters exist...${NC}"
if [ ! -f ".dfx/local/canister_ids.json" ]; then
    echo -e "${YELLOW}No canister IDs found, creating canisters first...${NC}"
    ./scripts/setup-canisters.sh
fi

# Verify and load environment variables from dfx.json (persistent storage)
echo -e "${GREEN}Loading environment variables from dfx.json persistent storage...${NC}"
if command -v jq &> /dev/null; then
    # Check if dfx.json env section exists and has required variables
    if [ -f "dfx.json" ]; then
        STORED_LEDGER_ID=$(jq -r '.env.LOCAL_MOCK_LEDGER_CANISTER_ID // empty' dfx.json)
        if [ ! -z "$STORED_LEDGER_ID" ] && [ "$STORED_LEDGER_ID" != "null" ]; then
            # Source environment variables from dfx.json using jq
            eval "$(jq -r '.env | to_entries[] | "export \(.key)=\"\(.value)\""' dfx.json)"
            echo -e "${GREEN}✅ Environment variables loaded from dfx.json persistent storage${NC}"
            echo -e "${YELLOW}  LOCAL_MOCK_LEDGER_CANISTER_ID=${LOCAL_MOCK_LEDGER_CANISTER_ID}${NC}"
            echo -e "${YELLOW}  IC_CKTESTBTC_CANISTER_ID=${IC_CKTESTBTC_CANISTER_ID}${NC}"
            echo -e "${YELLOW}  LOCAL_MOCK_MINTER_CANISTER_ID=${LOCAL_MOCK_MINTER_CANISTER_ID:-ulvla-h7777-77774-qaacq-cai}${NC}"
        else
            echo -e "${YELLOW}⚠️  dfx.json env section is empty, running update-env.sh to populate it...${NC}"
            ./scripts/update-env.sh
            if [ $? -ne 0 ]; then
                echo -e "${RED}❌ Environment variable setup failed${NC}"
                exit 1
            fi
            # Re-load after update
            eval "$(jq -r '.env | to_entries[] | "export \(.key)=\"\(.value)\""' dfx.json)"
        fi
    else
        echo -e "${RED}❌ dfx.json not found${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ jq not found - cannot load environment variables from dfx.json${NC}"
    echo -e "${YELLOW}Please install jq: brew install jq (macOS) or apt-get install jq (Linux)${NC}"
    echo -e "${YELLOW}Falling back to update-env.sh...${NC}"
    ./scripts/update-env.sh
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Environment variable setup failed${NC}"
        exit 1
    fi
fi

# Set default for LOCAL_MOCK_MINTER_CANISTER_ID if not set
export LOCAL_MOCK_MINTER_CANISTER_ID="${LOCAL_MOCK_MINTER_CANISTER_ID:-ulvla-h7777-77774-qaacq-cai}"

# Verify required environment variables are set
if [ -z "$LOCAL_MOCK_LEDGER_CANISTER_ID" ]; then
    echo -e "${RED}❌ LOCAL_MOCK_LEDGER_CANISTER_ID is not set${NC}"
    echo -e "${YELLOW}Running update-env.sh to fix this...${NC}"
    ./scripts/update-env.sh
    # Re-source environment variables
    if command -v jq &> /dev/null; then
        eval "$(jq -r '.env | to_entries[] | "export \(.key)=\"\(.value)\""' dfx.json)"
    fi
    if [ -z "$LOCAL_MOCK_LEDGER_CANISTER_ID" ]; then
        echo -e "${RED}❌ Still unable to set LOCAL_MOCK_LEDGER_CANISTER_ID${NC}"
        exit 1
    fi
fi

# Build backend with development features using cargo directly
echo -e "${GREEN}Building backend canister with development features...${NC}"
echo -e "${YELLOW}Building with environment variables:${NC}"
echo -e "${YELLOW}  LOCAL_MOCK_LEDGER_CANISTER_ID=${LOCAL_MOCK_LEDGER_CANISTER_ID}${NC}"
echo -e "${YELLOW}  IC_CKTESTBTC_CANISTER_ID=${IC_CKTESTBTC_CANISTER_ID}${NC}"
echo -e "${YELLOW}  LOCAL_MOCK_MINTER_CANISTER_ID=${LOCAL_MOCK_MINTER_CANISTER_ID:-ulvla-h7777-77774-qaacq-cai}${NC}"

# CRITICAL: Clean existing builds to ensure development features
echo -e "${RED}🧹 Cleaning existing build artifacts...${NC}"
echo -e "${YELLOW}This ensures development features are properly built${NC}"
cargo clean -p backend
rm -f target/wasm32-unknown-unknown/release/backend.wasm

# Build with development features directly using cargo
cd src/backend
LOCAL_MOCK_LEDGER_CANISTER_ID="$LOCAL_MOCK_LEDGER_CANISTER_ID" \
IC_CKTESTBTC_CANISTER_ID="$IC_CKTESTBTC_CANISTER_ID" \
LOCAL_MOCK_MINTER_CANISTER_ID="${LOCAL_MOCK_MINTER_CANISTER_ID:-ulvla-h7777-77774-qaacq-cai}" \
cargo build --target wasm32-unknown-unknown --release --features development

# Check if build was successful
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backend build failed, aborting deployment${NC}"
    cd ../..
    exit 1
fi
cd ../..

# Verify WASM was built with development features
echo -e "${YELLOW}Verifying development features in WASM...${NC}"
if candid-extractor target/wasm32-unknown-unknown/release/backend.wasm 2>/dev/null | grep -q "faucet"; then
    echo -e "${GREEN}✅ Development features confirmed (faucet function found)${NC}"
else
    echo -e "${RED}❌ Development features not found in WASM${NC}"
    exit 1
fi

# Deploy the backend with development features enabled
echo -e "${GREEN}Deploying backend canister with development features...${NC}"

# Force clean rebuild by uninstalling existing code (prevents caching issues)
echo -e "${YELLOW}Uninstalling existing backend code to force clean rebuild...${NC}"
dfx canister uninstall-code backend 2>/dev/null || true

# Deploy with pre-built WASM using canister install
echo -e "${YELLOW}Installing pre-built WASM with development features...${NC}"
dfx canister install backend --mode reinstall --wasm target/wasm32-unknown-unknown/release/backend.wasm --yes

# Store deployment result
DEPLOY_RESULT=$?

# Check if deployment was successful
if [ $DEPLOY_RESULT -ne 0 ]; then
    echo -e "${RED}❌ Backend deployment failed${NC}"
    exit 1
fi

# Generate TypeScript declarations using our reliable script
echo -e "${GREEN}Generating TypeScript declarations...${NC}"
./scripts/generate-declarations.sh

# Check if declaration generation was successful
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Declaration generation failed${NC}"
    exit 1
fi


echo -e "${GREEN}✅ Local backend deployment complete!${NC}"
echo -e "${BLUE}🏠 Deployed to: LOCAL DEVELOPMENT ENVIRONMENT${NC}"
echo ""
echo -e "${YELLOW}💡 For production deployment to IC, use: ${BOLD}npm run deploy:ic${NC}"