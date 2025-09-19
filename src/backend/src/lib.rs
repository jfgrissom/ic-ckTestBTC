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

// Stable memory imports
use ic_stable_structures::{
    DefaultMemoryImpl, StableBTreeMap, StableVec, Storable,
};
use std::borrow::Cow;

// Define a specific Result type for string operations
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum TextResult {
    Ok(String),
    Err(String),
}

// Wallet status showing both custodial and personal balances
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct WalletStatus {
    pub custodial_balance: Nat,  // Funds in custody (backend's subaccount)
    pub personal_balance: Nat,   // User's personal funds (not in custody)
    pub total_available: Nat,    // Sum of both balances
    pub can_deposit: bool,       // True if personal_balance > 0
}

// Receipt for deposit operations
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct DepositReceipt {
    pub block_index: Nat,
    pub amount_deposited: Nat,
    pub new_custodial_balance: Nat,
    pub remaining_personal_balance: Nat,
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

// Custodial transaction with virtual balance support
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CustodialTransaction {
    pub id: u64,
    pub tx_type: TransactionType,
    pub from_user: Option<Principal>,
    pub to_user: Option<Principal>,
    pub virtual_amount: Option<u64>,    // Virtual balance change in satoshis
    pub on_chain_amount: Option<Nat>,   // Actual ledger transaction
    pub block_index: Option<Nat>,       // On-chain block reference
    pub status: TransactionStatus,
    pub timestamp: u64,
}

// Reserve status for backend solvency monitoring
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ReserveStatus {
    pub total_virtual_balances: u64,  // Sum of all user virtual balances
    pub backend_actual_balance: u64,  // Actual ckTestBTC held by backend
    pub reserve_ratio: f64,           // actual / virtual (should be >= 1.0)
    pub is_solvent: bool,             // backend_actual >= total_virtual
}

// Wrapper for Principal to implement Storable (orphan rule workaround)
#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct StorablePrincipal(pub Principal);

impl From<Principal> for StorablePrincipal {
    fn from(p: Principal) -> Self {
        StorablePrincipal(p)
    }
}

impl From<StorablePrincipal> for Principal {
    fn from(sp: StorablePrincipal) -> Self {
        sp.0
    }
}

// Stable memory implementations for StorablePrincipal
impl Storable for StorablePrincipal {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Borrowed(self.0.as_slice())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        StorablePrincipal(Principal::from_slice(&bytes))
    }

    const BOUND: ic_stable_structures::storable::Bound = ic_stable_structures::storable::Bound::Bounded {
        max_size: 29,
        is_fixed_size: false,
    };
}

// Stable memory implementations for CustodialTransaction
impl Storable for CustodialTransaction {
    fn to_bytes(&self) -> Cow<[u8]> {
        let bytes = candid::encode_one(self).expect("Failed to encode CustodialTransaction");
        Cow::Owned(bytes)
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).expect("Failed to decode CustodialTransaction")
    }

    const BOUND: ic_stable_structures::storable::Bound = ic_stable_structures::storable::Bound::Bounded {
        max_size: 1024,
        is_fixed_size: false,
    };
}

// Storage for transaction history (legacy thread-local)
thread_local! {
    static TRANSACTIONS: RefCell<Vec<Transaction>> = RefCell::new(Vec::new());
    static TRANSACTION_COUNTER: RefCell<u64> = RefCell::new(0);
}

