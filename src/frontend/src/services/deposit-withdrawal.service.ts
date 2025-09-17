import { BackendActor } from '@/types/backend.types';
import { getBackend } from './backend.service';

interface DepositWithdrawalResult {
  success: boolean;
  data?: string;
  message?: string;
  error?: string;
}

class DepositWithdrawalService {
  private backendActor: BackendActor | null = null;

  setBackendActor(actor: BackendActor): void {
    this.backendActor = actor;
  }

  async getDepositAddress(): Promise<DepositWithdrawalResult> {
    // Try to get backend from service if not set
    const backend = this.backendActor || getBackend();
    console.log('[Deposit Service] Getting deposit address, backend:', backend ? 'available' : 'not available');

    if (!backend) {
      return { success: false, error: 'Backend not initialized' };
    }

    try {
      // Check if the method exists in the backend
      if (!('get_deposit_address' in backend)) {
        console.warn('get_deposit_address method not implemented in backend');
        return {
          success: false,
          error: 'Deposit address functionality not yet implemented',
        };
      }

      const result = await (backend as any).get_deposit_address();

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
  }

  async withdrawTestBTC(address: string, amount: string): Promise<DepositWithdrawalResult> {
    // Try to get backend from service if not set
    const backend = this.backendActor || getBackend();

    if (!backend) {
      return { success: false, error: 'Backend not initialized' };
    }

    try {
      // Check if the method exists in the backend
      if (!('withdraw_testbtc' in backend)) {
        console.warn('withdraw_testbtc method not implemented in backend');
        return {
          success: false,
          error: 'Withdrawal functionality not yet implemented',
        };
      }

      const amountBigInt = BigInt(amount);
      const result = await (backend as any).withdraw_testbtc(address, amountBigInt);

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
  }

  // Validate TestBTC address format
  validateTestBTCAddress(address: string): { valid: boolean; error?: string } {
    if (!address) {
      return { valid: false, error: 'Address is required' };
    }

    // TestBTC address formats:
    // - Bech32 (tb1q...): starts with tb1q, 42-62 characters
    // - P2SH (2...): starts with 2, 34 characters
    // - Legacy (m... or n...): starts with m or n, 34 characters
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
  }

  // Format amount for display
  formatCkTestBTCAmount(amount: string): string {
    if (!amount || amount === '0') return '0.00000000';

    const numAmount = parseFloat(amount);
    // ckTestBTC has 8 decimals (satoshis)
    return (numAmount / 100000000).toFixed(8);
  }

  // Parse display amount to satoshis
  parseCkTestBTCAmount(amount: string): string {
    const numAmount = parseFloat(amount);
    return (numAmount * 100000000).toString();
  }

  // Get minimum withdrawal amount in display units
  getMinimumWithdrawalAmount(): string {
    return '0.00001'; // 1000 satoshis
  }

  // Get typical network fee estimate in display units
  getTypicalNetworkFee(): string {
    return '0.00005'; // 5000 satoshis
  }

  // Check if amount meets minimum requirements
  isValidWithdrawalAmount(amount: string, balance: string): { valid: boolean; error?: string } {
    const numAmount = parseFloat(amount);
    const numBalance = parseFloat(this.formatCkTestBTCAmount(balance));
    const minAmount = parseFloat(this.getMinimumWithdrawalAmount());

    if (isNaN(numAmount) || numAmount <= 0) {
      return { valid: false, error: 'Amount must be greater than 0' };
    }

    if (numAmount < minAmount) {
      return {
        valid: false,
        error: `Minimum withdrawal amount is ${this.getMinimumWithdrawalAmount()} ckTestBTC`,
      };
    }

    if (numAmount > numBalance) {
      return { valid: false, error: 'Amount exceeds available balance' };
    }

    // Check if enough balance for fees (rough estimate)
    const estimatedFee = parseFloat(this.getTypicalNetworkFee());
    if (numAmount + estimatedFee > numBalance) {
      return {
        valid: false,
        error: 'Insufficient balance for withdrawal amount plus network fees',
      };
    }

    return { valid: true };
  }
}

export const depositWithdrawalService = new DepositWithdrawalService();

// Export methods for use in hooks
export const getDepositAddress = () => depositWithdrawalService.getDepositAddress();
export const withdrawTestBTC = (address: string, amount: string) =>
  depositWithdrawalService.withdrawTestBTC(address, amount);
export const validateTestBTCAddress = (address: string) =>
  depositWithdrawalService.validateTestBTCAddress(address);
export const formatCkTestBTCAmount = (amount: string) =>
  depositWithdrawalService.formatCkTestBTCAmount(amount);
export const parseCkTestBTCAmount = (amount: string) =>
  depositWithdrawalService.parseCkTestBTCAmount(amount);