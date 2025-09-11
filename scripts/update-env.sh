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

# Check if we got all the IDs
if [ -z "$BACKEND_ID" ] || [ -z "$II_ID" ] || [ -z "$FRONTEND_ID" ]; then
    echo -e "${RED}❌ Failed to get all canister IDs${NC}"
    echo "Backend ID: $BACKEND_ID"
    echo "Internet Identity ID: $II_ID"
    echo "Frontend ID: $FRONTEND_ID"
    exit 1
fi

# Update .env file
cat > .env << EOF
# Environment variables for development
VITE_DFX_NETWORK=local
VITE_CANISTER_ID_INTERNET_IDENTITY=$II_ID
VITE_CANISTER_ID_BACKEND=$BACKEND_ID
VITE_CANISTER_ID_FRONTEND=$FRONTEND_ID
EOF

echo -e "${GREEN}✅ Environment variables updated:${NC}"
echo -e "${YELLOW}VITE_CANISTER_ID_BACKEND=$BACKEND_ID${NC}"
echo -e "${YELLOW}VITE_CANISTER_ID_INTERNET_IDENTITY=$II_ID${NC}"
echo -e "${YELLOW}VITE_CANISTER_ID_FRONTEND=$FRONTEND_ID${NC}"