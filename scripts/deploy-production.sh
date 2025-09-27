#!/bin/bash

# Production-Safe Deployment Script for IC Network
# This script ensures safe deployment to Internet Computer mainnet with data preservation

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Security flags
set -euo pipefail  # Exit on error, undefined vars, pipe failures

echo -e "${BOLD}${BLUE}================================================${NC}"
echo -e "${BOLD}${BLUE}  IC PRODUCTION DEPLOYMENT - SAFETY PROTOCOL  ${NC}"
echo -e "${BOLD}${BLUE}================================================${NC}"
echo ""

# Function to detect network
detect_network() {
    # Check if dfx is configured for IC network
    if dfx ping --network ic &>/dev/null; then
        echo "ic"
    else
        echo "local"
    fi
}

# Function to require explicit confirmation
require_confirmation() {
    local prompt="$1"
    local required_input="$2"
    local user_input

    echo -e "${YELLOW}$prompt${NC}"
    echo -e "${BOLD}Type exactly: ${RED}$required_input${NC}"
    read -p "> " user_input

    if [ "$user_input" != "$required_input" ]; then
        echo -e "${RED}❌ Confirmation failed. Deployment aborted.${NC}"
        exit 1
    fi
}

# Function to show current production state
show_production_state() {
    echo -e "${BLUE}📊 Current Production State:${NC}"
    echo "----------------------------------------"

    # Try to get backend canister status
    if dfx canister --network ic status backend 2>/dev/null; then
        echo -e "${GREEN}✅ Backend canister is running${NC}"

        # Try to get basic info (if methods are available)
        echo -e "${BLUE}💰 Checking production balances...${NC}"
        if dfx canister --network ic call backend get_balance 2>/dev/null; then
            echo -e "${GREEN}✅ Balance query successful${NC}"
        else
            echo -e "${YELLOW}⚠️  Balance query failed (may be normal if canister is being upgraded)${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Backend canister status unknown or not deployed${NC}"
    fi

    echo "----------------------------------------"
}

# Function to backup current state
backup_current_state() {
    echo -e "${BLUE}💾 Creating deployment backup...${NC}"

    local backup_dir="backups/deployment-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"

    # Backup current codebase
    echo -e "${GREEN}📁 Backing up current codebase...${NC}"
    cp -r src/ "$backup_dir/"
    cp dfx.json "$backup_dir/"
    cp package.json "$backup_dir/"

    echo -e "${GREEN}✅ Backup created: $backup_dir${NC}"
    echo -e "${YELLOW}💡 To rollback: Deploy from this backup directory${NC}"
}

# Function to validate deployment environment
validate_environment() {
    echo -e "${BLUE}🔍 Validating deployment environment...${NC}"

    # Check required tools
    local required_tools=("dfx" "jq" "cargo" "candid-extractor")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            echo -e "${RED}❌ Required tool not found: $tool${NC}"
            if [ "$tool" = "candid-extractor" ]; then
                echo -e "${YELLOW}Install with: cargo install candid-extractor${NC}"
            fi
            exit 1
        fi
    done

    # Check dfx version
    local dfx_version=$(dfx --version | head -n 1)
    echo -e "${GREEN}✅ DFX Version: $dfx_version${NC}"

    # Verify we have IC network access
    if ! dfx ping --network ic &>/dev/null; then
        echo -e "${RED}❌ Cannot connect to IC network${NC}"
        echo -e "${YELLOW}💡 Check your internet connection and dfx configuration${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ Environment validation passed${NC}"
}

# Function to build with production checks
build_with_checks() {
    echo -e "${BLUE}🔨 Preparing for production deployment...${NC}"

    # Verify and load environment variables
    echo -e "${GREEN}Loading environment variables...${NC}"
    if [ -f "dfx.json" ] && command -v jq &> /dev/null; then
        eval "$(jq -r '.env | to_entries[] | "export \(.key)=\"\(.value)\""' dfx.json)"
    else
        echo -e "${RED}❌ Cannot load environment variables${NC}"
        exit 1
    fi

    # NOTE: We do NOT build here anymore
    # The actual production build happens in deploy_with_upgrade() function
    # This ensures a clean build without development features
    echo -e "${YELLOW}⚠️  Production build will be performed during deployment${NC}"
    echo -e "${YELLOW}    This ensures clean build without development features${NC}"
    echo -e "${YELLOW}    Build includes verification that no dev features are present${NC}"

    echo -e "${GREEN}✅ Pre-deployment preparation complete${NC}"
}

