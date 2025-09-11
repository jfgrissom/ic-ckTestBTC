import React, { useState, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { idlFactory } from 'declarations/backend';
import './App.css';

const App: React.FC = () => {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [backend, setBackend] = useState<any>(null);
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [principal, setPrincipal] = useState<string>('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendTo, setSendTo] = useState('');

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    const client = await AuthClient.create();
    setAuthClient(client);

    if (await client.isAuthenticated()) {
      handleAuthenticated(client);
    }
  };

  const handleAuthenticated = async (client: AuthClient) => {
    setIsAuthenticated(true);
    
    const identity = client.getIdentity();
    const agent = new HttpAgent({
      identity,
      host: import.meta.env.DFX_NETWORK === 'ic' ? 'https://ic0.app' : 'http://127.0.0.1:4943',
    });

    if (import.meta.env.DFX_NETWORK !== 'ic') {
      await agent.fetchRootKey();
    }

    const backendActor = Actor.createActor(idlFactory, {
      agent,
      canisterId: import.meta.env.CANISTER_ID_BACKEND || '',
    });

    setBackend(backendActor);
    
    // Get user principal
    const userPrincipal = await backendActor.get_principal() as Principal;
    setPrincipal(userPrincipal.toString());
    
    // Load initial data
    await loadBalance(backendActor);
  };

  const login = async () => {
    if (!authClient) return;

    await authClient.login({
      identityProvider: import.meta.env.DFX_NETWORK === 'ic' 
        ? 'https://identity.ic0.app/#authorize'
        : 'http://127.0.0.1:4943/?canisterId=bkyz2-fmaaa-aaaah-qaaaq-cai',
      onSuccess: () => handleAuthenticated(authClient),
    });
  };

  const logout = async () => {
    if (!authClient) return;
    
    await authClient.logout();
    setIsAuthenticated(false);
    setBackend(null);
    setPrincipal('');
    setBalance('0');
  };

  const loadBalance = async (actor: any) => {
    setLoading(true);
    try {
      const result = await actor.get_balance();
      if ('Ok' in result) {
        const balanceValue = result.Ok.toString();
        // Convert from smallest unit (satoshi-like) to ckTestBTC
        const formattedBalance = (Number(balanceValue) / 100000000).toFixed(8);
        setBalance(formattedBalance);
      } else {
        console.error('Error getting balance:', result.Err);
      }
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
    setLoading(false);
  };


  const handleSend = async () => {
    if (!backend || !sendAmount || !sendTo) return;

    setLoading(true);
    try {
      const toPrincipal = Principal.fromText(sendTo);
      // Convert ckTestBTC to smallest unit
      const amount = BigInt(Math.floor(Number(sendAmount) * 100000000));
      
      const result = await backend.transfer(toPrincipal, amount);
      if ('Ok' in result) {
        alert(`Transfer successful! Block index: ${result.Ok}`);
        setSendAmount('');
        setSendTo('');
        await loadBalance(backend);
      } else {
        alert(`Transfer failed: ${result.Err}`);
      }
    } catch (error: any) {
      alert(`Transfer failed: ${error.message}`);
    }
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="app">
        <div className="login-container">
          <h1>ckTestBTC Wallet</h1>
          <p>Simple ckTestBTC token wallet on the Internet Computer</p>
          <button onClick={login} disabled={!authClient}>
            Sign in with Internet Identity
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>ckTestBTC Wallet</h1>
        <div className="user-info">
          <span>Principal: {principal.slice(0, 8)}...</span>
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      <main className="main">
        <div className="balance-section">
          <h2>Balance</h2>
          <div className="balance-display">
            {loading ? 'Loading...' : `${balance} ckTestBTC`}
          </div>
          <button onClick={() => loadBalance(backend)} disabled={loading}>
            Refresh Balance
          </button>
        </div>


        <div className="send-section">
          <h2>Send ckTestBTC</h2>
          <div className="send-form">
            <input
              type="text"
              placeholder="Recipient Principal ID"
              value={sendTo}
              onChange={(e) => setSendTo(e.target.value)}
              disabled={loading}
            />
            <input
              type="number"
              placeholder="Amount"
              step="0.00000001"
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
              disabled={loading}
            />
            <button 
              onClick={handleSend}
              disabled={loading || !sendAmount || !sendTo || Number(sendAmount) <= 0}
            >
              Send
            </button>
          </div>
        </div>

        <div className="receive-section">
          <h2>Receive ckTestBTC</h2>
          <p>Your receiving address (Principal ID):</p>
          <div className="address-display">
            {principal}
            <button 
              onClick={() => navigator.clipboard.writeText(principal)}
              className="copy-btn"
            >
              Copy
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;