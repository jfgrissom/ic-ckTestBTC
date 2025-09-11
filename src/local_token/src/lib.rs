use candid::{CandidType, Deserialize, Nat, Principal};
use ic_cdk_macros::{init, query, update};
use std::cell::RefCell;
use std::collections::HashMap;

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct Account {
    pub owner: Principal,
    pub subaccount: Option<Vec<u8>>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct TransferArgs {
    pub from_subaccount: Option<Vec<u8>>,
    pub to: Account,
    pub amount: Nat,
    pub fee: Option<Nat>,
    pub memo: Option<Vec<u8>>,
    pub created_at_time: Option<u64>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
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

thread_local! {
    static BALANCES: RefCell<HashMap<Principal, Nat>> = RefCell::new(HashMap::new());
    static TRANSACTION_COUNTER: RefCell<Nat> = RefCell::new(Nat::from(0u64));
}

#[init]
fn init() {
    // Initialize with some test balances
    BALANCES.with(|b| {
        let mut balances = b.borrow_mut();
        // You can add initial balances here if needed
        balances.clear();
    });
}

#[query]
fn icrc1_name() -> String {
    "Local Test Bitcoin".to_string()
}

#[query]
fn icrc1_symbol() -> String {
    "ckTestBTC".to_string()
}

#[query]
fn icrc1_decimals() -> u8 {
    8
}

#[query]
fn icrc1_balance_of(account: Account) -> Nat {
    BALANCES.with(|b| {
        b.borrow()
            .get(&account.owner)
            .cloned()
            .unwrap_or_else(|| Nat::from(0u64))
    })
}

#[update]
fn icrc1_transfer(args: TransferArgs) -> TransferResult {
    let caller = ic_cdk::caller();
    
    // Get sender's balance
    let sender_balance = BALANCES.with(|b| {
        b.borrow()
            .get(&caller)
            .cloned()
            .unwrap_or_else(|| Nat::from(0u64))
    });
    
    // Check sufficient funds
    if sender_balance < args.amount {
        return Err(TransferError::InsufficientFunds {
            balance: sender_balance,
        });
    }
    
    // Perform transfer
    BALANCES.with(|b| {
        let mut balances = b.borrow_mut();
        
        // Deduct from sender
        let new_sender_balance = sender_balance - args.amount.clone();
        if new_sender_balance == Nat::from(0u64) {
            balances.remove(&caller);
        } else {
            balances.insert(caller, new_sender_balance);
        }
        
        // Add to receiver
        let receiver_balance = balances
            .get(&args.to.owner)
            .cloned()
            .unwrap_or_else(|| Nat::from(0u64));
        balances.insert(args.to.owner, receiver_balance + args.amount);
    });
    
    // Increment and return transaction ID
    TRANSACTION_COUNTER.with(|c| {
        let mut counter = c.borrow_mut();
        *counter = counter.clone() + Nat::from(1u64);
        Ok(counter.clone())
    })
}

#[update]
fn mint(account: Account, amount: Nat) -> TransferResult {
    // Simple mint function for testing - adds tokens to an account
    BALANCES.with(|b| {
        let mut balances = b.borrow_mut();
        let current_balance = balances
            .get(&account.owner)
            .cloned()
            .unwrap_or_else(|| Nat::from(0u64));
        balances.insert(account.owner, current_balance + amount);
    });
    
    // Increment and return transaction ID
    TRANSACTION_COUNTER.with(|c| {
        let mut counter = c.borrow_mut();
        *counter = counter.clone() + Nat::from(1u64);
        Ok(counter.clone())
    })
}

ic_cdk::export_candid!();