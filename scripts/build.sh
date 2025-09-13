#!/bin/bash

# Build script to pass canister IDs as environment variables during compilation

# Get the mock_cktestbtc_ledger canister ID from dfx
if [ -f ".dfx/local/canister_ids.json" ]; then
    MOCK_LEDGER_ID=$(cat .dfx/local/canister_ids.json | grep -A1 '"mock_cktestbtc_ledger"' | grep '"local"' | cut -d'"' -f4)
    echo "Found mock_cktestbtc_ledger canister ID: $MOCK_LEDGER_ID"
    export MOCK_CKTESTBTC_LEDGER_CANISTER_ID=$MOCK_LEDGER_ID
fi

# Export other canister IDs if needed
export CKTESTBTC_CANISTER_ID="g4xu7-jiaaa-aaaan-aaaaq-cai"

# Build the backend with environment variables
echo "Building backend with canister IDs..."
dfx build backend

echo "Build complete!"