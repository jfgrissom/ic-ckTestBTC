import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Modal types
export type ModalType = 'send' | 'receive' | 'deposit' | 'withdraw' | null;

// Context type for modal management
export interface ModalContextType {
  openModal: (type: ModalType) => void;
  closeModal: () => void;
  activeModal: ModalType;
}

// Create context
const ModalContext = createContext<ModalContextType | undefined>(undefined);

// Internal hook to use modal context (will be re-exported from hooks/use-modals)
export const useModalContext = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModalContext must be used within ModalProvider');
  }
  return context;
};

// Props for the provider
interface ModalProviderProps {
  children: ReactNode;
}

// Modal Provider Component
export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const openModal = useCallback((type: ModalType) => {
    setActiveModal(type);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  return (
    <ModalContext.Provider value={{ openModal, closeModal, activeModal }}>
      {children}
    </ModalContext.Provider>
  );
};