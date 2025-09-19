import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useWallet } from '@/hooks/use-wallet';
import { useDepositWithdrawal } from '@/hooks/use-deposit-withdrawal';

// Components
import LoginScreen from '@/components/auth/login-screen';
import UserHeader from '@/components/auth/user-header';

// Tab Components
import InformationTab from '@/components/tabs/information-tab';
import DepositsWithdrawalsTab from '@/components/tabs/deposits-withdrawals-tab';
import SendReceiveTab from '@/components/tabs/send-receive-tab';
import TransactionsTab from '@/components/tabs/transactions-tab';

// Modal Components
import DepositModal from '@/components/modals/deposit-modal';
import WithdrawModal from '@/components/modals/withdraw-modal';
import SendModal from '@/components/modals/send-modal';
import ReceiveModal from '@/components/modals/receive-modal';

// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';

const App: React.FC = () => {
  const auth = useAuth();
  const wallet = useWallet(auth.isAuthenticated);
  const depositWithdrawal = useDepositWithdrawal();

  // Modal states
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  // Modal token selection is handled by the modal handlers

  // Deposit address state
  const [depositAddress, setDepositAddress] = useState<string>('');

  // Check if running in local development (for faucet functionality)
  const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  // Modal handlers
  const handleOpenSendModal = (_token: 'ICP' | 'ckTestBTC') => {
    // Token selection is handled within the modal component
    setSendModalOpen(true);
  };

  const handleOpenReceiveModal = (_token: 'ICP' | 'ckTestBTC') => {
    // Token selection is handled within the modal component
    setReceiveModalOpen(true);
  };

  const handleGetDepositAddress = async (): Promise<string> => {
    const result = await depositWithdrawal.getDepositAddress();
    if (result.success && result.address) {
      setDepositAddress(result.address);
      return result.address;
    }
    throw new Error(result.error || 'Failed to get deposit address');
  };

  const handleSend = async (token: 'ICP' | 'ckTestBTC', recipient: string, amount: string, usePersonalFunds?: boolean): Promise<void> => {
    if (token === 'ICP') {
      const result = await wallet.transferICP(recipient, amount);
      if (!result.success) {
        throw new Error(result.error || 'ICP transfer failed');
      }
    } else {
      // Use the dual-transfer method for ckTestBTC
      await wallet.handleSend(recipient, amount, usePersonalFunds ?? true);
    }
  };

  const handleWithdraw = async (address: string, amount: string): Promise<void> => {
    const result = await depositWithdrawal.withdrawTestBTC(address, amount);
    if (!result.success) {
      throw new Error(result.error || 'Withdrawal failed');
    }
  };

  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-blue-800 font-sans">
        <LoginScreen
          onLogin={auth.login}
          loading={auth.loading}
          authClient={auth.authClient}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-blue-800 font-sans">
      <UserHeader
        principal={auth.principal}
        onLogout={auth.logout}
      />

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
          <CardContent className="p-6">
            <Tabs defaultValue="information" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="information">Information</TabsTrigger>
                <TabsTrigger value="deposits-withdrawals">Deposits & Withdrawals</TabsTrigger>
                <TabsTrigger value="send-receive">Send & Receive</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
              </TabsList>

              <TabsContent value="information" className="space-y-6">
                <InformationTab
                  icpBalance={wallet.icpBalance}
                  ckTestBTCBalance={wallet.walletStatus?.totalAvailable || wallet.balance}
                  walletStatus={wallet.walletStatus}
                  loading={wallet.loading || wallet.icpLoading}
                  onRefreshBalances={() => {
                    wallet.refreshWalletStatus();
                    wallet.refreshICPBalance();
                  }}
                  onOpenSendModal={handleOpenSendModal}
                  onOpenReceiveModal={handleOpenReceiveModal}
                  onOpenDepositModal={() => setDepositModalOpen(true)}
                  onOpenWithdrawModal={() => setWithdrawModalOpen(true)}
                  onFaucet={wallet.handleFaucet}
                  onDepositToCustody={wallet.handleDepositToCustody}
                />
              </TabsContent>

              <TabsContent value="deposits-withdrawals" className="space-y-6">
                <DepositsWithdrawalsTab
                  loading={wallet.loading || depositWithdrawal.loading}
                  balance={wallet.walletStatus?.custodialBalance || wallet.balance}
                  depositAddress={depositAddress}
                  onGetDepositAddress={handleGetDepositAddress}
                  onFaucet={wallet.handleFaucet}
                  onOpenDepositModal={() => setDepositModalOpen(true)}
                  onOpenWithdrawModal={() => setWithdrawModalOpen(true)}
                  isLocalDev={isLocalDev}
                />
              </TabsContent>

              <TabsContent value="send-receive" className="space-y-6">
                <SendReceiveTab
                  icpBalance={wallet.icpBalance}
                  ckTestBTCBalance={wallet.walletStatus?.totalAvailable || wallet.balance}
                  userPrincipal={auth.principal}
                  btcAddress={wallet.btcAddress}
                  loading={wallet.loading || wallet.icpLoading}
                  onOpenSendModal={handleOpenSendModal}
                  onOpenReceiveModal={handleOpenReceiveModal}
                  recentTransactions={wallet.getRecentTransactions(5)}
                />
              </TabsContent>

              <TabsContent value="transactions" className="space-y-6">
                <TransactionsTab
                  transactions={wallet.transactionHistory}
                  loading={wallet.transactionLoading}
                  onRefreshTransactions={wallet.refreshTransactions}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Modal Components */}
        <DepositModal
          open={depositModalOpen}
          onOpenChange={setDepositModalOpen}
          onGetDepositAddress={handleGetDepositAddress}
          depositAddress={depositAddress}
          loading={depositWithdrawal.loading}
          depositCapabilities={wallet.getDepositCapabilities()}
          onDepositToCustody={wallet.handleDepositToCustody}
        />

        <WithdrawModal
          open={withdrawModalOpen}
          onOpenChange={setWithdrawModalOpen}
          onWithdraw={handleWithdraw}
          loading={depositWithdrawal.loading}
          balance={wallet.walletStatus?.custodialBalance || wallet.balance}
          withdrawCapabilities={wallet.getWithdrawCapabilities()}
        />

        <SendModal
          open={sendModalOpen}
          onOpenChange={setSendModalOpen}
          onSend={handleSend}
          loading={wallet.loading || wallet.icpLoading}
          icpBalance={wallet.icpBalance}
          ckTestBTCBalance={wallet.walletStatus?.totalAvailable || wallet.balance}
          transferCapabilities={wallet.getTransferCapabilities()}
          onValidate={wallet.validateSendInputs}
          onCalculateMax={wallet.calculateMaxSendableAmount}
        />

        <ReceiveModal
          open={receiveModalOpen}
          onOpenChange={setReceiveModalOpen}
          userPrincipal={auth.principal}
          btcAddress={wallet.btcAddress}
        />
      </main>
    </div>
  );
};

export default App;