# Function to run production safety tests
run_production_safety_tests() {
    echo -e "${BLUE}🧪 Running Production Safety Tests...${NC}"
    echo -e "${YELLOW}These tests verify the production build is safe for deployment${NC}"
    echo ""

    # Test 1: Verify NO development features in production build
    echo -e "${BLUE}Test 1: Development Feature Detection${NC}"
    echo -e "${YELLOW}Expected: FAIL (no faucet function should be found)${NC}"

    if candid-extractor target/wasm32-unknown-unknown/release/backend.wasm 2>/dev/null | grep -q "faucet"; then
        echo -e "${BOLD}${RED}❌ FATAL ERROR: Development features detected in production build!${NC}"
        echo -e "${RED}The faucet() function was found in the production WASM.${NC}"
        echo -e "${RED}This is a critical security issue. Deployment aborted.${NC}"
        echo -e "${RED}Production builds must NEVER contain development features.${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ Test 1 PASSED: No development features found${NC}"
    fi
    echo ""

    # Test 2: Verify production canister IDs are being used
    echo -e "${BLUE}Test 2: Production Configuration Check${NC}"
    echo -e "${YELLOW}Checking that production canister IDs are configured${NC}"

    if [ -z "$IC_CKTESTBTC_CANISTER_ID" ]; then
        echo -e "${RED}❌ FATAL ERROR: IC_CKTESTBTC_CANISTER_ID not set${NC}"
        exit 1
    fi

    if [ "$IC_CKTESTBTC_CANISTER_ID" != "g4xu7-jiaaa-aaaan-aaaaq-cai" ]; then
        echo -e "${YELLOW}⚠️  Warning: Non-standard IC ckTestBTC canister ID: $IC_CKTESTBTC_CANISTER_ID${NC}"
        echo -e "${YELLOW}   Expected: g4xu7-jiaaa-aaaan-aaaaq-cai${NC}"
        echo -e "${YELLOW}   This may be intentional for testing${NC}"
    fi
    echo -e "${GREEN}✅ Test 2 PASSED: Production configuration verified${NC}"
    echo ""

    # Test 3: WASM size and basic validation
    echo -e "${BLUE}Test 3: WASM File Validation${NC}"
    WASM_FILE="target/wasm32-unknown-unknown/release/backend.wasm"

    if [ ! -f "$WASM_FILE" ]; then
        echo -e "${RED}❌ FATAL ERROR: Production WASM file not found${NC}"
        exit 1
    fi

    WASM_SIZE=$(stat -f%z "$WASM_FILE" 2>/dev/null || stat -c%s "$WASM_FILE" 2>/dev/null)
    echo -e "${GREEN}✅ Test 3 PASSED: WASM file exists (${WASM_SIZE} bytes)${NC}"
    echo ""

    # Test 4: Candid interface validation
    echo -e "${BLUE}Test 4: Candid Interface Validation${NC}"
    FUNCTION_COUNT=$(candid-extractor "$WASM_FILE" 2>/dev/null | grep -E "^\s+[a-zA-Z_]" | wc -l | tr -d ' ')

    if [ "$FUNCTION_COUNT" -lt 10 ]; then
        echo -e "${RED}❌ FATAL ERROR: Too few functions found in Candid interface ($FUNCTION_COUNT)${NC}"
        echo -e "${RED}This suggests the build may be incomplete${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ Test 4 PASSED: Candid interface contains $FUNCTION_COUNT functions${NC}"
    echo ""

    echo -e "${BOLD}${GREEN}🎉 ALL PRODUCTION SAFETY TESTS PASSED${NC}"
    echo -e "${GREEN}The production build is verified safe for deployment${NC}"
    echo ""
}

# Function to deploy with upgrade mode
deploy_with_upgrade() {
    echo -e "${BLUE}🚀 Deploying to IC with --mode upgrade (preserves data)...${NC}"

    # CRITICAL: Always use --mode upgrade for production
    # NEVER use --mode reinstall on IC network (would destroy user data)

    echo -e "${BOLD}${GREEN}Using --mode upgrade to preserve all user data${NC}"

    # SECURITY: Production builds must NOT include development features
    echo -e "${YELLOW}⚠️  PRODUCTION BUILD: Excluding all development-only features${NC}"
    echo -e "${YELLOW}⚠️  This means no faucet function will exist in production binary${NC}"

    # CRITICAL: Clean any existing builds to ensure production safety
    echo -e "${RED}🧹 Cleaning existing build artifacts...${NC}"
    echo -e "${YELLOW}This ensures no development features can leak into production${NC}"
    cargo clean -p backend
    rm -f target/wasm32-unknown-unknown/release/backend.wasm

    # Build production WASM explicitly WITHOUT development features
    echo -e "${GREEN}Building production WASM (no development features)...${NC}"
    echo -e "${YELLOW}Building with environment variables:${NC}"
    echo -e "${YELLOW}  IC_CKTESTBTC_CANISTER_ID=${IC_CKTESTBTC_CANISTER_ID}${NC}"

    # Build with production configuration (no --features flag)
    cd src/backend
    IC_CKTESTBTC_CANISTER_ID="$IC_CKTESTBTC_CANISTER_ID" \
    cargo build --target wasm32-unknown-unknown --release

    # Check if build was successful
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Production build failed${NC}"
        cd ../..
        exit 1
    fi
    cd ../..

    # CRITICAL: Verify NO development features in production WASM
    echo -e "${YELLOW}🔍 Verifying production build safety...${NC}"
    if candid-extractor target/wasm32-unknown-unknown/release/backend.wasm 2>/dev/null | grep -q "faucet"; then
        echo -e "${BOLD}${RED}❌ FATAL ERROR: Development features detected in production build!${NC}"
        echo -e "${RED}The faucet() function was found in the production WASM.${NC}"
        echo -e "${RED}This is a critical security issue. Deployment aborted.${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ Production build verified - NO development features found${NC}"
    fi

    # Show WASM info
    WASM_FILE="target/wasm32-unknown-unknown/release/backend.wasm"
    if [ -f "$WASM_FILE" ]; then
        WASM_SIZE=$(stat -f%z "$WASM_FILE" 2>/dev/null || stat -c%s "$WASM_FILE" 2>/dev/null)
        echo -e "${GREEN}📦 Production WASM: ${WASM_FILE} (${WASM_SIZE} bytes)${NC}"
    fi

    echo -e "${GREEN}✅ Production build and verification complete${NC}"
    echo -e "${YELLOW}Ready for deployment after safety tests${NC}"
}

