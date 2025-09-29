import React, { useCallback } from 'react';
import SendModal from '@/components/modals/send-modal';
import ReceiveModal from '@/components/modals/receive-modal';
import DepositModal from '@/components/modals/deposit-modal';
import WithdrawModal from '@/components/modals/withdraw-modal';
import {
  useWalletBalance,
  useTransfers,
  useDepositWithdrawal,
  useWalletState
} from '@/contexts/wallet-context/hooks';
import { useModals } from '@/hooks/use-modals';

/**
 * ModalRenderer Component
 * Renders all wallet modals and connects them to wallet context
 * This component handles the orchestration between modals and wallet functionality
 */
const ModalRenderer: React.FC = () => {
  const { activeModal, closeModal } = useModals();

  // Wallet context hooks for modal functionality
  const {
    custodialBalance,
    totalAvailable,
    loading
  } = useWalletBalance();

  const {
    sendTokens,
    depositToCustody,
    validateSendInputs,
    calculateMaxSendAmount,
    transferCapabilities
  } = useTransfers();

  const {
    depositAddress,
    getDepositAddress,
    withdrawFromCustody,
    validateWithdrawInputs,
    calculateMaxWithdrawAmount,
    depositWithdrawalCapabilities
  } = useDepositWithdrawal();

  const { principal } = useWalletState();

  // Send modal handler
  const handleSend = useCallback(async (
    _token: string,
    recipient: string,
    amount: string,
    usePersonalFunds?: boolean
  ) => {
    await sendTokens(recipient, amount, usePersonalFunds);
    closeModal();
  }, [sendTokens, closeModal]);

  // Withdraw modal handler (PRD Matrix - only custodial funds can be withdrawn)
  const handleWithdraw = useCallback(async (address: string, amount: string) => {
    await withdrawFromCustody(address, amount);
    closeModal();
  }, [withdrawFromCustody, closeModal]);

  // Wrapper functions to match modal expectations
  const handleDepositToCustody = useCallback(async (amount: string): Promise<void> => {
    await depositToCustody(amount);
  }, [depositToCustody]);

  const handleGetDepositAddress = useCallback(async (): Promise<string> => {
    const result = await getDepositAddress();
    if (result && result.success && result.address) {
      return result.address;
    }
    throw new Error(result?.error || 'Failed to get deposit address');
  }, [getDepositAddress]);

  // Wrapper for validation to match SendModal expected signature
  const handleValidateTransfer = useCallback((
    recipient: string,
    amount: string,
    _token: string,
    usePersonalFunds?: boolean
  ) => {
    const result = validateSendInputs(recipient, amount, usePersonalFunds);
    return {
      valid: result.valid,
      errors: result.errors,
      details: result.details
    };
  }, [validateSendInputs]);

  return (
    <>
      {/* Send Modal */}
      <SendModal
        open={activeModal === 'send'}
        onOpenChange={(open) => !open && closeModal()}
        onSend={handleSend}
        loading={loading}
        ckTestBTCBalance={totalAvailable}
        onValidate={handleValidateTransfer}
        onCalculateMax={calculateMaxSendAmount}
        transferCapabilities={transferCapabilities}
      />

      {/* Receive Modal */}
      <ReceiveModal
        open={activeModal === 'receive'}
        onOpenChange={(open) => !open && closeModal()}
        userPrincipal={principal || ''}
        btcAddress={depositAddress}
      />

      {/* Deposit Modal */}
      <DepositModal
        open={activeModal === 'deposit'}
        onOpenChange={(open) => !open && closeModal()}
        depositAddress={depositAddress}
        onGetDepositAddress={handleGetDepositAddress}
        onDepositToCustody={handleDepositToCustody}
        loading={loading}
        depositCapabilities={depositWithdrawalCapabilities}
      />

      {/* Withdraw Modal */}
      <WithdrawModal
        open={activeModal === 'withdraw'}
        onOpenChange={(open) => !open && closeModal()}
        onWithdraw={handleWithdraw}
        loading={loading}
        balance={custodialBalance}
        onValidate={validateWithdrawInputs}
        onCalculateMax={calculateMaxWithdrawAmount}
        withdrawCapabilities={depositWithdrawalCapabilities}
      />
    </>
  );
};

export default ModalRenderer;