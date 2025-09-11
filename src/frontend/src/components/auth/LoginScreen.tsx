import React from 'react';
import { LoginScreenProps } from '../../types/auth.types';
import './LoginScreen.css';

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, loading, authClient }) => {
  return (
    <div className="login-container">
      <h1>ckTestBTC Wallet</h1>
      <p>Simple ckTestBTC token wallet on the Internet Computer</p>
      <button onClick={onLogin} disabled={!authClient || loading}>
        {loading ? 'Signing in...' : 'Sign in with Internet Identity'}
      </button>
    </div>
  );
};

export default LoginScreen;