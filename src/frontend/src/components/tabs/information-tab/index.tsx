import React from 'react';
import BalanceSection from '@/components/wallet/balance-section';
import ActionButton from '@/components/shared/action-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWalletBalance, useFaucet, useTransfers } from '@/contexts/wallet-context/hooks';
import {
  ArrowUpDown,
  Download,
  Upload,
  Send,
  ArrowDownToLine,
} from 'lucide-react';

const InformationTab: React.FC = () => {
  const { walletStatus, loading, error, initialized, refresh } = useWalletBalance();
  const { useFaucet: handleFaucet, loading: faucetLoading } = useFaucet();
  const { depositToCustody } = useTransfers();

  const handleDepositToCustody = async (amount: string) => {
    try {
      await depositToCustody(amount);
    } catch (error) {
      console.error('Deposit to custody failed:', error);
    }
  };

  // TODO: Modal handlers will be implemented with WalletModals component
  const handleOpenSendModal = () => {
    console.log('Send modal will be implemented');
  };

  const handleOpenReceiveModal = () => {
    console.log('Receive modal will be implemented');
  };

  const handleOpenDepositModal = () => {
    console.log('Deposit modal will be implemented');
  };

  const handleOpenWithdrawModal = () => {
    console.log('Withdraw modal will be implemented');
  };
  return (
    <div className="space-y-6">
      {/* Balances Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Balances</h2>
        <div className="grid gap-4">
          <BalanceSection
            walletStatus={walletStatus || undefined}
            loading={loading}
            error={error}
            initialized={initialized}
            onRefreshBalance={refresh}
            onFaucet={handleFaucet}
            onDepositToCustody={handleDepositToCustody}
            faucetLoading={faucetLoading}
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
            <div className="grid grid-cols-2 gap-3">
              <ActionButton
                onClick={handleOpenSendModal}
                variant="outline"
                className="flex-col h-20 space-y-1"
                icon={<Send className="h-5 w-5" />}
              >
                <span className="text-xs">Send ckTestBTC</span>
              </ActionButton>

              <ActionButton
                onClick={handleOpenReceiveModal}
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
                onClick={handleOpenDepositModal}
                variant="outline"
                className="flex-col h-20 space-y-1"
                icon={<Download className="h-5 w-5" />}
              >
                <span className="text-xs">Deposit TestBTC</span>
              </ActionButton>

              <ActionButton
                onClick={handleOpenWithdrawModal}
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