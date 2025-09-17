import { Principal } from '@dfinity/principal';
import { getBackend } from '@/services/backend.service';

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

export const getICPBalance = async (): Promise<ICPServiceResult> => {
  const backend = getBackend();
  if (!backend) {
    return { success: false, error: 'Backend not initialized' };
  }

  try {
    if (!('get_icp_balance' in backend)) {
      console.warn('ICP balance functionality not yet implemented in backend');
      return {
        success: true,
        data: '0', // Return zero balance for now
      };
    }

    const result = await (backend as any).get_icp_balance();

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
};

export const transferICP = async (to: string, amount: string): Promise<ICPTransferResult> => {
  const backend = getBackend();
  if (!backend) {
    return { success: false, error: 'Backend not initialized' };
  }

  try {
    if (!('transfer_icp' in backend)) {
      console.warn('ICP transfer functionality not yet implemented in backend');
      return {
        success: false,
        error: 'ICP transfer functionality not yet implemented',
      };
    }

    const toPrincipal = Principal.fromText(to);
    const amountBigInt = BigInt(amount);

    const result = await (backend as any).transfer_icp(toPrincipal, amountBigInt);

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
};

export const getICPAddress = (): string => {
  try {
    return 'User principal would be returned here';
  } catch (error) {
    console.error('Failed to get ICP address:', error);
    return '';
  }
};

export const formatICPBalance = (balance: string): string => {
  if (!balance || balance === '0') return '0.00000000';

  const numBalance = parseFloat(balance);
  return (numBalance / 100000000).toFixed(8);
};

export const parseICPAmount = (amount: string): string => {
  const numAmount = parseFloat(amount);
  return (numAmount * 100000000).toString();
};