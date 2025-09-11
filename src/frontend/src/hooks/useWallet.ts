import { useState, useEffect } from 'react';
import { getBalance, getBtcAddress, transfer, useFaucet } from '../services/wallet.service';
import { WalletState, WalletActions, TransactionState, TransactionActions } from '../types/wallet.types';

interface UseWalletReturn extends WalletState, WalletActions, TransactionState, TransactionActions {
  handleFaucet: () => Promise<void>;
}

export const useWallet = (isAuthenticated: boolean): UseWalletReturn => {
  const [balance, setBalance] = useState<string>('0');
  const [btcAddress, setBtcAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [sendAmount, setSendAmount] = useState('');
  const [sendTo, setSendTo] = useState('');

  const loadBalance = async (): Promise<void> => {
    setLoading(true);
    try {
      const result = await getBalance();
      if (result.success && result.balance) {
        setBalance(result.balance);
      } else {
        console.error('Error getting balance:', result.error);
      }
    } catch (error) {
      console.error('Failed to load balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBtcAddress = async (): Promise<void> => {
    try {
      const result = await getBtcAddress();
      if (result.success && result.address) {
        setBtcAddress(result.address);
      } else {
        console.error('Error getting BTC address:', result.error);
      }
    } catch (error) {
      console.error('Failed to load BTC address:', error);
    }
  };

  const refreshBalance = async (): Promise<void> => {
    await loadBalance();
  };

  const handleSend = async (): Promise<void> => {
    if (!sendAmount || !sendTo) return;

    setLoading(true);
    try {
      const result = await transfer(sendTo, sendAmount);
      if (result.success) {
        alert(`Transfer successful! Block index: ${result.blockIndex}`);
        setSendAmount('');
        setSendTo('');
        await loadBalance();
      } else {
        alert(`Transfer failed: ${result.error}`);
      }
    } catch (error: any) {
      alert(`Transfer failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFaucet = async (): Promise<void> => {
    setLoading(true);
    try {
      const result = await useFaucet();
      if (result.success) {
        alert(result.message);
        await loadBalance();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error: any) {
      alert(`Failed to get test tokens: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Load initial data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadBalance();
      loadBtcAddress();
    }
  }, [isAuthenticated]);

  return {
    balance,
    btcAddress,
    loading,
    sendAmount,
    sendTo,
    loadBalance,
    loadBtcAddress,
    refreshBalance,
    setSendAmount,
    setSendTo,
    handleSend,
    handleFaucet,
  };
};