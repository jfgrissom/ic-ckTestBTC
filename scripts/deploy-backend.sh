#!/bin/bash

# Deploy script for backend canister with dynamic canister IDs

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting backend deployment...${NC}"

# Build backend first
echo -e "${GREEN}Building backend canister...${NC}"
./scripts/build-backend.sh

# Check if build was successful
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backend build failed, aborting deployment${NC}"
    exit 1
fi

# Deploy the backend
echo -e "${GREEN}Deploying backend canister...${NC}"
dfx deploy backend

# Check if deployment was successful
if [ $? -ne 0 ]; then
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

# Update environment variables with current canister IDs
echo -e "${GREEN}Updating environment variables...${NC}"
./scripts/update-env.sh

# Check if env update was successful
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Environment variable update failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend deployment complete!${NC}"