// Stable memory storage for custodial architecture
thread_local! {
    static MEMORY: RefCell<DefaultMemoryImpl> = RefCell::new(DefaultMemoryImpl::default());

    // User virtual balances (StorablePrincipal -> balance in satoshis)
    static USER_BALANCES: RefCell<StableBTreeMap<StorablePrincipal, u64, DefaultMemoryImpl>> = RefCell::new(
        StableBTreeMap::init(MEMORY.with(|m| m.borrow().clone()))
    );

    // User deposit addresses (StorablePrincipal -> Bitcoin testnet address)
    static USER_DEPOSIT_ADDRESSES: RefCell<StableBTreeMap<StorablePrincipal, String, DefaultMemoryImpl>> = RefCell::new(
        StableBTreeMap::init(MEMORY.with(|m| m.borrow().clone()))
    );

    // Custodial transactions in stable memory
    static STABLE_TRANSACTIONS: RefCell<StableVec<CustodialTransaction, DefaultMemoryImpl>> = RefCell::new(
        StableVec::init(MEMORY.with(|m| m.borrow().clone())).expect("Failed to init stable transactions")
    );

    // Transaction counter for stable transactions
    static STABLE_TRANSACTION_COUNTER: RefCell<u64> = RefCell::new(0);
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

// Generate a deterministic subaccount for a user principal
fn generate_subaccount_for_user(user: Principal) -> Vec<u8> {
    let mut hasher = Sha256::new();
    hasher.update(user.as_slice());
    hasher.update(b"ckTestBTC_custodial_account");
    let hash = hasher.finalize();
    hash[..32].to_vec()
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

    ic_cdk::println!("[GET_BALANCE] Called by principal: {}", caller());
    ic_cdk::println!("[GET_BALANCE] Account: {:?}", account);

    let token_canister = get_token_canister()?;
    ic_cdk::println!("[GET_BALANCE] Token canister: {}", token_canister);

    let result: CallResult<(Nat,)> = ic_cdk::call(token_canister, "icrc1_balance_of", (account,)).await;

    match result {
        Ok((balance,)) => {
            ic_cdk::println!("[GET_BALANCE] Balance returned: {}", balance);
            Ok(balance)
        },
        Err(e) => {
            ic_cdk::println!("[GET_BALANCE] Error: {e:?}");
            Err(format!("Failed to get balance: {e:?}"))
        },
    }
}

// Note: The transfer function has been removed.
// The frontend now calls the ckTestBTC ledger directly for transfers
// to maintain compatibility with the IC mainnet implementation.
// The backend only handles wallet-specific features like transaction history.

// ============================================================
// CUSTODIAL WALLET FUNCTIONS - Virtual Balance Management
// ============================================================

// Helper to store a custodial transaction
fn store_custodial_transaction(
    tx_type: TransactionType,
    from_user: Option<Principal>,
    to_user: Option<Principal>,
    virtual_amount: Option<u64>,
    on_chain_amount: Option<Nat>,
    status: TransactionStatus,
    block_index: Option<Nat>,
) -> u64 {
    STABLE_TRANSACTION_COUNTER.with(|counter| {
        let mut c = counter.borrow_mut();
        *c += 1;
        let id = *c;

        STABLE_TRANSACTIONS.with(|txs| {
            let transaction = CustodialTransaction {
                id,
                tx_type,
                from_user,
                to_user,
                virtual_amount,
                on_chain_amount,
                block_index,
                status,
                timestamp: ic_cdk::api::time(),
            };

            txs.borrow_mut().push(&transaction).expect("Failed to store custodial transaction");
        });

        id
    })
}

#[query]
fn get_virtual_balance() -> u64 {
    let user = StorablePrincipal::from(caller());
    USER_BALANCES.with(|balances| {
        balances.borrow().get(&user).unwrap_or(0)
    })
}

#[query]
fn get_virtual_balance_formatted() -> Nat {
    let balance_satoshis = get_virtual_balance();
    Nat::from(balance_satoshis)
}

// Get comprehensive wallet status showing both custodial and personal balances
#[update]
async fn get_wallet_status() -> Result<WalletStatus, String> {
    let caller_principal = caller();
    let user_subaccount = generate_subaccount_for_user(caller_principal);

    ic_cdk::println!("[WALLET_STATUS] Getting status for principal: {}", caller_principal);

    // Get custodial balance (backend's subaccount for this user)
    let custodial_account = Account {
        owner: ic_cdk::api::id(),  // Backend canister owns this
        subaccount: Some(user_subaccount),
    };

    // Get personal balance (user's own account)
    let personal_account = Account {
        owner: caller_principal,
        subaccount: None,
    };

    let token_canister = get_token_canister()?;

    // Query both balances
    let custodial_result: CallResult<(Nat,)> = ic_cdk::call(
        token_canister.clone(),
        "icrc1_balance_of",
        (custodial_account,)
    ).await;

    let personal_result: CallResult<(Nat,)> = ic_cdk::call(
        token_canister,
        "icrc1_balance_of",
        (personal_account,)
    ).await;

    let custodial_balance = match custodial_result {
        Ok((balance,)) => {
            ic_cdk::println!("[WALLET_STATUS] Custodial balance: {}", balance);
            balance
        },
        Err(e) => {
            ic_cdk::println!("[WALLET_STATUS] Error getting custodial balance: {:?}", e);
            Nat::from(0u64)
        }
    };

    let personal_balance = match personal_result {
        Ok((balance,)) => {
            ic_cdk::println!("[WALLET_STATUS] Personal balance: {}", balance);
            balance
        },
        Err(e) => {
            ic_cdk::println!("[WALLET_STATUS] Error getting personal balance: {:?}", e);
            Nat::from(0u64)
        }
    };

    let total = custodial_balance.clone() + personal_balance.clone();
    let can_deposit = personal_balance.clone() > Nat::from(0u64);

    Ok(WalletStatus {
        custodial_balance,
        personal_balance,
        total_available: total,
        can_deposit,
    })
}

// Deposit user's personal funds into custody (backend's subaccount)
#[update]
async fn deposit_to_custody(amount: Nat) -> Result<DepositReceipt, String> {
    let caller_principal = caller();
    let user_subaccount = generate_subaccount_for_user(caller_principal);

    ic_cdk::println!("[DEPOSIT_TO_CUSTODY] User {} depositing {} to custody", caller_principal, amount);

    // First check user has sufficient personal balance
    let personal_account = Account {
        owner: caller_principal,
        subaccount: None,
    };

    let token_canister = get_token_canister()?;

    // Check personal balance
    let balance_result: CallResult<(Nat,)> = ic_cdk::call(
        token_canister.clone(),
        "icrc1_balance_of",
        (personal_account.clone(),)
    ).await;

    let personal_balance = match balance_result {
        Ok((balance,)) => balance,
        Err(e) => return Err(format!("Failed to check balance: {:?}", e)),
    };

    // Check if user has enough balance (amount + fee)
    let fee = Nat::from(10u64);
    let total_needed = amount.clone() + fee.clone();
    if personal_balance < total_needed {
        return Err(format!(
            "Insufficient personal balance. Balance: {} satoshis, Needed: {} satoshis (including 10 satoshi fee)",
            personal_balance, total_needed
        ));
    }

    // Transfer from user's personal account to backend's custodial subaccount
    let custodial_account = Account {
        owner: ic_cdk::api::id(),  // Backend canister
        subaccount: Some(user_subaccount),  // User-specific subaccount
    };

    let transfer_args = TransferArgs {
        from_subaccount: None,  // User's default account
        to: custodial_account.clone(),
        amount: amount.clone(),
        fee: Some(fee),
        memo: None,
        created_at_time: Some(ic_cdk::api::time()),
    };

    // Use icrc2_transfer_from for transferring on behalf of user
    // Note: This requires prior approval from the user
    let transfer_result: CallResult<(Result<Nat, TransferError>,)> = ic_cdk::call(
        token_canister.clone(),
        "icrc1_transfer",
        (transfer_args,)
    ).await;

    let block_index = match transfer_result {
        Ok((Ok(index),)) => {
            ic_cdk::println!("[DEPOSIT_TO_CUSTODY] Transfer successful, block: {}", index);
            index
        },
        Ok((Err(e),)) => {
            ic_cdk::println!("[DEPOSIT_TO_CUSTODY] Transfer error: {:?}", e);
            return Err(format!("Transfer failed: {:?}", e));
        },
        Err(e) => {
            ic_cdk::println!("[DEPOSIT_TO_CUSTODY] Call error: {:?}", e);
            return Err(format!("Failed to call transfer: {:?}", e));
        }
    };

    // Get updated balances
    let custodial_balance_result: CallResult<(Nat,)> = ic_cdk::call(
        token_canister.clone(),
        "icrc1_balance_of",
        (custodial_account,)
    ).await;

    let personal_balance_result: CallResult<(Nat,)> = ic_cdk::call(
        token_canister,
        "icrc1_balance_of",
        (personal_account,)
    ).await;

    let new_custodial_balance = match custodial_balance_result {
        Ok((balance,)) => balance,
        Err(_) => Nat::from(0u64),
    };

    let remaining_personal_balance = match personal_balance_result {
        Ok((balance,)) => balance,
        Err(_) => Nat::from(0u64),
    };

    // Store transaction record
    store_transaction(
        TransactionType::Deposit,
        "ckTestBTC".to_string(),
        amount.clone(),
        caller_principal.to_text(),
        "Custodial Wallet".to_string(),
        TransactionStatus::Confirmed,
        Some(block_index.clone()),
    );

    Ok(DepositReceipt {
        block_index,
        amount_deposited: amount,
        new_custodial_balance,
        remaining_personal_balance,
    })
}

#[update]
async fn deposit_funds(amount: Nat) -> Result<Nat, String> {
    // Deprecated - use deposit_to_custody instead
    // Keeping for backward compatibility
    let user = caller();
    let storable_user = StorablePrincipal::from(user);
    let amount_satoshis = amount.0.to_u64_digits();

    if amount_satoshis.len() != 1 {
        return Err("Invalid amount format".to_string());
    }

    let amount_u64 = amount_satoshis[0];

    ic_cdk::println!("[DEPOSIT] DEPRECATED - Use deposit_to_custody instead");

    // First, transfer tokens FROM user TO backend canister
    let backend_canister = ic_cdk::api::id();
    let transfer_args = TransferArgs {
        from_subaccount: None,
        to: Account {
            owner: backend_canister,
            subaccount: None,
        },
        amount: amount.clone(),
        fee: Some(Nat::from(10u64)), // 10 satoshi fee
        memo: None,
        created_at_time: Some(ic_cdk::api::time()),
    };

    let token_canister = get_token_canister()?;

    // Perform the on-chain transfer
    let result: CallResult<(Result<Nat, TransferError>,)> = ic_cdk::call(
        token_canister,
        "icrc1_transfer",
        (transfer_args,)
    ).await;

    match result {
        Ok((Ok(block_index),)) => {
            ic_cdk::println!("[DEPOSIT] On-chain transfer successful, block: {}", block_index);

            // Update user's virtual balance
            USER_BALANCES.with(|balances| {
                let mut balances_map = balances.borrow_mut();
                let current_balance = balances_map.get(&storable_user).unwrap_or(0);
                let new_balance = current_balance + amount_u64;
                balances_map.insert(storable_user, new_balance);

                ic_cdk::println!("[DEPOSIT] Virtual balance updated: {} -> {}", current_balance, new_balance);
            });

            // Store the deposit transaction
            store_custodial_transaction(
                TransactionType::Deposit,
                Some(user),
                None, // Backend doesn't have a user representation
                Some(amount_u64),
                Some(amount.clone()),
                TransactionStatus::Confirmed,
                Some(block_index.clone()),
            );

            Ok(block_index)
        }
        Ok((Err(transfer_error),)) => {
            ic_cdk::println!("[DEPOSIT] Transfer failed: {:?}", transfer_error);

            // Store failed transaction
            store_custodial_transaction(
                TransactionType::Deposit,
                Some(user),
                None,
                Some(amount_u64),
                Some(amount),
                TransactionStatus::Failed,
                None,
            );

            Err(format!("Deposit transfer failed: {:?}", transfer_error))
        }
        Err(e) => {
            ic_cdk::println!("[DEPOSIT] Call failed: {:?}", e);
            Err(format!("Deposit call failed: {:?}", e))
        }
    }
}

#[update]
async fn withdraw_funds(amount: Nat) -> Result<Nat, String> {
    let user = caller();
    let amount_satoshis = amount.0.to_u64_digits();

    if amount_satoshis.len() != 1 {
        return Err("Invalid amount format".to_string());
    }

    let amount_u64 = amount_satoshis[0];

    ic_cdk::println!("[WITHDRAW] User {} withdrawing {} satoshis", user, amount_u64);

    // Check user's virtual balance
    let storable_user = StorablePrincipal::from(user);
    let current_balance = USER_BALANCES.with(|balances| {
        balances.borrow().get(&storable_user).unwrap_or(0)
    });

    if current_balance < amount_u64 {
        store_custodial_transaction(
            TransactionType::Withdraw,
            None,
            Some(user),
            Some(amount_u64),
            Some(amount),
            TransactionStatus::Failed,
            None,
        );

        return Err(format!("Insufficient virtual balance. Available: {}, Requested: {}", current_balance, amount_u64));
    }

    // Transfer tokens FROM backend canister TO user
    let transfer_args = TransferArgs {
        from_subaccount: None,
        to: Account {
            owner: user,
            subaccount: None,
        },
        amount: amount.clone(),
        fee: Some(Nat::from(10u64)), // 10 satoshi fee
        memo: None,
        created_at_time: Some(ic_cdk::api::time()),
    };

    let token_canister = get_token_canister()?;

    // Perform the on-chain transfer
    let result: CallResult<(Result<Nat, TransferError>,)> = ic_cdk::call(
        token_canister,
        "icrc1_transfer",
        (transfer_args,)
    ).await;

    match result {
        Ok((Ok(block_index),)) => {
            ic_cdk::println!("[WITHDRAW] On-chain transfer successful, block: {}", block_index);

            // Update user's virtual balance
            USER_BALANCES.with(|balances| {
                let mut balances_map = balances.borrow_mut();
                let new_balance = current_balance - amount_u64;
                balances_map.insert(storable_user, new_balance);

                ic_cdk::println!("[WITHDRAW] Virtual balance updated: {} -> {}", current_balance, new_balance);
            });

            // Store the withdrawal transaction
            store_custodial_transaction(
                TransactionType::Withdraw,
                None,
                Some(user),
                Some(amount_u64),
                Some(amount.clone()),
                TransactionStatus::Confirmed,
                Some(block_index.clone()),
            );

            Ok(block_index)
        }
        Ok((Err(transfer_error),)) => {
            ic_cdk::println!("[WITHDRAW] Transfer failed: {:?}", transfer_error);

            // Store failed transaction
            store_custodial_transaction(
                TransactionType::Withdraw,
                None,
                Some(user),
                Some(amount_u64),
                Some(amount),
                TransactionStatus::Failed,
                None,
            );

            Err(format!("Withdrawal transfer failed: {:?}", transfer_error))
        }
        Err(e) => {
            ic_cdk::println!("[WITHDRAW] Call failed: {:?}", e);
            Err(format!("Withdrawal call failed: {:?}", e))
        }
    }
}

#[update]
async fn virtual_transfer(to_user: Principal, amount: Nat) -> Result<u64, String> {
    let from_user = caller();
    let amount_satoshis = amount.0.to_u64_digits();

    if amount_satoshis.len() != 1 {
        return Err("Invalid amount format".to_string());
    }

    let amount_u64 = amount_satoshis[0];

    ic_cdk::println!("[VIRTUAL_TRANSFER] DEBUG: from_user={}, to_user={}", from_user, to_user);
    ic_cdk::println!("[VIRTUAL_TRANSFER] DEBUG: from_user.to_text()={}, to_user.to_text()={}", from_user.to_text(), to_user.to_text());
    ic_cdk::println!("[VIRTUAL_TRANSFER] DEBUG: principals equal? {}", from_user == to_user);

    if from_user == to_user {
        return Err(format!("Cannot transfer to yourself: {} -> {}", from_user.to_text(), to_user.to_text()));
    }

    ic_cdk::println!("[VIRTUAL_TRANSFER] {} -> {}: {} satoshis", from_user, to_user, amount_u64);

    // Update both users' virtual balances atomically
    let storable_from_user = StorablePrincipal::from(from_user);
    let storable_to_user = StorablePrincipal::from(to_user);

    let result = USER_BALANCES.with(|balances| {
        let mut balances_map = balances.borrow_mut();

        let from_balance = balances_map.get(&storable_from_user).unwrap_or(0);
        let to_balance = balances_map.get(&storable_to_user).unwrap_or(0);

        if from_balance < amount_u64 {
            return Err(format!("Insufficient virtual balance. Available: {}, Requested: {}", from_balance, amount_u64));
        }

        // Perform the transfer
        let new_from_balance = from_balance - amount_u64;
        let new_to_balance = to_balance + amount_u64;

        balances_map.insert(storable_from_user, new_from_balance);
        balances_map.insert(storable_to_user, new_to_balance);

        ic_cdk::println!("[VIRTUAL_TRANSFER] Balances updated - From: {} -> {}, To: {} -> {}",
            from_balance, new_from_balance, to_balance, new_to_balance);

        Ok(())
    });

    match result {
        Ok(()) => {
            // Store the virtual transfer transaction
            let tx_id = store_custodial_transaction(
                TransactionType::Send, // Virtual transfer is recorded as Send
                Some(from_user),
                Some(to_user),
                Some(amount_u64),
                None, // No on-chain transaction
                TransactionStatus::Confirmed,
                None, // No block index for virtual transfers
            );

            Ok(tx_id)
        }
        Err(e) => {
            // Store failed transaction
            store_custodial_transaction(
                TransactionType::Send,
                Some(from_user),
                Some(to_user),
                Some(amount_u64),
                None,
                TransactionStatus::Failed,
                None,
            );

            Err(e)
        }
    }
}

#[query]
fn get_backend_total_balance() -> Result<Nat, String> {
    // This would query the backend canister's own balance on the ckTestBTC ledger
    // For now, return placeholder - would need async implementation
    Ok(Nat::from(0u64))
}

#[query]
fn get_reserve_status() -> ReserveStatus {
    let total_virtual = USER_BALANCES.with(|balances| {
        balances.borrow().iter().map(|(_, balance)| balance).sum::<u64>()
    });

    // For now, using placeholder values - would need to query actual backend balance
    let backend_actual = 0u64; // Placeholder
    let reserve_ratio = if total_virtual > 0 {
        backend_actual as f64 / total_virtual as f64
    } else {
        1.0
    };

    ReserveStatus {
        total_virtual_balances: total_virtual,
        backend_actual_balance: backend_actual,
        reserve_ratio,
        is_solvent: backend_actual >= total_virtual,
    }
}

#[query]
fn get_custodial_transaction_history() -> Vec<CustodialTransaction> {
    STABLE_TRANSACTIONS.with(|txs| {
        let transactions = txs.borrow();
        let mut result = Vec::new();

        // Get the last 100 transactions
        let start_idx = if transactions.len() > 100 {
            transactions.len() - 100
        } else {
            0
        };

        for i in start_idx..transactions.len() {
            if let Some(tx) = transactions.get(i as u64) {
                result.push(tx);
            }
        }

        // Return in reverse order (most recent first)
        result.reverse();
        result
    })
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

    // Use the custodial subaccount to ensure unique addresses per user
    let user_subaccount = generate_subaccount_for_user(caller_principal);
    let args = GetBtcAddressArgs {
        owner: Some(caller_principal),
        subaccount: Some(user_subaccount),
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
        fee: Some(Nat::from(10000u64)), // ICP fee is typically 10000 e8s (0.0001 ICP)
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

// Transfer ckTestBTC tokens
#[update]
async fn transfer(to_principal: Principal, amount: Nat) -> Result<Nat, String> {
    let from_principal = caller();

    ic_cdk::println!("[TRANSFER] Called by principal: {}", from_principal);
    ic_cdk::println!("[TRANSFER] Transferring {} to {}", amount, to_principal);

    // Create transfer arguments with proper user principal
    let transfer_args = TransferArgs {
        from_subaccount: None,
        to: Account {
            owner: to_principal,
            subaccount: None,
        },
        amount: amount.clone(),
        fee: Some(Nat::from(10u64)), // 10 satoshi fee
        memo: None,
        created_at_time: Some(ic_cdk::api::time()),
    };

    let token_canister = get_token_canister()?;
    ic_cdk::println!("[TRANSFER] Token canister: {}", token_canister);

    // Create the from account using the caller's principal (not the canister's)
    let from_account = Account {
        owner: from_principal,
        subaccount: None,
    };

    // First check the balance
    let balance_result: CallResult<(Nat,)> = ic_cdk::call(
        token_canister.clone(),
        "icrc1_balance_of",
        (from_account.clone(),)
    ).await;

    match balance_result {
        Ok((balance,)) => {
            ic_cdk::println!("[TRANSFER] User balance: {}", balance);

            // Check if user has sufficient balance (amount + fee)
            let required = amount.clone() + Nat::from(10u64);
            if balance < required {
                store_transaction(
                    TransactionType::Send,
                    "ckTestBTC".to_string(),
                    amount.clone(),
                    from_principal.to_text(),
                    to_principal.to_text(),
                    TransactionStatus::Failed,
                    None,
                );
                return Err(format!("Insufficient balance. Required: {}, Available: {}", required, balance));
            }
        }
        Err(e) => {
            return Err(format!("Failed to check balance: {:?}", e));
        }
    }

    // Now perform the transfer using icrc1_transfer
    // This will use the caller's principal for the transfer
    let result: CallResult<(Result<Nat, TransferError>,)> = ic_cdk::call(
        token_canister,
        "icrc1_transfer",
        (transfer_args,)
    ).await;

    match result {
        Ok((Ok(block_index),)) => {
            ic_cdk::println!("[TRANSFER] Transfer successful, block index: {}", block_index);

            // Store successful transaction
            store_transaction(
                TransactionType::Send,
                "ckTestBTC".to_string(),
                amount.clone(),
                from_principal.to_text(),
                to_principal.to_text(),
                TransactionStatus::Confirmed,
                Some(block_index.clone()),
            );

            // Also store the receive transaction for the recipient
            store_transaction(
                TransactionType::Receive,
                "ckTestBTC".to_string(),
                amount,
                from_principal.to_text(),
                to_principal.to_text(),
                TransactionStatus::Confirmed,
                Some(block_index.clone()),
            );

            Ok(block_index)
        }
        Ok((Err(err),)) => {
            let error_msg = format_transfer_error(&err);
            ic_cdk::println!("[TRANSFER] Transfer failed: {}", error_msg);

            // Store failed transaction
            store_transaction(
                TransactionType::Send,
                "ckTestBTC".to_string(),
                amount.clone(),
                from_principal.to_text(),
                to_principal.to_text(),
                TransactionStatus::Failed,
                None,
            );

            Err(error_msg)
        }
        Err(e) => {
            ic_cdk::println!("[TRANSFER] Call failed: {:?}", e);

            store_transaction(
                TransactionType::Send,
                "ckTestBTC".to_string(),
                amount,
                from_principal.to_text(),
                to_principal.to_text(),
                TransactionStatus::Failed,
                None,
            );

            Err(format!("Call failed: {:?}", e))
        }
    }
}

// Helper function to format transfer errors
fn format_transfer_error(error: &TransferError) -> String {
    match error {
        TransferError::BadFee { expected_fee } => {
            format!("Bad fee. Expected: {} satoshis", expected_fee)
        }
        TransferError::InsufficientFunds { balance } => {
            format!("Insufficient funds. Balance: {} satoshis", balance)
        }
        TransferError::TooOld => "Transaction too old".to_string(),
        TransferError::CreatedInFuture { ledger_time } => {
            format!("Transaction created in future. Ledger time: {}", ledger_time)
        }
        TransferError::Duplicate { duplicate_of } => {
            format!("Duplicate transaction. Original block: {}", duplicate_of)
        }
        TransferError::TemporarilyUnavailable => "Service temporarily unavailable".to_string(),
        TransferError::GenericError { error_code, message } => {
            format!("Error {}: {}", error_code, message)
        }
        TransferError::BadBurn { min_burn_amount } => {
            format!("Bad burn amount. Minimum: {} satoshis", min_burn_amount)
        }
    }
}

ic_cdk::export_candid!();
