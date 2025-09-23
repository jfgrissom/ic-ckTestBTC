# ckTestBTC Wallet Features

This document lists the core features of the ckTestBTC Wallet application.

## Legend

- ✅ Implemented
- 🤔 Future Consideration

## Core Wallet Features

- ✅ **User Authentication:** Secure, passwordless login using Internet
  Identity.
- ✅ **Wallet Management:**
  - Send and receive ckTestBTC tokens.
  - View real-time balance.
  - Manual balance refresh.
- ✅ **Transaction History:**
  - View a complete list of past transactions.
  - Filter transactions by type (Send, Receive, Deposit, Withdraw, Mint).
  - Search transactions by address or ID.
  - View transaction statistics.
- ✅ **Bitcoin Testnet Integration:**
  - Generate Bitcoin testnet deposit addresses.
  - Convert TestBTC into ckTestBTC.
- ✅ **Custodial Wallet:**
  - Manage both personal and in-app custodial balances.
  - Deposit funds from a personal account to the custodial wallet.
- ✅ **User Interface:**
  - Display Principal ID with copy-to-clipboard functionality.
  - Clear, responsive design for sending and receiving tokens.
  - User-friendly feedback for transaction success and errors.

## UX

- ✅ **Service Initialization Loader**
  - On initial page load a status loading is presented to the user.
- **Balance Display**
  - **Information Tab**
    - Balance is displayed on initial page load.
- **Sending & Receiving ckTestBTC**
  - **Send and Receive Tab**
    - User can send non-custodial ckTestBTC to another IC user.
    - User can send non-custodial ckTestBTC to user's custodial wallet.
    - User can send custodial ckTestBTC to another IC user.
    - User can send custodial ckTestBTC to another user's custodial wallet.

## Security

- ✅ **Secure Authentication:** Integration with Internet Identity ensures
  robust, passwordless security.
- ✅ **Transaction Safety:** Recipient addresses are validated to prevent
  errors.
- ✅ **Non-Custodial Control:** Users maintain control of their funds in their
  personal accounts.

## Future Considerations

- 🤔 **QR Code Support:** Generate QR codes for receiving addresses.
- 🤔 **Address Book:** Save frequently used recipient addresses.
- 🤔 **Multi-Asset Support:** Add support for other cryptocurrencies.
- 🤔 **Mobile Optimization:** Improve the user experience on mobile devices.
