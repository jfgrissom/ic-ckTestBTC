// WARNING: BITCOIN TESTNET4 (TestBTC) ONLY - NO MAINNET BITCOIN
// This canister handles only Bitcoin testnet4 (TestBTC) operations.
// It provides mock functionality for ckTestBTC minter operations.
// NEVER processes mainnet Bitcoin (BTC) transactions.

use candid::{CandidType, Deserialize, Principal};
use ic_cdk_macros::{init, query, update};
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::cell::RefCell;
use std::collections::HashMap;

// Types matching the Candid interface
#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq, Hash)]
pub struct Account {
    pub owner: Principal,
    pub subaccount: Option<Vec<u8>>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct RetrieveBtcArgs {
    pub address: String,
    pub amount: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum RetrieveBtcError {
    MalformedAddress(String),
    AlreadyProcessing,
    AmountTooLow(u64),
    InsufficientFunds { balance: u64 },
    TemporarilyUnavailable(String),
    GenericError { error_message: String, error_code: u64 },
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct RetrieveBtcOk {
    pub block_index: u64,
}

pub type RetrieveBtcResult = Result<RetrieveBtcOk, RetrieveBtcError>;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct Utxo {
    pub outpoint: UtxoOutpoint,
    pub value: u64,
    pub height: u32,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct UtxoOutpoint {
    pub txid: Vec<u8>,
    pub vout: u32,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum UtxoStatus {
    ValueTooSmall(Utxo),
    Tainted(Utxo),
    Checked(Utxo),
    Minted {
        block_index: u64,
        minted_amount: u64,
        utxo: Utxo,
    },
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum UpdateBalanceError {
    NoNewUtxos {
        current_confirmations: Option<u32>,
        required_confirmations: u32,
    },
    AlreadyProcessing,
    TemporarilyUnavailable(String),
    GenericError { error_message: String, error_code: u64 },
}

pub type UpdateBalanceResult = Result<Vec<UtxoStatus>, UpdateBalanceError>;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum BtcNetwork {
    Mainnet,
    Testnet,
    Regtest,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum RetrieveBtcStatus {
    Unknown,
    Pending,
    Signing,
    Sending { txid: Vec<u8> },
    Submitted { txid: Vec<u8> },
    AmountTooLow,
    Confirmed { txid: Vec<u8> },
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct GetBtcAddressArgs {
    pub owner: Option<Principal>,
    pub subaccount: Option<Vec<u8>>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct UpdateBalanceArgs {
    pub owner: Option<Principal>,
    pub subaccount: Option<Vec<u8>>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct GetKnownUtxosArgs {
    pub owner: Option<Principal>,
    pub subaccount: Option<Vec<u8>>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct EstimateWithdrawalFeeArgs {
    pub amount: Option<u64>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct EstimateWithdrawalFeeResult {
    pub bitcoin_fee: u64,
    pub minter_fee: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct RetrieveBtcStatusArgs {
    pub block_index: u64,
}

// Storage
thread_local! {
    static KNOWN_UTXOS: RefCell<HashMap<Account, Vec<Utxo>>> = RefCell::new(HashMap::new());
    static PENDING_UTXOS: RefCell<HashMap<Account, Vec<Utxo>>> = RefCell::new(HashMap::new());
    static WITHDRAWAL_REQUESTS: RefCell<HashMap<u64, RetrieveBtcStatus>> = RefCell::new(HashMap::new());
    static BLOCK_INDEX: RefCell<u64> = RefCell::new(0u64);
}

const MIN_WITHDRAWAL_AMOUNT: u64 = 1000; // 0.00001000 TestBTC (1000 satoshi)
const DEPOSIT_FEE: u64 = 10; // 10 satoshi deposit fee
const MINTER_FEE: u64 = 100; // 100 satoshi minter fee
const NETWORK_FEE: u64 = 5000; // 5000 satoshi network fee

#[init]
fn init() {
    // Initialize storage
    KNOWN_UTXOS.with(|utxos| utxos.borrow_mut().clear());
    PENDING_UTXOS.with(|pending| pending.borrow_mut().clear());
    WITHDRAWAL_REQUESTS.with(|withdrawals| withdrawals.borrow_mut().clear());
}

// Convert TestBTC to ckTestBTC methods

#[update]
fn get_btc_address(args: GetBtcAddressArgs) -> String {
    let owner = args.owner.unwrap_or_else(|| ic_cdk::caller());
    let account = Account {
        owner,
        subaccount: args.subaccount,
    };

    // Generate a deterministic mock TestBTC address based on the account
    let mut hasher = Sha256::new();
    hasher.update(account.owner.as_slice());
    if let Some(ref subaccount) = account.subaccount {
        hasher.update(subaccount);
    }
    let hash = hasher.finalize();

    // Create a mock TestBTC address (tb1q format for bech32 testnet)
    let addr_suffix = hex::encode(&hash[..20]);
    format!("tb1q{}", &addr_suffix[..32])
}

#[query]
fn get_known_utxos(args: GetKnownUtxosArgs) -> Vec<Utxo> {
    let owner = args.owner.unwrap_or_else(|| ic_cdk::caller());
    let account = Account {
        owner,
        subaccount: args.subaccount,
    };

    KNOWN_UTXOS.with(|utxos| {
        utxos
            .borrow()
            .get(&account)
            .cloned()
            .unwrap_or_default()
    })
}

#[update]
fn update_balance(args: UpdateBalanceArgs) -> UpdateBalanceResult {
    let owner = args.owner.unwrap_or_else(|| ic_cdk::caller());
    let account = Account {
        owner,
        subaccount: args.subaccount,
    };

    // Check if there are any pending UTXOs for this account
    let pending_utxos = PENDING_UTXOS.with(|pending| {
        pending
            .borrow()
            .get(&account)
            .cloned()
            .unwrap_or_default()
    });

    if pending_utxos.is_empty() {
        return Err(UpdateBalanceError::NoNewUtxos {
            current_confirmations: Some(6),
            required_confirmations: 6,
        });
    }

    // Process pending UTXOs - for mock purposes, we'll mint them all
    let mut utxo_statuses = Vec::new();
    let mut total_minted = 0u64;

    for utxo in pending_utxos {
        if utxo.value < 1000 {
            // Value too small
            utxo_statuses.push(UtxoStatus::ValueTooSmall(utxo));
        } else {
            // Successfully mint this UTXO
            let block_index = BLOCK_INDEX.with(|bi| {
                let mut index = bi.borrow_mut();
                *index += 1;
                *index
            });

            let minted_amount = utxo.value.saturating_sub(DEPOSIT_FEE);
            total_minted += minted_amount;

            utxo_statuses.push(UtxoStatus::Minted {
                block_index,
                minted_amount,
                utxo: utxo.clone(),
            });

            // Move to known UTXOs
            KNOWN_UTXOS.with(|known| {
                let mut known_utxos = known.borrow_mut();
                let account_utxos = known_utxos.entry(account.clone()).or_default();
                account_utxos.push(utxo);
            });
        }
    }

    // Clear pending UTXOs for this account
    PENDING_UTXOS.with(|pending| {
        pending.borrow_mut().remove(&account);
    });

    // Mock: Call the ledger to mint tokens (in real implementation)
    if total_minted > 0 {
        // This would call the ledger canister to mint ckTestBTC
        // For now, just return success
    }

    Ok(utxo_statuses)
}

// Convert ckTestBTC to TestBTC methods

#[query]
fn estimate_withdrawal_fee(_args: EstimateWithdrawalFeeArgs) -> EstimateWithdrawalFeeResult {
    EstimateWithdrawalFeeResult {
        bitcoin_fee: NETWORK_FEE,
        minter_fee: MINTER_FEE,
    }
}

#[query]
fn get_deposit_fee() -> u64 {
    DEPOSIT_FEE
}

#[update]
fn get_withdrawal_account() -> Account {
    // Return the minter's own account for withdrawals
    Account {
        owner: ic_cdk::id(),
        subaccount: None,
    }
}

#[update]
fn retrieve_btc(args: RetrieveBtcArgs) -> RetrieveBtcResult {
    // Validate TestBTC address format (basic validation)
    if !args.address.starts_with("tb1") && !args.address.starts_with("2") && !args.address.starts_with("m") && !args.address.starts_with("n") {
        return Err(RetrieveBtcError::MalformedAddress(
            "Invalid TestBTC address format".to_string(),
        ));
    }

    // Check minimum withdrawal amount
    if args.amount < MIN_WITHDRAWAL_AMOUNT {
        return Err(RetrieveBtcError::AmountTooLow(MIN_WITHDRAWAL_AMOUNT));
    }

    // Generate block index for this withdrawal request
    let block_index = BLOCK_INDEX.with(|bi| {
        let mut index = bi.borrow_mut();
        *index += 1;
        *index
    });

    // Mock: Create a fake transaction ID
    let mut hasher = Sha256::new();
    hasher.update(args.address.as_bytes());
    hasher.update(&args.amount.to_le_bytes());
    hasher.update(&block_index.to_le_bytes());
    let _txid = hasher.finalize().to_vec();

    // Store withdrawal status
    WITHDRAWAL_REQUESTS.with(|withdrawals| {
        withdrawals.borrow_mut().insert(
            block_index,
            RetrieveBtcStatus::Pending,
        );
    });

    // Mock: In a real implementation, this would:
    // 1. Check caller's ckTestBTC balance
    // 2. Burn ckTestBTC tokens
    // 3. Queue TestBTC transaction
    // 4. Return block index for tracking

    Ok(RetrieveBtcOk { block_index })
}

#[query]
fn retrieve_btc_status(args: RetrieveBtcStatusArgs) -> RetrieveBtcStatus {
    WITHDRAWAL_REQUESTS.with(|withdrawals| {
        withdrawals
            .borrow()
            .get(&args.block_index)
            .cloned()
            .unwrap_or(RetrieveBtcStatus::Unknown)
    })
}

// Helper functions for testing

#[update]
pub fn add_pending_utxo(account: Account, utxo: Utxo) {
    PENDING_UTXOS.with(|pending| {
        let mut pending_utxos = pending.borrow_mut();
        let account_utxos = pending_utxos.entry(account).or_default();
        account_utxos.push(utxo);
    });
}

#[update]
pub fn simulate_testbtc_deposit(account: Account, amount: u64) {
    // Create a mock UTXO for testing
    let mut hasher = Sha256::new();
    hasher.update(account.owner.as_slice());
    hasher.update(&amount.to_le_bytes());
    hasher.update(&ic_cdk::api::time().to_le_bytes());
    let txid = hasher.finalize().to_vec();

    let utxo = Utxo {
        outpoint: UtxoOutpoint {
            txid,
            vout: 0,
        },
        value: amount,
        height: 2500000, // Mock block height
    };

    add_pending_utxo(account, utxo);
}

#[update] 
pub fn update_withdrawal_status(block_index: u64, status: RetrieveBtcStatus) {
    WITHDRAWAL_REQUESTS.with(|withdrawals| {
        withdrawals.borrow_mut().insert(block_index, status);
    });
}

ic_cdk::export_candid!();