# Function to verify deployment
verify_deployment() {
    echo -e "${BLUE}🔎 Verifying production deployment...${NC}"

    # Check canister status
    echo -e "${GREEN}Checking canister status...${NC}"
    dfx canister --network ic status backend

    # Try basic functionality test
    echo -e "${GREEN}Testing basic functionality...${NC}"
    if dfx canister --network ic call backend get_balance 2>/dev/null; then
        echo -e "${GREEN}✅ Basic functionality test passed${NC}"
    else
        echo -e "${YELLOW}⚠️  Basic functionality test failed (may require user authentication)${NC}"
    fi

    # Generate fresh declarations
    echo -e "${GREEN}Generating fresh TypeScript declarations...${NC}"
    ./scripts/generate-declarations.sh

    echo -e "${GREEN}✅ Deployment verification complete${NC}"
}

# Function to show post-deployment instructions
show_post_deployment_instructions() {
    echo ""
    echo -e "${BOLD}${BLUE}================================================${NC}"
    echo -e "${BOLD}${BLUE}  PRODUCTION DEPLOYMENT COMPLETE               ${NC}"
    echo -e "${BOLD}${BLUE}================================================${NC}"
    echo ""
    echo -e "${GREEN}✅ Backend canister successfully deployed to IC${NC}"
    echo ""
    echo -e "${BOLD}${YELLOW}Next Steps:${NC}"
    echo -e "${YELLOW}1. Test the frontend application thoroughly${NC}"
    echo -e "${YELLOW}2. Verify all wallet functions work correctly${NC}"
    echo -e "${YELLOW}3. Check transaction history and balances${NC}"
    echo -e "${YELLOW}4. Monitor canister logs for any issues${NC}"
    echo ""
    echo -e "${BOLD}${BLUE}Useful Commands:${NC}"
    echo -e "${BLUE}• Check status: dfx canister --network ic status backend${NC}"
    echo -e "${BLUE}• View logs: dfx canister --network ic logs backend${NC}"
    echo -e "${BLUE}• Call methods: dfx canister --network ic call backend <method>${NC}"
    echo ""
    echo -e "${BOLD}${GREEN}🎉 Production deployment successful!${NC}"
}

# MAIN EXECUTION FLOW

echo -e "${YELLOW}🔍 Detecting deployment network...${NC}"
CURRENT_NETWORK=$(detect_network)

if [ "$CURRENT_NETWORK" != "ic" ]; then
    echo -e "${RED}❌ This script is for IC production deployment only${NC}"
    echo -e "${YELLOW}💡 For local deployment, use: npm run deploy:local${NC}"
    exit 1
fi

echo -e "${GREEN}✅ IC network detected${NC}"
echo ""

# SAFETY CHECKPOINT 1: Show current state
show_production_state
echo ""

# SAFETY CHECKPOINT 2: Require explicit confirmation
require_confirmation \
    "⚠️  This will deploy to PRODUCTION (IC network) where REAL USERS have funds stored." \
    "I understand this affects production users"

echo ""

# SAFETY CHECKPOINT 3: Confirm upgrade mode
require_confirmation \
    "🔒 This deployment will use --mode upgrade to PRESERVE all user data and funds." \
    "I confirm data preservation"

echo ""

# Execute deployment steps
validate_environment
echo ""

backup_current_state
echo ""

build_with_checks
echo ""

deploy_with_upgrade
echo ""

run_production_safety_tests
echo ""

# FINAL SAFETY CHECKPOINT: Last chance to abort
echo -e "${BOLD}${RED}🚨 FINAL CONFIRMATION REQUIRED 🚨${NC}"
echo -e "${YELLOW}Production build completed and safety tests passed.${NC}"
require_confirmation \
    "This is your LAST CHANCE to abort. Deploy verified production WASM to IC now?" \
    "Deploy to production"

echo ""

# Deploy the verified production WASM
echo -e "${GREEN}Deploying verified production WASM to IC...${NC}"
dfx canister install backend --network ic --mode upgrade --wasm target/wasm32-unknown-unknown/release/backend.wasm --yes
echo ""

verify_deployment
echo ""

show_post_deployment_instructions