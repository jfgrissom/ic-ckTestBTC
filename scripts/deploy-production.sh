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
    local required_tools=("dfx" "jq" "cargo")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            echo -e "${RED}❌ Required tool not found: $tool${NC}"
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
    echo -e "${BLUE}🔨 Building for production deployment...${NC}"

    # Verify and load environment variables
    echo -e "${GREEN}Loading environment variables...${NC}"
    if [ -f "dfx.json" ] && command -v jq &> /dev/null; then
        eval "$(jq -r '.env | to_entries[] | "export \(.key)=\"\(.value)\""' dfx.json)"
    else
        echo -e "${RED}❌ Cannot load environment variables${NC}"
        exit 1
    fi

    # Build backend
    echo -e "${GREEN}Building backend canister...${NC}"
    ./scripts/build-backend.sh

    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Production build failed${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ Production build successful${NC}"
}

# Function to deploy with upgrade mode
deploy_with_upgrade() {
    echo -e "${BLUE}🚀 Deploying to IC with --mode upgrade (preserves data)...${NC}"

    # CRITICAL: Always use --mode upgrade for production
    # NEVER use --mode reinstall on IC network (would destroy user data)

    echo -e "${BOLD}${GREEN}Using --mode upgrade to preserve all user data${NC}"

    # Deploy with explicit upgrade mode and network specification
    LOCAL_MOCK_LEDGER_CANISTER_ID="$LOCAL_MOCK_LEDGER_CANISTER_ID" \
    IC_CKTESTBTC_CANISTER_ID="$IC_CKTESTBTC_CANISTER_ID" \
    dfx deploy --network ic --mode upgrade backend

    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Production deployment failed${NC}"
        echo -e "${YELLOW}💡 Check the error above and the deployment logs${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ Deployment to IC successful${NC}"
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

# FINAL SAFETY CHECKPOINT: Last chance to abort
echo -e "${BOLD}${RED}🚨 FINAL CONFIRMATION REQUIRED 🚨${NC}"
require_confirmation \
    "This is your LAST CHANCE to abort. Deploy to production now?" \
    "Deploy to production"

echo ""

deploy_with_upgrade
echo ""

verify_deployment
echo ""

show_post_deployment_instructions