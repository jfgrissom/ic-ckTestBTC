import React from 'react';
import { useAuth } from './hooks/useAuth';
import { useWallet } from './hooks/useWallet';
import LoginScreen from './components/auth/LoginScreen';
import UserHeader from './components/auth/UserHeader';
import BalanceSection from './components/wallet/BalanceSection';
import SendSection from './components/wallet/SendSection';
import ReceiveSection from './components/wallet/ReceiveSection';

const App: React.FC = () => {
  const auth = useAuth();
  const wallet = useWallet(auth.isAuthenticated);

  const handleCopyBtcAddress = () => {
    navigator.clipboard.writeText(wallet.btcAddress);
  };

  const handleCopyPrincipal = () => {
    navigator.clipboard.writeText(auth.principal);
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

      <main className="max-w-4xl mx-auto px-4 md:px-8 py-8 grid gap-8">
        <BalanceSection
          balance={wallet.balance}
          loading={wallet.loading || auth.loading}
          onRefreshBalance={wallet.refreshBalance}
          onFaucet={wallet.handleFaucet}
        />

        <SendSection
          sendAmount={wallet.sendAmount}
          sendTo={wallet.sendTo}
          loading={wallet.loading}
          onSendAmountChange={wallet.setSendAmount}
          onSendToChange={wallet.setSendTo}
          onSend={wallet.handleSend}
        />

        <ReceiveSection
          btcAddress={wallet.btcAddress}
          principal={auth.principal}
          onCopyBtcAddress={handleCopyBtcAddress}
          onCopyPrincipal={handleCopyPrincipal}
        />
      </main>
    </div>
  );
};

export default App;