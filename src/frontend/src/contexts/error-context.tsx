import React, { createContext, useContext, useState, useCallback } from 'react';
import ErrorModal from '@/components/shared/error-modal';

interface ErrorDetails {
  title?: string;
  message: string;
  details?: string;
  severity?: 'error' | 'warning' | 'info';
  onRetry?: () => void;
}

interface ErrorContextType {
  showError: (error: ErrorDetails | string) => void;
  clearError: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

interface ErrorProviderProps {
  children: React.ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [error, setError] = useState<ErrorDetails | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const showError = useCallback((error: ErrorDetails | string) => {
    if (typeof error === 'string') {
      setError({ message: error });
    } else {
      setError(error);
    }
    setIsOpen(true);
  }, []);

  const clearError = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setError(null), 200); // Clear after animation
  }, []);

  return (
    <ErrorContext.Provider value={{ showError, clearError }}>
      {children}
      {error && (
        <ErrorModal
          open={isOpen}
          onOpenChange={setIsOpen}
          title={error.title}
          message={error.message}
          details={error.details}
          severity={error.severity}
          onRetry={error.onRetry}
        />
      )}
    </ErrorContext.Provider>
  );
};