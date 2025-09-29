import React, { useState } from 'react';
import Modal, { ModalFooterActions } from '@/components/shared/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Building2 } from 'lucide-react';

interface WithdrawCapabilities {
  canWithdrawFromCustodial: boolean;
  canWithdrawFromPersonal: boolean;
  custodialBalance: string;
  hasWithdrawableFunds: boolean;
}

interface WithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWithdraw?: (address: string, amount: string) => Promise<void>;
  loading?: boolean;
  balance?: string;
  // Enhanced validation props
  onValidate?: (address: string, amount: string) => { valid: boolean; errors: Record<string, string>; details?: Record<string, string> };
  onCalculateMax?: () => string;
  onFormatBalance?: (balance: string) => string;
  // Matrix-aware capabilities
  withdrawCapabilities?: WithdrawCapabilities;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({
  open,
  onOpenChange,
  onWithdraw,
  loading = false,
  balance = '0',
  onValidate,
  onCalculateMax,
  onFormatBalance,
  withdrawCapabilities,
}) => {
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [details, setDetails] = useState<Record<string, string>>({});

  const formatBalance = (balance: string) => {
    if (onFormatBalance) {
      return onFormatBalance(balance);
    }
    // Fallback formatting
    const numBalance = parseFloat(balance || '0');
    return (numBalance / 100000000).toFixed(8);
  };

  const getCurrentBalance = () => {
    // Use custodial balance for withdrawals (matrix rule: only custodial funds can be withdrawn)
    return withdrawCapabilities?.custodialBalance || balance;
  };

  const validateInputs = () => {
    setErrors({});
    setDetails({});

    // Matrix-aware validation: check withdrawal capabilities first
    if (withdrawCapabilities && !withdrawCapabilities.canWithdrawFromCustodial) {
      setErrors({ general: 'No custodial funds available for withdrawal. Deposit personal funds to custodial wallet first.' });
      return false;
    }

    if (!onValidate) {
      // Fallback validation if no validation function provided
      if (!address) {
        setErrors({ address: 'Please enter a TestBTC address' });
        return false;
      }
      if (!amount) {
        setErrors({ amount: 'Please enter an amount' });
        return false;
      }
      return true;
    }

    const validationResult = onValidate(address, amount);
    if (!validationResult.valid) {
      setErrors(validationResult.errors);
      if (validationResult.details) {
        setDetails(validationResult.details);
      }
      return false;
    }

    return true;
  };

  const handleWithdraw = async () => {
    if (!validateInputs()) return;

    try {
      // Note: Amount conversion is now handled by the validation layer
      // The parent component should handle conversion when calling onWithdraw
      await onWithdraw?.(address, amount);
      handleClose();
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'Withdrawal failed' });
    }
  };

  const handleClose = () => {
    setAddress('');
    setAmount('');
    setErrors({});
    setDetails({});
    onOpenChange(false);
  };

  const handleMaxClick = () => {
    if (onCalculateMax) {
      const maxAmount = onCalculateMax();
      setAmount(maxAmount);
    } else {
      // Fallback calculation using custodial balance
      const currentBalance = getCurrentBalance();
      const maxAmount = parseFloat(formatBalance(currentBalance));
      const availableAmount = Math.max(0, maxAmount - 0.00001);
      setAmount(availableAmount.toFixed(8));
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      title="Withdraw to TestBTC"
      description="Send ckTestBTC to a TestBTC address on the Bitcoin testnet."
      size="sm"
      footer={
        <ModalFooterActions
          onCancel={handleClose}
          onConfirm={handleWithdraw}
          cancelText="Cancel"
          confirmText="Withdraw"
          loading={loading}
          confirmDisabled={
            !address ||
            !amount ||
            (withdrawCapabilities && !withdrawCapabilities.canWithdrawFromCustodial)
          }
        />
      }
    >
      <div className="space-y-4">
          {/* Withdrawal Capability Status */}
          {withdrawCapabilities && (
            <div className="p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center space-x-2 mb-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Withdrawal Source</span>
              </div>
              {withdrawCapabilities.canWithdrawFromCustodial ? (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Custodial Wallet</span>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    {formatBalance(withdrawCapabilities.custodialBalance)} ckTestBTC
                  </Badge>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Custodial Wallet</span>
                    <Badge variant="outline" className="text-gray-400">
                      0.00000000 ckTestBTC
                    </Badge>
                  </div>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      No custodial funds available. Only custodial funds can be withdrawn to Bitcoin testnet.
                      Use "Deposit to Wallet" to move personal funds into custodial management first.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              TestBTC Address
            </label>
            <Input
              type="text"
              placeholder="tb1q... or 2... or m... or n..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">
                Amount (ckTestBTC)
              </label>
              <div className="text-xs text-gray-500">
                Custodial Balance: {formatBalance(getCurrentBalance())} ckTestBTC
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMaxClick}
                  className="ml-1 h-6 px-2 text-xs"
                  disabled={!withdrawCapabilities?.canWithdrawFromCustodial}
                >
                  Max
                </Button>
              </div>
            </div>
            <Input
              type="number"
              step="0.00000001"
              min="0.00001"
              max={formatBalance(getCurrentBalance())}
              placeholder="0.00000000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={!withdrawCapabilities?.canWithdrawFromCustodial}
            />
          </div>

          {/* Display errors */}
          {Object.keys(errors).length > 0 && (
            <div className="space-y-2">
              {errors.general && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.general}</AlertDescription>
                </Alert>
              )}
              {errors.address && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Address: {errors.address}</AlertDescription>
                  {details.address && (
                    <p className="text-xs mt-1 opacity-80">{details.address}</p>
                  )}
                </Alert>
              )}
              {errors.amount && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Amount: {errors.amount}</AlertDescription>
                  {details.amount && (
                    <p className="text-xs mt-1 opacity-80">{details.amount}</p>
                  )}
                </Alert>
              )}
            </div>
          )}

          <div className="text-xs text-gray-500 space-y-1">
            <p>• Minimum withdrawal: 0.00001 ckTestBTC</p>
            <p>• Network fees will be deducted from the withdrawal amount</p>
            <p>• Withdrawals may take time to confirm on the Bitcoin testnet</p>
          </div>
        </div>
    </Modal>
  );
};

export default WithdrawModal;