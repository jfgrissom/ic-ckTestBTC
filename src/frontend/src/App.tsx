import React, { useState, useEffect } from 'react';
import { useConnect, useCanister, Connect2ICProvider } from '@connect2ic/react';
import { createClient } from '@connect2ic/core';
import { InternetIdentity } from '@connect2ic/core/providers/internet-identity';
import { NFID } from '@connect2ic/core/providers/nfid';
import '@connect2ic/core/style.css';
import { setBackendActor } from '@/services/backend.service';
import { setConnectLedgerActor } from '@/services/ledger.service';
import { initializeServices } from '@/services/initialization';
import LoadingScreen from '@/components/shared/loading-screen';
import * as backend from 'declarations/backend';
import * as mockLedger from 'declarations/mock_cktestbtc_ledger';

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

/**
 * Connect2IC Wrapper - Creates client and provides Connect2IC context
 * Only rendered after services are successfully initialized
 */
const Connect2ICWrapper: React.FC = () => {
  // Import backend canister declarations (after initialization)
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    const setupConnect2IC = async () => {
      try {
        // Environment detection
        const isDev = import.meta.env.DEV;

        // Configure Internet Identity provider based on environment
        const internetIdentityConfig = isDev ? {
          // Local development configuration - using modern dfx localhost format
          host: 'http://localhost:4943',
          providerUrl: `http://${import.meta.env.VITE_CANISTER_ID_INTERNET_IDENTITY}.localhost:4943`,
          dev: true
        } : {
          // Production configuration - using Internet Identity v2 (id.ai)
          providerUrl: 'https://id.ai',
          dev: false
        };

        // Debug backend module
        console.log('Backend module for Connect2IC:', {
          hasBackend: !!backend.backend,
          canisterId: backend.canisterId,
          hasIdlFactory: !!backend.idlFactory,
          hasCreateActor: !!backend.createActor
        });

        // Create the Connect2IC client with type assertion for IDL factory compatibility
        // NOTE: Connect2IC uses a different @dfinity/candid version requiring this type workaround
        const connect2icClient = createClient({
          canisters: {
            backend: {
              canisterId: backend.canisterId,
              // @ts-expect-error: Connect2IC library type incompatibility with @dfinity/candid versions
              idlFactory: backend.idlFactory,
            },
            ckTestBTCLedger: {
              canisterId: mockLedger.canisterId,
              // @ts-expect-error: Connect2IC library type incompatibility with @dfinity/candid versions
              idlFactory: mockLedger.idlFactory,
            },
          },
          providers: [
            new InternetIdentity(internetIdentityConfig),
            new NFID()
          ],
          globalProviderConfig: {
            dev: isDev,
            host: isDev ? 'http://localhost:4943' : 'https://ic0.app',
          }
        });

        setClient(connect2icClient);
      } catch (error) {
        console.error('Failed to setup Connect2IC:', error);
      }
    };

    setupConnect2IC();
  }, []);

  if (!client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-blue-800 font-sans flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 max-w-md shadow-xl">
          <h2 className="text-lg font-semibold text-white mb-2">
            Setting up Connect2IC...
          </h2>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <Connect2ICProvider client={client}>
      <AppContent />
    </Connect2ICProvider>
  );
};

/**
 * AppContent component - Contains the main application logic
 * Rendered inside Connect2IC provider after client setup
 */
const AppContent: React.FC = () => {
  // Use Connect2IC authentication and backend
  const { isConnected, principal } = useConnect();
  const [backendActor] = useCanister('backend');
  const [ckTestBTCLedgerActor] = useCanister('ckTestBTCLedger');

  // Create auth object for Connect2IC
  const auth = {
    isAuthenticated: isConnected,
    principal: principal || '',
    loading: false
  };

  // Set up backend actor lifecycle management
  useEffect(() => {
    if (isConnected && backendActor) {
      console.log('Setting backend actor for Connect2IC');
      setBackendActor(backendActor as any);
    } else {
      console.log('Clearing backend actor');
      setBackendActor(null);
    }
  }, [isConnected, backendActor]);

  // Set up ckTestBTC ledger actor lifecycle management
  useEffect(() => {
    if (isConnected && ckTestBTCLedgerActor) {
      console.log('Setting ckTestBTC ledger actor for Connect2IC');
      setConnectLedgerActor(ckTestBTCLedgerActor);
    } else {
      console.log('Clearing ckTestBTC ledger actor');
      setConnectLedgerActor(null);
    }
  }, [isConnected, ckTestBTCLedgerActor]);

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
        <LoginScreen />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-blue-800 font-sans">
      <UserHeader />

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
                  recentTransactions={wallet.getRecentTransactions()}
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

/**
 * Main App component with service initialization and loading state
 * Based on the gifty-crypto platform pattern
 */
const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string>('');

  useEffect(() => {
    // Initialize services on app startup with minimum display time
    const initialize = async () => {
      try {
        // Start both the service initialization and minimum display timer
        const minDisplayTime = new Promise(resolve => setTimeout(resolve, 1000)); // 1 second minimum
        const serviceInit = initializeServices();

        // Wait for both to complete
        await Promise.all([serviceInit, minDisplayTime]);
        setIsInitialized(true);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setInitError(errorMessage);
        console.error('Service initialization failed:', errorMessage);
      }
    };

    initialize();
  }, []);

  if (!isInitialized) {
    return (
      <LoadingScreen
        error={initError || null}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return <Connect2ICWrapper />;
};

export default App;