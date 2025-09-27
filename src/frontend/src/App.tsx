import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { WalletProvider } from '@/contexts/wallet-context';
import { ModalProvider } from '@/contexts/modal-context';
import { initializeServices } from '@/services/initialization';
import LoadingScreen from '@/components/shared/loading-screen';

// Components
import LoginScreen from '@/components/auth/login-screen';
import UserHeader from '@/components/auth/user-header';

// Tab Components
import InformationTab from '@/components/tabs/information-tab';
import DepositsWithdrawalsTab from '@/components/tabs/deposits-withdrawals-tab';
import SendReceiveTab from '@/components/tabs/send-receive-tab';
import TransactionsTab from '@/components/tabs/transactions-tab';

// Modal Components
import ModalRenderer from '@/components/shared/modal-renderer';

// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';

/**
 * AppContent component - Contains the main application logic
 * Rendered inside AuthProvider after authentication setup
 */
const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-blue-800 font-sans flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 max-w-md shadow-xl">
          <h2 className="text-lg font-semibold text-white mb-2">
            Initializing...
          </h2>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
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
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-6 bg-transparent p-0 h-auto gap-1">
                <TabsTrigger value="information" className="text-xs sm:text-sm data-[state=active]:bg-background data-[state=inactive]:bg-muted">Information</TabsTrigger>
                <TabsTrigger value="deposits-withdrawals" className="text-xs sm:text-sm data-[state=active]:bg-background data-[state=inactive]:bg-muted">Deposits & Withdrawals</TabsTrigger>
                <TabsTrigger value="send-receive" className="text-xs sm:text-sm data-[state=active]:bg-background data-[state=inactive]:bg-muted">Send & Receive</TabsTrigger>
                <TabsTrigger value="transactions" className="text-xs sm:text-sm data-[state=active]:bg-background data-[state=inactive]:bg-muted">Transactions</TabsTrigger>
              </TabsList>

              <TabsContent value="information" className="space-y-6">
                <InformationTab />
              </TabsContent>

              <TabsContent value="deposits-withdrawals" className="space-y-6">
                <DepositsWithdrawalsTab />
              </TabsContent>

              <TabsContent value="send-receive" className="space-y-6">
                <SendReceiveTab />
              </TabsContent>

              <TabsContent value="transactions" className="space-y-6">
                <TransactionsTab />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Modal Renderer */}
        <ModalRenderer />
      </main>
    </div>
  );
};

/**
 * Main App component with service initialization and loading state
 * Using @dfinity/auth-client for authentication
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

  return (
    <AuthProvider>
      <WalletProvider>
        <ModalProvider>
          <AppContent />
        </ModalProvider>
      </WalletProvider>
    </AuthProvider>
  );
};

export default App;