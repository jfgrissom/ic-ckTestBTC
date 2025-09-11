use candid::{CandidType, Deserialize, Nat, Principal};
use ic_cdk::api::call::CallResult;
use ic_cdk::{caller, query, update};
use serde::Serialize;

const CKTESTBTC_CANISTER: &str = "g4xu7-jiaaa-aaaan-aaaaq-cai";

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

    let cktestbtc =
        Principal::from_text(CKTESTBTC_CANISTER).map_err(|e| format!("Invalid principal: {e}"))?;

    let result: CallResult<(Nat,)> = ic_cdk::call(cktestbtc, "icrc1_balance_of", (account,)).await;

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

    let cktestbtc =
        Principal::from_text(CKTESTBTC_CANISTER).map_err(|e| format!("Invalid principal: {e}"))?;

    let result: CallResult<(TransferResult,)> =
        ic_cdk::call(cktestbtc, "icrc1_transfer", (transfer_args,)).await;

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

ic_cdk::export_candid!();
