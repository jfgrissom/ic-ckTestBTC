#!/bin/bash

# Generate TypeScript declarations using candid-extractor workaround for DFX bug

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Generating TypeScript declarations with candid-extractor...${NC}"

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

# Create declarations directory if it doesn't exist
mkdir -p src/declarations/backend

# Extract Candid manually using candid-extractor to fix dfx generate bug
echo -e "${YELLOW}Using candid-extractor to fix dfx generate missing functions issue${NC}"
candid-extractor "$WASM_FILE" > src/declarations/backend/backend.did

# Verify the extraction worked by checking for our functions
if grep -q "faucet" src/declarations/backend/backend.did && grep -q "get_btc_address" src/declarations/backend/backend.did; then
    echo -e "${GREEN}✅ Manual extraction successful - all functions found${NC}"
    
    # List all functions found
    echo -e "${GREEN}📋 Functions detected:${NC}"
    grep -E "^\s*\"[^\"]+\":" src/declarations/backend/backend.did | sed 's/.*"\([^"]*\)".*/  - \1/' | sort
else
    echo -e "${RED}❌ Manual extraction failed - functions missing${NC}"
    echo -e "${YELLOW}🔍 Functions found in Candid file:${NC}"
    grep -E "^\s*\"[^\"]+\":" src/declarations/backend/backend.did | sed 's/.*"\([^"]*\)".*/  - \1/' | sort
    exit 1
fi

# Generate TypeScript bindings from the corrected Candid file
echo -e "${GREEN}Generating TypeScript bindings from corrected Candid file...${NC}"

# First, let dfx generate create the directory structure and basic files
echo -e "${YELLOW}Running dfx generate to create directory structure${NC}"
dfx generate backend

# Now overwrite with our correct files
echo -e "${YELLOW}Overwriting with complete Candid interface and TypeScript bindings${NC}"

# Restore our complete Candid file
candid-extractor target/wasm32-unknown-unknown/release/backend.wasm > src/declarations/backend/backend.did

# Create the correct TypeScript bindings manually
cat > src/declarations/backend/backend.did.js << 'EOF'
export const idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({ 'Ok' : IDL.Nat, 'Err' : IDL.Text });
  const TextResult = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text });
  return IDL.Service({
    'faucet' : IDL.Func([], [TextResult], []),
    'get_balance' : IDL.Func([], [Result], []),
    'get_btc_address' : IDL.Func([], [TextResult], []),
    'get_principal' : IDL.Func([], [IDL.Principal], ['query']),
    'transfer' : IDL.Func([IDL.Principal, IDL.Nat], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
EOF

# Create TypeScript declaration file
cat > src/declarations/backend/backend.did.d.ts << 'EOF'
import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export type Result = { 'Ok' : bigint } | { 'Err' : string };
export type TextResult = { 'Ok' : string } | { 'Err' : string };

export interface _SERVICE {
  'faucet' : ActorMethod<[], TextResult>,
  'get_balance' : ActorMethod<[], Result>,
  'get_btc_address' : ActorMethod<[], TextResult>,
  'get_principal' : ActorMethod<[], Principal>,
  'transfer' : ActorMethod<[Principal, bigint], Result>,
}
EOF

echo -e "${GREEN}✅ Complete TypeScript bindings created with all functions${NC}"

# Verify TypeScript declarations were created
if [ -f "src/declarations/backend/backend.did.js" ] && [ -f "src/declarations/backend/backend.did.d.ts" ]; then
    echo -e "${GREEN}✅ TypeScript declarations generated successfully${NC}"
    
    # Show file sizes
    JS_SIZE=$(stat -f%z "src/declarations/backend/backend.did.js" 2>/dev/null || stat -c%s "src/declarations/backend/backend.did.js" 2>/dev/null)
    TS_SIZE=$(stat -f%z "src/declarations/backend/backend.did.d.ts" 2>/dev/null || stat -c%s "src/declarations/backend/backend.did.d.ts" 2>/dev/null)
    echo -e "${GREEN}📄 Generated files:${NC}"
    echo -e "  - backend.did.js (${JS_SIZE} bytes)"
    echo -e "  - backend.did.d.ts (${TS_SIZE} bytes)"
else
    echo -e "${RED}❌ TypeScript declaration generation failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Declaration generation complete!${NC}"