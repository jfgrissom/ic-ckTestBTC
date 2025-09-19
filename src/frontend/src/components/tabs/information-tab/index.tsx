import React from 'react';
import TokenBalance from '@/components/shared/token-balance';
import BalanceSection from '@/components/wallet/balance-section';
import ActionButton from '@/components/shared/action-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WalletStatus } from '@/services/wallet.service';
import {
  ArrowUpDown,
  Download,
  Upload,
  Send,
  ArrowDownToLine,
  ArrowUpFromLine
} from 'lucide-react';

interface InformationTabProps {
  icpBalance: string;
  ckTestBTCBalance: string;
  walletStatus?: WalletStatus;
  loading: boolean;
  onRefreshBalances: () => void;
  onOpenSendModal: (token: 'ICP' | 'ckTestBTC') => void;
  onOpenReceiveModal: (token: 'ICP' | 'ckTestBTC') => void;
  onOpenDepositModal: () => void;
  onOpenWithdrawModal: () => void;
  onFaucet?: () => void;
  onDepositToCustody?: (amount: string) => void;
}

const InformationTab: React.FC<InformationTabProps> = ({
  icpBalance,
  ckTestBTCBalance,
  walletStatus,
  loading,
  onRefreshBalances,
  onOpenSendModal,
  onOpenReceiveModal,
  onOpenDepositModal,
  onOpenWithdrawModal,
  onFaucet,
  onDepositToCustody,
}) => {
  return (
    <div className="space-y-6">
      {/* Balances Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Balances</h2>
        <div className="grid gap-4">
          <TokenBalance
            token="ICP"
            balance={icpBalance}
            loading={loading}
            onRefresh={onRefreshBalances}
          />
          <BalanceSection
            walletStatus={walletStatus}
            loading={loading}
            onRefreshBalance={onRefreshBalances}
            onFaucet={onFaucet}
            onDepositToCustody={onDepositToCustody}
          />
        </div>
      </div>

      {/* Quick Actions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ArrowUpDown className="h-5 w-5" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* IC Token Actions */}
          <div>
            <h3 className="text-lg font-medium mb-3 text-blue-700">IC Token Operations</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <ActionButton
                onClick={() => onOpenSendModal('ICP')}
                variant="outline"
                className="flex-col h-20 space-y-1"
                icon={<Send className="h-5 w-5" />}
              >
                <span className="text-xs">Send ICP</span>
              </ActionButton>

              <ActionButton
                onClick={() => onOpenReceiveModal('ICP')}
                variant="outline"
                className="flex-col h-20 space-y-1"
                icon={<ArrowDownToLine className="h-5 w-5" />}
              >
                <span className="text-xs">Receive ICP</span>
              </ActionButton>

              <ActionButton
                onClick={() => onOpenSendModal('ckTestBTC')}
                variant="outline"
                className="flex-col h-20 space-y-1"
                icon={<Send className="h-5 w-5" />}
              >
                <span className="text-xs">Send ckTestBTC</span>
              </ActionButton>

              <ActionButton
                onClick={() => onOpenReceiveModal('ckTestBTC')}
                variant="outline"
                className="flex-col h-20 space-y-1"
                icon={<ArrowDownToLine className="h-5 w-5" />}
              >
                <span className="text-xs">Receive ckTestBTC</span>
              </ActionButton>
            </div>
          </div>

          {/* Bitcoin TestNet Actions */}
          <div>
            <h3 className="text-lg font-medium mb-3 text-orange-700">Bitcoin TestNet Operations</h3>
            <div className="grid grid-cols-2 gap-3">
              <ActionButton
                onClick={onOpenDepositModal}
                variant="outline"
                className="flex-col h-20 space-y-1"
                icon={<Download className="h-5 w-5" />}
              >
                <span className="text-xs">Deposit TestBTC</span>
              </ActionButton>

              <ActionButton
                onClick={onOpenWithdrawModal}
                variant="outline"
                className="flex-col h-20 space-y-1"
                icon={<Upload className="h-5 w-5" />}
              >
                <span className="text-xs">Withdraw TestBTC</span>
              </ActionButton>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-gray-600 space-y-2">
            <h4 className="font-medium text-gray-800">About Your Wallet</h4>
            <p>
              • <strong>ICP</strong>: Native Internet Computer token for transactions and governance
            </p>
            <p>
              • <strong>ckTestBTC</strong>: Chain-key Bitcoin testnet token backed by TestBTC
            </p>
            <p>
              • <strong>Deposit/Withdraw</strong>: Bridge between Bitcoin TestNet and Internet Computer
            </p>
            <p>
              • <strong>Send/Receive</strong>: Transfer tokens directly between IC wallets
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InformationTab;