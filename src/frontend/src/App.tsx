import React from 'react';
import { useAuth } from './hooks/useAuth';
import { useWallet } from './hooks/useWallet';
import LoginScreen from './components/auth/LoginScreen';
import UserHeader from './components/auth/UserHeader';
import BalanceSection from './components/wallet/BalanceSection';
import SendSection from './components/wallet/SendSection';
import ReceiveSection from './components/wallet/ReceiveSection';
import './App.css';

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
      <div className="app">
        <LoginScreen 
          onLogin={auth.login}
          loading={auth.loading}
          authClient={auth.authClient}
        />
      </div>
    );
  }

  return (
    <div className="app">
      <UserHeader 
        principal={auth.principal}
        onLogout={auth.logout}
      />

      <main className="main">
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