use candid::{CandidType, Deserialize, Nat, Principal};
use ic_cdk::api::call::CallResult;
use ic_cdk::{caller, query, update};
use serde::Serialize;
use sha2::{Sha256, Digest};

// Define a specific Result type for string operations 
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum TextResult {
    Ok(String),
    Err(String),
}

// Get canister IDs from environment variables at compile time, with fallbacks
const CKTESTBTC_CANISTER: &str = match option_env!("CKTESTBTC_CANISTER_ID") {
    Some(id) => id,
    None => "g4xu7-jiaaa-aaaan-aaaaq-cai", // Default mainnet ckTestBTC
};

const LOCAL_TOKEN_CANISTER: &str = match option_env!("LOCAL_TOKEN_CANISTER_ID") {
    Some(id) => id,
    None => "ucwa4-rx777-77774-qaada-cai", // Fallback to last known local token ID
};

// Helper function to detect if we're running locally
fn is_local_development() -> bool {
    // In local development, the management canister has a different ID
    // This is a simple heuristic to detect local vs production
    ic_cdk::api::id().to_text().contains("7777")
}

// Get the appropriate token canister based on environment
fn get_token_canister() -> Result<Principal, String> {
    if is_local_development() {
        Principal::from_text(LOCAL_TOKEN_CANISTER).map_err(|e| format!("Invalid local token principal: {e}"))
    } else {
        Principal::from_text(CKTESTBTC_CANISTER).map_err(|e| format!("Invalid ckTestBTC principal: {e}"))
    }
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct Account {
    pub owner: Principal,
    pub subaccount: Option<Vec<u8>>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct TransferArgs {
    pub from_subaccount: Option<Vec<u8>>,
    pub to: Account,
    pub amount: Nat,
    pub fee: Option<Nat>,
    pub memo: Option<Vec<u8>>,
    pub created_at_time: Option<u64>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum TransferError {
    BadFee { expected_fee: Nat },
    BadBurn { min_burn_amount: Nat },
    InsufficientFunds { balance: Nat },
    TooOld,
    CreatedInFuture { ledger_time: u64 },
    Duplicate { duplicate_of: Nat },
    TemporarilyUnavailable,
    GenericError { error_code: Nat, message: String },
}


type TransferResult = Result<Nat, TransferError>;

#[update]
async fn get_balance() -> Result<Nat, String> {
    let account = Account {
        owner: caller(),
        subaccount: None,
    };

    let token_canister = get_token_canister()?;

    let result: CallResult<(Nat,)> = ic_cdk::call(token_canister, "icrc1_balance_of", (account,)).await;

    match result {
        Ok((balance,)) => Ok(balance),
        Err(e) => Err(format!("Failed to get balance: {e:?}")),
    }
}

#[update]
async fn transfer(to_principal: Principal, amount: Nat) -> Result<Nat, String> {
    let to_account = Account {
        owner: to_principal,
        subaccount: None,
    };

    let transfer_args = TransferArgs {
        from_subaccount: None,
        to: to_account,
        amount,
        fee: None,
        memo: None,
        created_at_time: Some(ic_cdk::api::time()),
    };

    let token_canister = get_token_canister()?;

    let result: CallResult<(TransferResult,)> =
        ic_cdk::call(token_canister, "icrc1_transfer", (transfer_args,)).await;

    match result {
        Ok((Ok(block_index),)) => Ok(block_index),
        Ok((Err(transfer_error),)) => Err(format!("Transfer failed: {transfer_error:?}")),
        Err(e) => Err(format!("Call failed: {e:?}")),
    }
}

#[query]
fn get_principal() -> Principal {
    caller()
}

#[update]
async fn faucet() -> TextResult {
    // Only works in local development
    if !is_local_development() {
        return TextResult::Err("Faucet only available in local development".to_string());
    }
    
    let caller_principal = caller();
    let account = Account {
        owner: caller_principal,
        subaccount: None,
    };
    
    // Mint 1 ckTestBTC (100,000,000 smallest units) to the caller
    let amount = Nat::from(100_000_000u64);
    
    let token_canister = match get_token_canister() {
        Ok(canister) => canister,
        Err(e) => return TextResult::Err(e),
    };
    
    // Call the mint function on local_token
    let result: CallResult<(Result<Nat, TransferError>,)> = 
        ic_cdk::call(token_canister, "mint", (account, amount.clone())).await;
    
    match result {
        Ok((Ok(_block_index),)) => TextResult::Ok(format!("Successfully minted 1 ckTestBTC to {}", caller_principal)),
        Ok((Err(e),)) => TextResult::Err(format!("Mint failed: {:?}", e)),
        Err(e) => TextResult::Err(format!("Call failed: {:?}", e)),
    }
}

#[update]
async fn get_btc_address() -> TextResult {
    let caller_principal = caller();
    
    // For local development, generate a mock testnet address
    if is_local_development() {
        // Create a deterministic mock address based on the principal
        // Format: tb1q{hash_of_principal}... (testnet bech32 format)
        let principal_bytes = caller_principal.as_slice();
        let mut hasher = Sha256::new();
        hasher.update(principal_bytes);
        let hash = hasher.finalize();
        
        // Take first 20 bytes of hash and encode as hex for a mock address
        let addr_suffix = hex::encode(&hash[..20]);
        let mock_address = format!("tb1q{}", &addr_suffix[..32]); // tb1q prefix for testnet
        
        return TextResult::Ok(mock_address);
    }
    
    // For mainnet, we would call the ckTestBTC canister's btc_get_address equivalent
    // The actual ckBTC/ckTestBTC uses a derivation path from the principal
    // This would involve calling something like:
    // let token_canister = get_token_canister()?;
    // let result: CallResult<(String,)> = ic_cdk::call(token_canister, "get_btc_address", (account,)).await;
    
    // For now, return a placeholder for mainnet
    // In production, this would integrate with the actual ckTestBTC address derivation
    TextResult::Ok(format!("tb1q_mainnet_address_for_{}", &caller_principal.to_text()[..8]))
}

ic_cdk::export_candid!();
