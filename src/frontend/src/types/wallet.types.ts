export interface WalletState {
  balance: string;
  btcAddress: string;
  loading: boolean;
}

export interface WalletActions {
  loadBalance: (actor?: unknown) => Promise<void>;
  loadBtcAddress: (actor?: unknown) => Promise<void>;
  refreshBalance: () => Promise<void>;
}

export interface TransactionState {
  sendAmount: string;
  sendTo: string;
  loading: boolean;
}

export interface TransactionActions {
  setSendAmount: (amount: string) => void;
  setSendTo: (recipient: string) => void;
  handleSend: (recipient?: string, amount?: string, usePersonalFunds?: boolean) => Promise<void>;
}

export interface BalanceSectionProps {
  balance: string;
  loading: boolean;
  onRefreshBalance: () => Promise<void>;
  onFaucet?: () => Promise<void>;
  showFaucet?: boolean;
}

export interface SendSectionProps {
  sendAmount: string;
  sendTo: string;
  loading: boolean;
  onSendAmountChange: (amount: string) => void;
  onSendToChange: (recipient: string) => void;
  onSend: () => Promise<void>;
}

export interface ReceiveSectionProps {
  btcAddress: string;
  principal: string;
  onCopyBtcAddress: () => void;
  onCopyPrincipal: () => void;
}

export interface Address {
  address: string;
  label?: string;
  createdAt: Date;
  type: 'btc' | 'principal';
}

export interface AddressManagerProps {
  addresses: Address[];
  onGenerateNewAddress: () => Promise<void>;
  onCopyAddress: (address: string) => void;
  loading: boolean;
}