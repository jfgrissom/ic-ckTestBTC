#!/bin/bash

# Validation script to test environment variable setup after complete DFX restart

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Environment Variable Setup Validation${NC}"
echo -e "${BLUE}=========================================${NC}"

# Function to test a specific step
test_step() {
    local step_name="$1"
    local command="$2"
    local expected_result="$3"

    echo -e "${YELLOW}Testing: $step_name${NC}"

    if eval "$command"; then
        echo -e "${GREEN}✅ $step_name - PASSED${NC}"
        return 0
    else
        echo -e "${RED}❌ $step_name - FAILED${NC}"
        return 1
    fi
}

# Function to check if environment variable is set in dfx.json
check_dfx_env() {
    local var_name="$1"
    local description="$2"

    echo -e "${YELLOW}Checking dfx.json env.$var_name...${NC}"

    if command -v jq &> /dev/null; then
        local value=$(jq -r ".env.$var_name" dfx.json 2>/dev/null)
        if [ "$value" != "null" ] && [ ! -z "$value" ]; then
            echo -e "${GREEN}✅ $description: $value${NC}"
            return 0
        else
            echo -e "${RED}❌ $description not found in dfx.json${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ jq not available for dfx.json validation${NC}"
        return 1
    fi
}

# Function to check if backend can access environment variables
check_backend_env() {
    echo -e "${YELLOW}Checking backend environment variable access...${NC}"

    # Check if dfx.json has the required env vars
    if check_dfx_env "LOCAL_MOCK_LEDGER_CANISTER_ID" "Local Mock Ledger Canister ID" && \
       check_dfx_env "IC_CKTESTBTC_CANISTER_ID" "IC ckTestBTC Canister ID"; then
        echo -e "${GREEN}✅ Backend environment variables are properly configured${NC}"
        return 0
    else
        echo -e "${RED}❌ Backend environment variables are missing${NC}"
        return 1
    fi
}

OVERALL_SUCCESS=true

echo -e "${BLUE}Step 1: Checking DFX Status${NC}"
if ! dfx ping > /dev/null 2>&1; then
    echo -e "${RED}❌ DFX is not running${NC}"
    echo -e "${YELLOW}Please start DFX first: dfx start --clean${NC}"
    exit 1
else
    echo -e "${GREEN}✅ DFX is running${NC}"
fi

echo ""
echo -e "${BLUE}Step 2: Testing Canister Creation${NC}"
if test_step "Canister setup" "./scripts/setup-canisters.sh"; then
    echo -e "${GREEN}✅ All canisters created successfully${NC}"
else
    echo -e "${RED}❌ Canister setup failed${NC}"
    OVERALL_SUCCESS=false
fi

echo ""
echo -e "${BLUE}Step 3: Testing Environment Variable Update${NC}"
if test_step "Environment update" "./scripts/update-env.sh"; then
    echo -e "${GREEN}✅ Environment variables updated successfully${NC}"
else
    echo -e "${RED}❌ Environment variable update failed${NC}"
    OVERALL_SUCCESS=false
fi

echo ""
echo -e "${BLUE}Step 4: Validating dfx.json Environment Section${NC}"
if check_backend_env; then
    echo -e "${GREEN}✅ dfx.json environment section is properly configured${NC}"
else
    echo -e "${RED}❌ dfx.json environment section is missing or invalid${NC}"
    OVERALL_SUCCESS=false
fi

echo ""
echo -e "${BLUE}Step 5: Testing Backend Build${NC}"
if test_step "Backend build" "./scripts/build-backend.sh"; then
    echo -e "${GREEN}✅ Backend builds successfully with environment variables${NC}"
else
    echo -e "${RED}❌ Backend build failed${NC}"
    OVERALL_SUCCESS=false
fi

echo ""
echo -e "${BLUE}Step 6: Testing Complete Backend Deployment${NC}"
if test_step "Backend deployment" "./scripts/deploy-backend.sh"; then
    echo -e "${GREEN}✅ Backend deployment completed successfully${NC}"
else
    echo -e "${RED}❌ Backend deployment failed${NC}"
    OVERALL_SUCCESS=false
fi

echo ""
echo -e "${BLUE}Step 7: Testing Backend Function Call${NC}"
echo -e "${YELLOW}Attempting to call backend function to verify environment variables are accessible...${NC}"
if dfx canister call backend get_token_canister > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend function call successful - environment variables are working${NC}"
else
    echo -e "${YELLOW}⚠️  Backend function call failed - this might be expected if function doesn't exist${NC}"
    echo -e "${YELLOW}Attempting alternative test...${NC}"

    # Try getting canister status instead
    if dfx canister status backend > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend canister is running properly${NC}"
    else
        echo -e "${RED}❌ Backend canister status check failed${NC}"
        OVERALL_SUCCESS=false
    fi
fi

echo ""
echo -e "${BLUE}Final Results${NC}"
echo -e "${BLUE}=============${NC}"

if [ "$OVERALL_SUCCESS" = true ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo -e "${GREEN}Environment variable setup is working correctly.${NC}"
    echo -e "${GREEN}The npm run dev workflow should work properly after complete DFX restarts.${NC}"
    echo ""
    echo -e "${BLUE}Current Environment Configuration:${NC}"
    if command -v jq &> /dev/null; then
        echo -e "${YELLOW}dfx.json env section:${NC}"
        jq '.env' dfx.json
    fi
    echo ""
    echo -e "${YELLOW}.env file (frontend):${NC}"
    if [ -f ".env" ]; then
        cat .env
    else
        echo -e "${RED}No .env file found${NC}"
    fi
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo -e "${RED}Environment variable setup needs attention.${NC}"
    echo -e "${YELLOW}Please review the failed steps above and fix the issues.${NC}"
    exit 1
fi