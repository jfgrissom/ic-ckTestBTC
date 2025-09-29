import { getBackend } from '@/services/backend.service';

interface DepositWithdrawalResult {
  success: boolean;
  data?: string;
  message?: string;
  error?: string;
}

export const getDepositAddress = async (): Promise<DepositWithdrawalResult> => {
  const backend = await getBackend();
  console.log('[Deposit Service] Getting deposit address, backend:', backend ? 'available' : 'not available');

  if (!backend) {
    return { success: false, error: 'Backend not initialized' };
  }

  try {
    if (!('get_deposit_address' in backend)) {
      console.warn('get_deposit_address method not implemented in backend');
      return {
        success: false,
        error: 'Deposit address functionality not yet implemented',
      };
    }

    const result = await backend.get_deposit_address();

    if ('Ok' in result) {
      return {
        success: true,
        data: result.Ok,
      };
    } else {
      return {
        success: false,
        error: result.Err,
      };
    }
  } catch (error) {
    console.error('Failed to get deposit address:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const withdrawTestBTC = async (address: string, amount: string): Promise<DepositWithdrawalResult> => {
  const backend = await getBackend();

  if (!backend) {
    return { success: false, error: 'Backend not initialized' };
  }

  try {
    if (!('withdraw_testbtc' in backend)) {
      console.warn('withdraw_testbtc method not implemented in backend');
      return {
        success: false,
        error: 'Withdrawal functionality not yet implemented',
      };
    }

    // Validate and convert TestBTC amount to satoshis (smallest units)
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return { success: false, error: 'Invalid amount. Please enter a valid positive number.' };
    }

    // Convert TestBTC amount to satoshis (multiply by 100,000,000)
    const amountSatoshis = Math.floor(numAmount * 100000000);

    if (amountSatoshis === 0) {
      return { success: false, error: 'Amount too small. Minimum amount is 0.00000001 TestBTC.' };
    }

    const amountBigInt = BigInt(amountSatoshis);
    const result = await backend.withdraw_testbtc(address, amountBigInt);

    if ('Ok' in result) {
      return {
        success: true,
        message: result.Ok,
      };
    } else {
      return {
        success: false,
        error: result.Err,
      };
    }
  } catch (error) {
    console.error('Failed to withdraw TestBTC:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Withdrawal failed',
    };
  }
};

export const validateTestBTCAddress = (address: string): { valid: boolean; error?: string } => {
  if (!address) {
    return { valid: false, error: 'Address is required' };
  }

  const bech32Regex = /^tb1q[ac-hj-np-z02-9]{38,58}$/;
  const p2shRegex = /^2[1-9A-HJ-NP-Za-km-z]{33}$/;
  const legacyRegex = /^[mn][1-9A-HJ-NP-Za-km-z]{33}$/;

  if (bech32Regex.test(address) || p2shRegex.test(address) || legacyRegex.test(address)) {
    return { valid: true };
  }

  return {
    valid: false,
    error: 'Invalid TestBTC address format. Use tb1q..., 2..., m..., or n... format',
  };
};

export const formatCkTestBTCAmount = (amount: string): string => {
  if (!amount || amount === '0') return '0.00000000';

  const numAmount = parseFloat(amount);
  return (numAmount / 100000000).toFixed(8);
};

export const parseCkTestBTCAmount = (amount: string): string => {
  const numAmount = parseFloat(amount);
  return (numAmount * 100000000).toString();
};

export const getMinimumWithdrawalAmount = (): string => {
  return '0.00001'; // 1000 satoshis
};

export const getTypicalNetworkFee = (): string => {
  return '0.00005'; // 5000 satoshis
};

export const isValidWithdrawalAmount = (amount: string, balance: string): { valid: boolean; error?: string } => {
  const numAmount = parseFloat(amount);
  const numBalance = parseFloat(formatCkTestBTCAmount(balance));
  const minAmount = parseFloat(getMinimumWithdrawalAmount());

  if (isNaN(numAmount) || numAmount <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }

  if (numAmount < minAmount) {
    return {
      valid: false,
      error: `Minimum withdrawal amount is ${getMinimumWithdrawalAmount()} ckTestBTC`,
    };
  }

  if (numAmount > numBalance) {
    return { valid: false, error: 'Amount exceeds available balance' };
  }

  const estimatedFee = parseFloat(getTypicalNetworkFee());
  if (numAmount + estimatedFee > numBalance) {
    return {
      valid: false,
      error: 'Insufficient balance for withdrawal amount plus network fees',
    };
  }

  return { valid: true };
};