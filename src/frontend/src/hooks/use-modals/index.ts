/**
 * Modal management hooks
 * Provides clean API for modal state management across the application
 */

import { useModalContext } from '@/contexts/modal-context';

/**
 * Main hook for modal management
 * Re-exports the context hook with a cleaner name for components
 */
export const useModals = useModalContext;

/**
 * Hook for opening specific modals
 * Provides type-safe modal opening functions
 */
export const useModalActions = () => {
  const { openModal, closeModal } = useModalContext();

  return {
    openSendModal: () => openModal('send'),
    openReceiveModal: () => openModal('receive'),
    openDepositModal: () => openModal('deposit'),
    openWithdrawModal: () => openModal('withdraw'),
    closeModal
  };
};

/**
 * Hook for checking if a specific modal is open
 */
export const useModalState = () => {
  const { activeModal } = useModalContext();

  return {
    isSendModalOpen: activeModal === 'send',
    isReceiveModalOpen: activeModal === 'receive',
    isDepositModalOpen: activeModal === 'deposit',
    isWithdrawModalOpen: activeModal === 'withdraw',
    activeModal
  };
};