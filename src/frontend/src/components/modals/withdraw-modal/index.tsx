import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

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

  const validateInputs = () => {
    setErrors({});
    setDetails({});

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
      // Fallback calculation if no prop provided
      const maxAmount = parseFloat(formatBalance(balance));
      const availableAmount = Math.max(0, maxAmount - 0.00001);
      setAmount(availableAmount.toFixed(8));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Withdraw to TestBTC</DialogTitle>
          <DialogDescription>
            Send ckTestBTC to a TestBTC address on the Bitcoin testnet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
                Balance: {formatBalance(balance)} ckTestBTC
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMaxClick}
                  className="ml-1 h-6 px-2 text-xs"
                >
                  Max
                </Button>
              </div>
            </div>
            <Input
              type="number"
              step="0.00000001"
              min="0.00001"
              max={formatBalance(balance)}
              placeholder="0.00000000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
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

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleWithdraw}
            disabled={loading || !address || !amount}
          >
            {loading ? 'Processing...' : 'Withdraw'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawModal;