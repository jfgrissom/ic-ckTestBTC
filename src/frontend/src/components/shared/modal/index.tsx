import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/**
 * Modal size variants
 * - sm: Small modals (max-w-md) - Simple dialogs, confirmations
 * - md: Medium modals (max-w-lg) - Standard forms, most use cases
 * - lg: Large modals (max-w-2xl) - Complex forms, detailed content
 */
export type ModalSize = 'sm' | 'md' | 'lg';

/**
 * Shared Modal Props
 * Enforces consistent modal behavior across the application
 */
export interface ModalProps {
  /** Control modal visibility */
  open: boolean;
  /** Callback when modal open state changes */
  onOpenChange: (open: boolean) => void;
  /** Modal title displayed in header */
  title: string;
  /** Optional description displayed below title */
  description?: string;
  /** Modal content */
  children: React.ReactNode;
  /** Optional footer content - if not provided, no footer is rendered */
  footer?: React.ReactNode;
  /** Size variant - defaults to 'md' */
  size?: ModalSize;
  /** Optional custom className for additional styling */
  className?: string;
  /** Disable closing modal by clicking outside or pressing escape */
  disableClose?: boolean;
}

/**
 * Standard Modal Footer Props
 * For common cancel/confirm patterns
 */
export interface ModalFooterActionsProps {
  /** Cancel button text */
  cancelText?: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button click handler */
  onCancel: () => void;
  /** Confirm button click handler */
  onConfirm: () => void;
  /** Disable all buttons (during loading) */
  disabled?: boolean;
  /** Show loading state on confirm button */
  loading?: boolean;
  /** Disable only the confirm button (validation failed) */
  confirmDisabled?: boolean;
}

/**
 * Get Tailwind classes for modal size
 */
const getModalSizeClass = (size: ModalSize): string => {
  const sizeClasses = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
  };
  return sizeClasses[size];
};

/**
 * Shared Modal Component
 *
 * Provides consistent modal behavior across the application:
 * - Always scrollable with max-h-[90vh] overflow-y-auto
 * - Consistent sizing patterns (sm, md, lg)
 * - Standard header/footer patterns
 * - Loading states support
 *
 * @example
 * ```tsx
 * <Modal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Send Transaction"
 *   description="Send tokens to another address"
 *   size="md"
 *   footer={
 *     <ModalFooterActions
 *       onCancel={handleClose}
 *       onConfirm={handleSubmit}
 *       confirmText="Send"
 *       loading={loading}
 *     />
 *   }
 * >
 *   <div>Modal content here</div>
 * </Modal>
 * ```
 */
export const Modal: React.FC<ModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  className = '',
  disableClose = false,
}) => {
  const handleOpenChange = (newOpen: boolean) => {
    if (disableClose && !newOpen) {
      return; // Prevent closing if disableClose is true
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={`${getModalSizeClass(size)} max-h-[90vh] overflow-y-auto overflow-x-hidden ${className}`}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {children}

        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
};

/**
 * Standard Modal Footer Actions
 *
 * Provides consistent cancel/confirm button patterns
 *
 * @example
 * ```tsx
 * <ModalFooterActions
 *   onCancel={handleClose}
 *   onConfirm={handleSubmit}
 *   cancelText="Cancel"
 *   confirmText="Submit"
 *   loading={isSubmitting}
 *   confirmDisabled={!isValid}
 * />
 * ```
 */
export const ModalFooterActions: React.FC<ModalFooterActionsProps> = ({
  cancelText = 'Cancel',
  confirmText = 'Confirm',
  onCancel,
  onConfirm,
  disabled = false,
  loading = false,
  confirmDisabled = false,
}) => {
  return (
    <>
      <Button variant="outline" onClick={onCancel} disabled={disabled || loading}>
        {cancelText}
      </Button>
      <Button onClick={onConfirm} disabled={disabled || loading || confirmDisabled}>
        {loading ? 'Processing...' : confirmText}
      </Button>
    </>
  );
};

export default Modal;