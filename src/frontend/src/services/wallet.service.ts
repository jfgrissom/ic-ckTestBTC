import { Principal } from '@dfinity/principal';
import { getBackend } from './backend.service';
import { getNetworkConfig } from '@/types/backend.types';

/**
 * Get wallet balance
 */
export const getBalance = async (): Promise<{ success: boolean; balance?: string; error?: string }> => {
  const backend = getBackend();
  if (!backend) {
    return { success: false, error: 'Backend not initialized' };
  }

  try {
    const result = await backend.get_balance();
    console.log('🔍 BALANCE: Raw backend result:', result);
    if ('Ok' in result) {
      const balanceValue = result.Ok.toString();
      console.log('🔍 BALANCE: result.Ok type:', typeof result.Ok);
      console.log('🔍 BALANCE: result.Ok value:', result.Ok);
      console.log('🔍 BALANCE: balanceValue string:', balanceValue);
      console.log('🔍 BALANCE: Number(balanceValue):', Number(balanceValue));
      // Convert from smallest unit (satoshi-like) to ckTestBTC
      const formattedBalance = (Number(balanceValue) / 100000000).toFixed(8);
      console.log('🔍 BALANCE: formattedBalance:', formattedBalance);
      return { success: true, balance: formattedBalance };
    } else {
      return { success: false, error: result.Err };
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to load balance' };
  }
};

/**
 * Get Bitcoin testnet address
 */
export const getBtcAddress = async (): Promise<{ success: boolean; address?: string; error?: string }> => {
  const backend = getBackend();
  if (!backend) {
    return { success: false, error: 'Backend not initialized' };
  }

  try {
    const result = await backend.get_btc_address();
    if ('Ok' in result) {
      return { success: true, address: result.Ok };
    } else {
      return { success: false, error: result.Err };
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to load BTC address' };
  }
};

/**
 * Transfer ckTestBTC to another principal
 */
export const transfer = async (
  recipientPrincipal: string, 
  amount: string
): Promise<{ success: boolean; blockIndex?: string; error?: string }> => {
  const backend = getBackend();
  if (!backend) {
    return { success: false, error: 'Backend not initialized' };
  }

  try {
    const toPrincipal = Principal.fromText(recipientPrincipal);
    // Convert ckTestBTC to smallest unit
    const amountBigInt = BigInt(Math.floor(Number(amount) * 100000000));
    
    const result = await backend.transfer(toPrincipal, amountBigInt);
    if ('Ok' in result) {
      return { success: true, blockIndex: result.Ok.toString() };
    } else {
      return { success: false, error: result.Err };
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Transfer failed' };
  }
};

/**
 * Use faucet to get test tokens (local development only)
 */
export const useFaucet = async (): Promise<{ success: boolean; message?: string; error?: string }> => {
  const backend = getBackend();
  const config = getNetworkConfig();
  
  if (!backend) {
    return { success: false, error: 'Backend not initialized' };
  }

  if (config.network !== 'local') {
    return { success: false, error: 'Faucet only available in local development' };
  }

  try {
    console.log('🔍 FAUCET: Calling backend.faucet()...');
    const result = await backend.faucet();
    console.log('🔍 FAUCET: Raw result:', result);
    if ('Ok' in result) {
      console.log('🔍 FAUCET: Success message:', result.Ok);
      return { success: true, message: result.Ok };
    } else {
      console.log('🔍 FAUCET: Error:', result.Err);
      return { success: false, error: result.Err };
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to get test tokens' };
  }
};