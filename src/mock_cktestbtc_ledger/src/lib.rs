// WARNING: BITCOIN TESTNET4 (TestBTC) ONLY - NO MAINNET BITCOIN
// This canister handles only ckTestBTC tokens representing Bitcoin testnet4 (TestBTC).
// It implements ICRC-1/2 standards for ckTestBTC token operations.
// NEVER processes mainnet Bitcoin (BTC) tokens.

use candid::{CandidType, Deserialize, Nat, Principal};
use ic_cdk_macros::{init, query, update};
use serde::Serialize;
use std::cell::RefCell;
use std::collections::HashMap;

pub type BlockIndex = Nat;
pub type Subaccount = Vec<u8>;
pub type Timestamp = u64;
pub type Tokens = Nat;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq, Hash)]
pub struct Account {
    pub owner: Principal,
    pub subaccount: Option<Subaccount>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct Allowance {
    pub allowance: Nat,
    pub expires_at: Option<Timestamp>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct AllowanceArgs {
    pub account: Account,
    pub spender: Account,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ApproveArgs {
    pub fee: Option<Nat>,
    pub memo: Option<Vec<u8>>,
    pub from_subaccount: Option<Vec<u8>>,
    pub created_at_time: Option<Timestamp>,
    pub amount: Nat,
    pub expected_allowance: Option<Nat>,
    pub expires_at: Option<Timestamp>,
    pub spender: Account,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum ApproveError {
    GenericError { message: String, error_code: Nat },
    TemporarilyUnavailable,
    Duplicate { duplicate_of: BlockIndex },
    BadFee { expected_fee: Nat },
    AllowanceChanged { current_allowance: Nat },
    CreatedInFuture { ledger_time: Timestamp },
    TooOld,
    Expired { ledger_time: Timestamp },
    InsufficientFunds { balance: Nat },
}

pub type ApproveResult = Result<BlockIndex, ApproveError>;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct TransferArg {
    pub from_subaccount: Option<Subaccount>,
    pub to: Account,
    pub amount: Tokens,
    pub fee: Option<Tokens>,
    pub memo: Option<Vec<u8>>,
    pub created_at_time: Option<Timestamp>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum TransferError {
    BadFee { expected_fee: Tokens },
    BadBurn { min_burn_amount: Tokens },
    InsufficientFunds { balance: Tokens },
    TooOld,
    CreatedInFuture { ledger_time: Timestamp },
    TemporarilyUnavailable,
    Duplicate { duplicate_of: BlockIndex },
    GenericError { error_code: Nat, message: String },
}

pub type TransferResult = Result<BlockIndex, TransferError>;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct TransferFromArgs {
    pub spender_subaccount: Option<Vec<u8>>,
    pub from: Account,
    pub to: Account,
    pub amount: Nat,
    pub fee: Option<Nat>,
    pub memo: Option<Vec<u8>>,
    pub created_at_time: Option<u64>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum TransferFromError {
    BadFee { expected_fee: Nat },
    BadBurn { min_burn_amount: Nat },
    InsufficientFunds { balance: Nat },
    InsufficientAllowance { allowance: Nat },
    TooOld,
    CreatedInFuture { ledger_time: u64 },
    Duplicate { duplicate_of: Nat },
    TemporarilyUnavailable,
    GenericError { error_code: Nat, message: String },
}

pub type TransferFromResult = Result<Nat, TransferFromError>;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum MetadataValue {
    Nat(Nat),
    Int(i64),
    Text(String),
    Blob(Vec<u8>),
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct StandardRecord {
    pub name: String,
    pub url: String,
}

// Storage
thread_local! {
    static BALANCES: RefCell<HashMap<Account, Nat>> = RefCell::new(HashMap::new());
    static ALLOWANCES: RefCell<HashMap<(Account, Account), Allowance>> = RefCell::new(HashMap::new());
    static TOTAL_SUPPLY: RefCell<Nat> = RefCell::new(Nat::from(0u64));
    static BLOCK_INDEX: RefCell<Nat> = RefCell::new(Nat::from(0u64));
}

const TRANSFER_FEE: u64 = 10; // 0.00000010 ckTestBTC
const DECIMALS: u8 = 8;

#[init]
fn init() {
    // Initialize with some test balances for development
    BALANCES.with(|b| {
        let mut balances = b.borrow_mut();
        balances.clear();
    });
}

// ICRC-1 Standard Methods

#[query]
fn icrc1_name() -> String {
    "ckTestBTC".to_string()
}

#[query]
fn icrc1_symbol() -> String {
    "ckTestBTC".to_string()
}

#[query]
fn icrc1_decimals() -> u8 {
    DECIMALS
}

#[query]
fn icrc1_metadata() -> Vec<(String, MetadataValue)> {
    vec![
        ("icrc1:name".to_string(), MetadataValue::Text("ckTestBTC".to_string())),
        ("icrc1:symbol".to_string(), MetadataValue::Text("ckTestBTC".to_string())),
        ("icrc1:decimals".to_string(), MetadataValue::Nat(Nat::from(DECIMALS))),
        ("icrc1:fee".to_string(), MetadataValue::Nat(Nat::from(TRANSFER_FEE))),
    ]
}

#[query]
fn icrc1_total_supply() -> Tokens {
    TOTAL_SUPPLY.with(|ts| ts.borrow().clone())
}

#[query]
fn icrc1_fee() -> Tokens {
    Nat::from(TRANSFER_FEE)
}

#[query]
fn icrc1_minting_account() -> Option<Account> {
    // Return minter canister as minting account
    Some(Account {
        owner: Principal::from_text("ml52i-qqaaa-aaaar-qaaba-cai").unwrap(),
        subaccount: None,
    })
}

#[query]
fn icrc1_balance_of(account: Account) -> Tokens {
    BALANCES.with(|b| {
        b.borrow()
            .get(&account)
            .cloned()
            .unwrap_or_else(|| Nat::from(0u64))
    })
}

#[update]
fn icrc1_transfer(args: TransferArg) -> TransferResult {
    let caller = ic_cdk::caller();
    let from_account = Account {
        owner: caller,
        subaccount: args.from_subaccount.clone(),
    };

    // Check fee
    let fee = args.fee.unwrap_or_else(|| Nat::from(TRANSFER_FEE));
    if fee != Nat::from(TRANSFER_FEE) {
        return Err(TransferError::BadFee {
            expected_fee: Nat::from(TRANSFER_FEE),
        });
    }

    // Get sender's balance
    let sender_balance = BALANCES.with(|b| {
        b.borrow()
            .get(&from_account)
            .cloned()
            .unwrap_or_else(|| Nat::from(0u64))
    });

    let total_amount = args.amount.clone() + fee.clone();

    // Check sufficient funds
    if sender_balance < total_amount {
        return Err(TransferError::InsufficientFunds {
            balance: sender_balance,
        });
    }

    // Perform transfer
    BALANCES.with(|b| {
        let mut balances = b.borrow_mut();

        // Deduct from sender (amount + fee)
        let new_sender_balance = sender_balance - total_amount;
        if new_sender_balance == Nat::from(0u64) {
            balances.remove(&from_account);
        } else {
            balances.insert(from_account, new_sender_balance);
        }

        // Add to receiver (only the amount, fee is burned)
        let receiver_balance = balances
            .get(&args.to)
            .cloned()
            .unwrap_or_else(|| Nat::from(0u64));
        balances.insert(args.to, receiver_balance + args.amount);
    });

    // Return block index and increment
    BLOCK_INDEX.with(|bi| {
        let mut block_index = bi.borrow_mut();
        let current_index = block_index.clone();
        *block_index = current_index.clone() + Nat::from(1u64);
        Ok(current_index)
    })
}

#[query]
fn icrc1_supported_standards() -> Vec<StandardRecord> {
    vec![
        StandardRecord {
            name: "ICRC-1".to_string(),
            url: "https://github.com/dfinity/ICRC-1".to_string(),
        },
        StandardRecord {
            name: "ICRC-2".to_string(),
            url: "https://github.com/dfinity/ICRC-1/tree/main/standards/ICRC-2".to_string(),
        },
    ]
}

// ICRC-2 Standard Methods

#[update]
fn icrc2_approve(args: ApproveArgs) -> ApproveResult {
    let caller = ic_cdk::caller();
    let from_account = Account {
        owner: caller,
        subaccount: args.from_subaccount.clone(),
    };

    // Check fee
    let fee = args.fee.unwrap_or_else(|| Nat::from(TRANSFER_FEE));
    if fee != Nat::from(TRANSFER_FEE) {
        return Err(ApproveError::BadFee {
            expected_fee: Nat::from(TRANSFER_FEE),
        });
    }

    // Get and check balance
    let balance = BALANCES.with(|b| {
        b.borrow()
            .get(&from_account)
            .cloned()
            .unwrap_or_else(|| Nat::from(0u64))
    });

    if balance < fee {
        return Err(ApproveError::InsufficientFunds { balance });
    }

    // Set allowance
    ALLOWANCES.with(|a| {
        let mut allowances = a.borrow_mut();
        allowances.insert(
            (from_account.clone(), args.spender.clone()),
            Allowance {
                allowance: args.amount,
                expires_at: args.expires_at,
            },
        );
    });

    // Deduct fee
    BALANCES.with(|b| {
        let mut balances = b.borrow_mut();
        let new_balance = balance - fee;
        if new_balance == Nat::from(0u64) {
            balances.remove(&from_account);
        } else {
            balances.insert(from_account, new_balance);
        }
    });

    // Return block index and increment
    BLOCK_INDEX.with(|bi| {
        let mut block_index = bi.borrow_mut();
        let current_index = block_index.clone();
        *block_index = current_index.clone() + Nat::from(1u64);
        Ok(current_index)
    })
}

#[query]
fn icrc2_allowance(args: AllowanceArgs) -> Allowance {
    ALLOWANCES.with(|a| {
        a.borrow()
            .get(&(args.account, args.spender))
            .cloned()
            .unwrap_or(Allowance {
                allowance: Nat::from(0u64),
                expires_at: None,
            })
    })
}

#[update]
fn icrc2_transfer_from(args: TransferFromArgs) -> TransferFromResult {
    let caller = ic_cdk::caller();
    let spender_account = Account {
        owner: caller,
        subaccount: args.spender_subaccount.clone(),
    };

    // Check allowance
    let allowance = ALLOWANCES.with(|a| {
        a.borrow()
            .get(&(args.from.clone(), spender_account.clone()))
            .cloned()
            .unwrap_or(Allowance {
                allowance: Nat::from(0u64),
                expires_at: None,
            })
    });

    let fee = args.fee.unwrap_or_else(|| Nat::from(TRANSFER_FEE));
    let total_amount = args.amount.clone() + fee.clone();

    if allowance.allowance < total_amount {
        return Err(TransferFromError::InsufficientAllowance {
            allowance: allowance.allowance,
        });
    }

    // Check from account balance
    let from_balance = BALANCES.with(|b| {
        b.borrow()
            .get(&args.from)
            .cloned()
            .unwrap_or_else(|| Nat::from(0u64))
    });

    if from_balance < total_amount {
        return Err(TransferFromError::InsufficientFunds {
            balance: from_balance,
        });
    }

    // Perform transfer
    BALANCES.with(|b| {
        let mut balances = b.borrow_mut();

        // Deduct from sender
        let new_from_balance = from_balance - total_amount.clone();
        if new_from_balance == Nat::from(0u64) {
            balances.remove(&args.from);
        } else {
            balances.insert(args.from.clone(), new_from_balance);
        }

        // Add to receiver
        let to_balance = balances
            .get(&args.to)
            .cloned()
            .unwrap_or_else(|| Nat::from(0u64));
        balances.insert(args.to, to_balance + args.amount);
    });

    // Update allowance
    ALLOWANCES.with(|a| {
        let mut allowances = a.borrow_mut();
        let new_allowance = allowance.allowance - total_amount;
        if new_allowance == Nat::from(0u64) {
            allowances.remove(&(args.from, spender_account));
        } else {
            allowances.insert(
                (args.from, spender_account),
                Allowance {
                    allowance: new_allowance,
                    expires_at: allowance.expires_at,
                },
            );
        }
    });

    // Return block index and increment
    BLOCK_INDEX.with(|bi| {
        let mut block_index = bi.borrow_mut();
        let current_index = block_index.clone();
        *block_index = current_index.clone() + Nat::from(1u64);
        Ok(current_index)
    })
}

// Helper function for testing - mint tokens
#[update]
pub fn mint(to: Account, amount: Nat) -> TransferResult {
    // For local development, allow minting from backend and mock minter canisters
    let caller = ic_cdk::caller();

    // Get the minter canister ID from environment or use the mock minter ID
    let mock_minter_id = env!("LOCAL_MOCK_MINTER_CANISTER_ID");
    let minter_principal = if !mock_minter_id.is_empty() {
        Principal::from_text(mock_minter_id).unwrap_or_else(|_| {
            // Fallback to the deployed mock minter canister ID
            Principal::from_text("ulvla-h7777-77774-qaacq-cai").unwrap()
        })
    } else {
        // Default to the mock minter canister ID we deployed
        Principal::from_text("ulvla-h7777-77774-qaacq-cai").unwrap()
    };

    // Also allow the backend canister to mint for testing
    let backend_id = env!("CANISTER_ID_BACKEND");
    let backend_principal = if !backend_id.is_empty() {
        Principal::from_text(backend_id).ok()
    } else {
        Principal::from_text("uxrrr-q7777-77774-qaaaq-cai").ok()
    };

    // Check if caller is authorized to mint
    let is_authorized = caller == minter_principal ||
                       backend_principal.map_or(false, |p| p == caller);

    if !is_authorized {
        ic_cdk::println!(
            "[MOCK_LEDGER] Mint denied: caller {} is not authorized (expected minter: {} or backend: {:?})",
            caller, minter_principal, backend_principal
        );
        return Err(TransferError::GenericError {
            error_code: Nat::from(1u64),
            message: format!("Only authorized minters can mint tokens. Caller: {}", caller),
        });
    }

    ic_cdk::println!(
        "[MOCK_LEDGER] Minting {} tokens to account {} (authorized by {})",
        amount, to.owner, caller
    );

    BALANCES.with(|b| {
        let mut balances = b.borrow_mut();
        let current_balance = balances
            .get(&to)
            .cloned()
            .unwrap_or_else(|| Nat::from(0u64));
        balances.insert(to, current_balance + amount.clone());
    });

    // Update total supply
    TOTAL_SUPPLY.with(|ts| {
        let mut total_supply = ts.borrow_mut();
        *total_supply = total_supply.clone() + amount;
    });

    // Return block index and increment
    BLOCK_INDEX.with(|bi| {
        let mut block_index = bi.borrow_mut();
        let current_index = block_index.clone();
        *block_index = current_index.clone() + Nat::from(1u64);
        Ok(current_index)
    })
}

ic_cdk::export_candid!();