// WARNING: BITCOIN TESTNET4 (TestBTC) ONLY - NO MAINNET BITCOIN
// This backend canister handles only ckTestBTC operations for Bitcoin testnet4 (TestBTC).
// It communicates with mock_cktestbtc_ledger and mock_cktestbtc_minter in local development.
// NEVER processes mainnet Bitcoin (BTC) transactions.

use candid::{CandidType, Deserialize, Nat, Principal};
use ic_cdk::api::call::CallResult;
use ic_cdk::{caller, query, update};
use serde::Serialize;
use sha2::{Sha256, Digest};
use std::cell::RefCell;

// Define a specific Result type for string operations 
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum TextResult {
    Ok(String),
    Err(String),
}

// Transaction history types
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum TransactionType {
    Send,
    Receive,
    Deposit,
    Withdraw,
    Mint,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum TransactionStatus {
    Pending,
    Confirmed,
    Failed,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct Transaction {
    pub id: u64,
    pub tx_type: TransactionType,
    pub token: String, // "ICP" or "ckTestBTC"
    pub amount: Nat,
    pub from: String,
    pub to: String,
    pub status: TransactionStatus,
    pub timestamp: u64,
    pub block_index: Option<Nat>,
}

// Storage for transaction history
thread_local! {
    static TRANSACTIONS: RefCell<Vec<Transaction>> = RefCell::new(Vec::new());
    static TRANSACTION_COUNTER: RefCell<u64> = RefCell::new(0);
}

// Get canister IDs from environment variables at compile time, with fallbacks
const IC_CKTESTBTC_CANISTER: &str = match option_env!("IC_CKTESTBTC_CANISTER_ID") {
    Some(id) => id,
    None => "g4xu7-jiaaa-aaaan-aaaaq-cai", // Default mainnet ckTestBTC
};

const LOCAL_MOCK_LEDGER_CANISTER: &str = match option_env!("LOCAL_MOCK_LEDGER_CANISTER_ID") {
    Some(id) => id,
    None => "", // Will be set dynamically by deployment script
};

const LOCAL_MOCK_MINTER_CANISTER: &str = match option_env!("LOCAL_MOCK_MINTER_CANISTER_ID") {
    Some(id) => id,
    None => "", // Will be set dynamically by deployment script
};

// ICP ledger canister (for ICP support)
const ICP_LEDGER_CANISTER: &str = "ryjl3-tyaaa-aaaaa-aaaba-cai";

// Helper function to detect if we're running locally
fn is_local_development() -> bool {
    // In local development, the management canister has a different ID
    // This is a simple heuristic to detect local vs production
    ic_cdk::api::id().to_text().contains("7777")
}

// Get the appropriate token canister based on environment
fn get_token_canister() -> Result<Principal, String> {
    if is_local_development() {
        if LOCAL_MOCK_LEDGER_CANISTER.is_empty() {
            return Err("LOCAL_MOCK_LEDGER_CANISTER_ID environment variable not set".to_string());
        }
        Principal::from_text(LOCAL_MOCK_LEDGER_CANISTER).map_err(|e| format!("Invalid local mock ledger principal: {e}"))
    } else {
        Principal::from_text(IC_CKTESTBTC_CANISTER).map_err(|e| format!("Invalid IC ckTestBTC principal: {e}"))
    }
}

// Get the minter canister
fn get_minter_canister() -> Result<Principal, String> {
    if is_local_development() {
        if LOCAL_MOCK_MINTER_CANISTER.is_empty() {
            return Err("LOCAL_MOCK_MINTER_CANISTER_ID environment variable not set".to_string());
        }
        Principal::from_text(LOCAL_MOCK_MINTER_CANISTER).map_err(|e| format!("Invalid local mock minter principal: {e}"))
    } else {
        // In production, the minter would be a different canister
        // For now, returning error as we don't have the real minter address
        Err("Minter canister not configured for IC deployment".to_string())
    }
}

// Get ICP ledger canister
fn get_icp_ledger_canister() -> Result<Principal, String> {
    if is_local_development() {
        // In local development, we might have a mock ICP ledger
        // For now, we'll return an error
        Err("ICP ledger not available in local development".to_string())
    } else {
        Principal::from_text(ICP_LEDGER_CANISTER).map_err(|e| format!("Invalid ICP ledger principal: {e}"))
    }
}

// Helper to store a transaction
fn store_transaction(
    tx_type: TransactionType,
    token: String,
    amount: Nat,
    from: String,
    to: String,
    status: TransactionStatus,
    block_index: Option<Nat>,
) -> u64 {
    TRANSACTION_COUNTER.with(|counter| {
        let mut c = counter.borrow_mut();
        *c += 1;
        let id = *c;

        TRANSACTIONS.with(|txs| {
            txs.borrow_mut().push(Transaction {
                id,
                tx_type,
                token,
                amount,
                from,
                to,
                status,
                timestamp: ic_cdk::api::time(),
                block_index,
            });
        });

        id
    })
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
    let from_principal = caller();
    let to_account = Account {
        owner: to_principal,
        subaccount: None,
    };

    let transfer_args = TransferArgs {
        from_subaccount: None,
        to: to_account,
        amount: amount.clone(),
        fee: None,
        memo: None,
        created_at_time: Some(ic_cdk::api::time()),
    };

    let token_canister = get_token_canister()?;

    let result: CallResult<(TransferResult,)> =
        ic_cdk::call(token_canister, "icrc1_transfer", (transfer_args,)).await;

    match result {
        Ok((Ok(block_index),)) => {
            // Store transaction in history
            store_transaction(
                TransactionType::Send,
                "ckTestBTC".to_string(),
                amount,
                from_principal.to_text(),
                to_principal.to_text(),
                TransactionStatus::Confirmed,
                Some(block_index.clone()),
            );
            Ok(block_index)
        },
        Ok((Err(transfer_error),)) => {
            // Store failed transaction
            store_transaction(
                TransactionType::Send,
                "ckTestBTC".to_string(),
                amount,
                from_principal.to_text(),
                to_principal.to_text(),
                TransactionStatus::Failed,
                None,
            );
            Err(format!("Transfer failed: {transfer_error:?}"))
        },
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
        Ok((Ok(block_index),)) => {
            // Record the mint transaction
            let _tx_id = store_transaction(
                TransactionType::Mint,
                "ckTestBTC".to_string(),
                amount.clone(),
                "faucet".to_string(), // From faucet
                caller_principal.to_string(), // To caller
                TransactionStatus::Confirmed,
                Some(block_index.clone()),
            );

            TextResult::Ok(format!("Successfully minted 1 ckTestBTC to {}", caller_principal))
        },
        Ok((Err(e),)) => TextResult::Err(format!("Mint failed: {:?}", e)),
        Err(e) => TextResult::Err(format!("Call failed: {:?}", e)),
    }
}

#[update]
async fn get_btc_address() -> TextResult {
    let caller_principal = caller();

    // For local development, generate a mock TestBTC address
    if is_local_development() {
        // Create a deterministic mock address based on the principal
        // Format: tb1q{hash_of_principal}... (testnet bech32 format)
        let principal_bytes = caller_principal.as_slice();
        let mut hasher = Sha256::new();
        hasher.update(principal_bytes);
        let hash = hasher.finalize();

        // Take first 20 bytes of hash and encode as hex for a mock address
        let addr_suffix = hex::encode(&hash[..20]);
        let mock_address = format!("tb1q{}", &addr_suffix[..32]); // tb1q prefix for TestBTC testnet

        return TextResult::Ok(mock_address);
    }

    // For IC mainnet, we would call the ckTestBTC canister's get_btc_address function
    // The actual ckTestBTC uses a derivation path from the principal
    // This would involve calling something like:
    // let token_canister = get_token_canister()?;
    // let result: CallResult<(String,)> = ic_cdk::call(token_canister, "get_btc_address", (account,)).await;

    // For now, return a placeholder for IC mainnet
    // In production, this would integrate with the actual ckTestBTC address derivation
    TextResult::Ok(format!("tb1q_testbtc_address_for_{}", &caller_principal.to_text()[..8]))
}

// Get deposit address from minter
#[update]
async fn get_deposit_address() -> TextResult {
    let caller_principal = caller();

    // Try to get the minter canister
    let minter_canister = match get_minter_canister() {
        Ok(canister) => canister,
        Err(e) => return TextResult::Err(e),
    };

    // Prepare arguments for minter's get_btc_address
    #[derive(CandidType, Serialize)]
    struct GetBtcAddressArgs {
        owner: Option<Principal>,
        subaccount: Option<Vec<u8>>,
    }

    let args = GetBtcAddressArgs {
        owner: Some(caller_principal),
        subaccount: None,
    };

    // Call minter's get_btc_address function
    let result: CallResult<(String,)> =
        ic_cdk::call(minter_canister, "get_btc_address", (args,)).await;

    match result {
        Ok((address,)) => TextResult::Ok(address),
        Err(e) => TextResult::Err(format!("Failed to get deposit address: {:?}", e)),
    }
}

// Withdraw TestBTC to BTC TestNet
#[update]
async fn withdraw_testbtc(address: String, amount: Nat) -> TextResult {
    let caller_principal = caller();

    // Validate address format (basic check)
    if !address.starts_with("tb1") && !address.starts_with("2") &&
       !address.starts_with("m") && !address.starts_with("n") {
        return TextResult::Err("Invalid TestBTC address format".to_string());
    }

    // Get minter canister
    let minter_canister = match get_minter_canister() {
        Ok(canister) => canister,
        Err(e) => return TextResult::Err(e),
    };

    // Prepare withdrawal arguments
    #[derive(CandidType, Serialize)]
    struct RetrieveBtcArgs {
        address: String,
        amount: u64,
    }

    // Convert Nat to u64 (assuming amount is in satoshis)
    let amount_u64 = amount.0.to_u64_digits()[0];

    let args = RetrieveBtcArgs {
        address: address.clone(),
        amount: amount_u64,
    };

    // Call minter's retrieve_btc function
    #[derive(CandidType, Deserialize)]
    struct RetrieveBtcOk {
        block_index: u64,
    }

    type RetrieveBtcResult = Result<RetrieveBtcOk, String>;

    let result: CallResult<(RetrieveBtcResult,)> =
        ic_cdk::call(minter_canister, "retrieve_btc", (args,)).await;

    match result {
        Ok((Ok(retrieve_ok),)) => {
            // Store withdrawal transaction
            store_transaction(
                TransactionType::Withdraw,
                "ckTestBTC".to_string(),
                amount,
                caller_principal.to_text(),
                address,
                TransactionStatus::Pending,
                Some(Nat::from(retrieve_ok.block_index)),
            );
            TextResult::Ok(format!("Withdrawal initiated. Block index: {}", retrieve_ok.block_index))
        },
        Ok((Err(e),)) => {
            // Store failed withdrawal
            store_transaction(
                TransactionType::Withdraw,
                "ckTestBTC".to_string(),
                amount,
                caller_principal.to_text(),
                address,
                TransactionStatus::Failed,
                None,
            );
            TextResult::Err(format!("Withdrawal failed: {}", e))
        },
        Err(e) => TextResult::Err(format!("Call failed: {:?}", e)),
    }
}

// ICP Support Functions

#[update]
async fn get_icp_balance() -> Result<Nat, String> {
    if is_local_development() {
        // Return mock balance for local development
        return Ok(Nat::from(1000000000u64)); // 10 ICP
    }

    let account = Account {
        owner: caller(),
        subaccount: None,
    };

    let icp_ledger = get_icp_ledger_canister()?;

    let result: CallResult<(Nat,)> =
        ic_cdk::call(icp_ledger, "icrc1_balance_of", (account,)).await;

    match result {
        Ok((balance,)) => Ok(balance),
        Err(e) => Err(format!("Failed to get ICP balance: {:?}", e)),
    }
}

#[update]
async fn transfer_icp(to_principal: Principal, amount: Nat) -> Result<Nat, String> {
    if is_local_development() {
        // Mock ICP transfer for local development
        store_transaction(
            TransactionType::Send,
            "ICP".to_string(),
            amount.clone(),
            caller().to_text(),
            to_principal.to_text(),
            TransactionStatus::Confirmed,
            Some(Nat::from(1u64)),
        );
        return Ok(Nat::from(1u64));
    }

    let from_principal = caller();
    let to_account = Account {
        owner: to_principal,
        subaccount: None,
    };

    let transfer_args = TransferArgs {
        from_subaccount: None,
        to: to_account,
        amount: amount.clone(),
        fee: None,
        memo: None,
        created_at_time: Some(ic_cdk::api::time()),
    };

    let icp_ledger = get_icp_ledger_canister()?;

    let result: CallResult<(TransferResult,)> =
        ic_cdk::call(icp_ledger, "icrc1_transfer", (transfer_args,)).await;

    match result {
        Ok((Ok(block_index),)) => {
            store_transaction(
                TransactionType::Send,
                "ICP".to_string(),
                amount,
                from_principal.to_text(),
                to_principal.to_text(),
                TransactionStatus::Confirmed,
                Some(block_index.clone()),
            );
            Ok(block_index)
        },
        Ok((Err(e),)) => {
            store_transaction(
                TransactionType::Send,
                "ICP".to_string(),
                amount,
                from_principal.to_text(),
                to_principal.to_text(),
                TransactionStatus::Failed,
                None,
            );
            Err(format!("ICP transfer failed: {:?}", e))
        },
        Err(e) => Err(format!("Call failed: {:?}", e)),
    }
}

#[query]
fn get_icp_address() -> String {
    // ICP address is just the principal
    caller().to_text()
}

// Transaction History Functions

#[query]
fn get_transaction_history() -> Vec<Transaction> {
    TRANSACTIONS.with(|txs| {
        let transactions = txs.borrow();
        // Return last 100 transactions, most recent first
        let result: Vec<Transaction> = transactions.iter()
            .rev()
            .take(100)
            .cloned()
            .collect();
        result
    })
}

#[query]
fn get_transaction(id: u64) -> Option<Transaction> {
    TRANSACTIONS.with(|txs| {
        txs.borrow()
            .iter()
            .find(|tx| tx.id == id)
            .cloned()
    })
}

ic_cdk::export_candid!();
