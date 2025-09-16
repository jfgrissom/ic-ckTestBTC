#!/bin/bash

# Generate TypeScript declarations using proper DFX protocol
# This script follows DFX 0.29.1 best practices for scalable declaration generation

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Generating TypeScript declarations using DFX 0.29.1 protocol...${NC}"

# Check if WASM file exists
WASM_FILE="target/wasm32-unknown-unknown/release/backend.wasm"
if [ ! -f "$WASM_FILE" ]; then
    echo -e "${RED}❌ WASM file not found: ${WASM_FILE}${NC}"
    echo -e "${YELLOW}💡 Run './scripts/build-backend.sh' first to build the backend${NC}"
    exit 1
fi

# Show WASM file info
WASM_SIZE=$(stat -f%z "$WASM_FILE" 2>/dev/null || stat -c%s "$WASM_FILE" 2>/dev/null)
echo -e "${GREEN}📦 Using WASM file: ${WASM_FILE} (${WASM_SIZE} bytes)${NC}"

# Step 1: Extract complete Candid interface from compiled WASM
echo -e "${GREEN}Step 1: Extracting complete Candid interface from WASM...${NC}"
candid-extractor "$WASM_FILE" > src/backend/backend.did

# Verify the extraction worked by checking for key functions
if grep -q "get_transaction_history" src/backend/backend.did && grep -q "faucet" src/backend/backend.did; then
    echo -e "${GREEN}✅ Candid extraction successful - all functions found${NC}"

    # List all functions found
    echo -e "${GREEN}📋 Functions detected:${NC}"
    grep -E "^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*:" src/backend/backend.did | sed 's/[[:space:]]*\([^:]*\).*/  - \1/' | sort
else
    echo -e "${RED}❌ Candid extraction failed - functions missing${NC}"
    echo -e "${YELLOW}🔍 Functions found in Candid file:${NC}"
    grep -E "^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*:" src/backend/backend.did | sed 's/[[:space:]]*\([^:]*\).*/  - \1/' | sort
    exit 1
fi

# Step 2: Use standard DFX generate for TypeScript declarations
echo -e "${GREEN}Step 2: Generating TypeScript declarations with dfx generate...${NC}"
dfx generate backend

# Verify TypeScript declarations were created
if [ -f "src/declarations/backend/backend.did.d.ts" ] && [ -f "src/declarations/backend/backend.did.js" ]; then
    echo -e "${GREEN}✅ TypeScript declarations generated successfully${NC}"

    # Show file sizes
    DTS_SIZE=$(stat -f%z "src/declarations/backend/backend.did.d.ts" 2>/dev/null || stat -c%s "src/declarations/backend/backend.did.d.ts" 2>/dev/null)
    JS_SIZE=$(stat -f%z "src/declarations/backend/backend.did.js" 2>/dev/null || stat -c%s "src/declarations/backend/backend.did.js" 2>/dev/null)
    DID_SIZE=$(stat -f%z "src/declarations/backend/backend.did" 2>/dev/null || stat -c%s "src/declarations/backend/backend.did" 2>/dev/null)

    echo -e "${GREEN}📄 Generated files:${NC}"
    echo -e "  - backend.did (${DID_SIZE} bytes)"
    echo -e "  - backend.did.d.ts (${DTS_SIZE} bytes)"
    echo -e "  - backend.did.js (${JS_SIZE} bytes)"

    # Verify key functions exist in TypeScript declarations
    if grep -q "get_transaction_history" src/declarations/backend/backend.did.d.ts; then
        echo -e "${GREEN}✅ Complete interface confirmed in TypeScript declarations${NC}"
    else
        echo -e "${YELLOW}⚠️ Some functions may be missing from TypeScript declarations${NC}"
    fi
else
    echo -e "${RED}❌ TypeScript declaration generation failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Declaration generation complete using DFX protocol!${NC}"
echo -e "${YELLOW}📝 How this works:${NC}"
echo -e "${YELLOW}  1. candid-extractor extracts complete interface from compiled WASM${NC}"
echo -e "${YELLOW}  2. Complete interface is saved to src/backend/backend.did${NC}"
echo -e "${YELLOW}  3. dfx generate reads the complete interface and generates proper TypeScript${NC}"
echo -e "${YELLOW}  4. This scales automatically as new functions are added to the backend${NC}"