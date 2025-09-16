import { Principal } from '@dfinity/principal';
import { BackendActor } from '@/types/backend.types';

interface ICPServiceResult {
  success: boolean;
  data?: any;
  error?: string;
}

interface ICPTransferResult {
  success: boolean;
  blockIndex?: string;
  error?: string;
}

class ICPService {
  private backendActor: BackendActor | null = null;

  setBackendActor(actor: BackendActor): void {
    this.backendActor = actor;
  }

  async getBalance(): Promise<ICPServiceResult> {
    if (!this.backendActor) {
      return { success: false, error: 'Backend not initialized' };
    }

    try {
      // Check if the method exists in the backend (ICP functionality not yet implemented)
      if (!('get_icp_balance' in this.backendActor)) {
        console.warn('ICP balance functionality not yet implemented in backend');
        return {
          success: true,
          data: '0', // Return zero balance for now
        };
      }

      const result = await (this.backendActor as any).get_icp_balance();

      if ('Ok' in result) {
        return {
          success: true,
          data: result.Ok.toString(),
        };
      } else {
        return {
          success: false,
          error: result.Err,
        };
      }
    } catch (error) {
      console.error('Failed to get ICP balance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async transfer(to: string, amount: string): Promise<ICPTransferResult> {
    if (!this.backendActor) {
      return { success: false, error: 'Backend not initialized' };
    }

    try {
      // Check if the method exists in the backend (ICP functionality not yet implemented)
      if (!('transfer_icp' in this.backendActor)) {
        console.warn('ICP transfer functionality not yet implemented in backend');
        return {
          success: false,
          error: 'ICP transfer functionality not yet implemented',
        };
      }

      const toPrincipal = Principal.fromText(to);
      const amountBigInt = BigInt(amount);

      const result = await (this.backendActor as any).transfer_icp(toPrincipal, amountBigInt);

      if ('Ok' in result) {
        return {
          success: true,
          blockIndex: result.Ok.toString(),
        };
      } else {
        return {
          success: false,
          error: result.Err,
        };
      }
    } catch (error) {
      console.error('Failed to transfer ICP:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transfer failed',
      };
    }
  }

  getAddress(): string {
    // ICP address is just the user's principal
    // This would typically be obtained from the auth service
    try {
      // In a real app, we'd get this from the authenticated user
      return 'User principal would be returned here';
    } catch (error) {
      console.error('Failed to get ICP address:', error);
      return '';
    }
  }

  formatBalance(balance: string): string {
    if (!balance || balance === '0') return '0.00000000';

    const numBalance = parseFloat(balance);
    // ICP has 8 decimals (e8s)
    return (numBalance / 100000000).toFixed(8);
  }

  parseAmount(amount: string): string {
    // Convert display amount to e8s (smallest ICP unit)
    const numAmount = parseFloat(amount);
    return (numAmount * 100000000).toString();
  }
}

export const icpService = new ICPService();

// Export methods for use in hooks
export const getICPBalance = () => icpService.getBalance();
export const transferICP = (to: string, amount: string) => icpService.transfer(to, amount);
export const getICPAddress = () => icpService.getAddress();
export const formatICPBalance = (balance: string) => icpService.formatBalance(balance);
export const parseICPAmount = (amount: string) => icpService.parseAmount(amount);