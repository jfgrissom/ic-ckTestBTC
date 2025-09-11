#!/bin/bash

# Build script to pass canister IDs as environment variables during compilation

# Get the local token canister ID from dfx
if [ -f ".dfx/local/canister_ids.json" ]; then
    LOCAL_TOKEN_ID=$(cat .dfx/local/canister_ids.json | grep -A1 '"local_token"' | grep '"local"' | cut -d'"' -f4)
    echo "Found local_token canister ID: $LOCAL_TOKEN_ID"
    export LOCAL_TOKEN_CANISTER_ID=$LOCAL_TOKEN_ID
fi

# Export other canister IDs if needed
export CKTESTBTC_CANISTER_ID="g4xu7-jiaaa-aaaan-aaaaq-cai"

# Build the backend with environment variables
echo "Building backend with canister IDs..."
dfx build backend

echo "Build complete!"