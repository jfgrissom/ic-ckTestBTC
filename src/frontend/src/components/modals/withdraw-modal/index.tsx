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
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({
  open,
  onOpenChange,
  onWithdraw,
  loading = false,
  balance = '0',
}) => {
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const formatBalance = (balance: string) => {
    const numBalance = parseFloat(balance || '0');
    return (numBalance / 100000000).toFixed(8);
  };

  const validateInputs = () => {
    setError('');

    if (!address) {
      setError('Please enter a TestBTC address');
      return false;
    }

    if (!address.match(/^(tb1|[2mn])[a-zA-Z0-9]{25,62}$/)) {
      setError('Invalid TestBTC address format');
      return false;
    }

    if (!amount) {
      setError('Please enter an amount');
      return false;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Amount must be greater than 0');
      return false;
    }

    const maxAmount = parseFloat(formatBalance(balance));
    if (numAmount > maxAmount) {
      setError('Amount exceeds available balance');
      return false;
    }

    const minAmount = 0.00001; // 1000 satoshis
    if (numAmount < minAmount) {
      setError('Minimum withdrawal amount is 0.00001 TestBTC');
      return false;
    }

    return true;
  };

  const handleWithdraw = async () => {
    if (!validateInputs()) return;

    try {
      // Convert amount to smallest units (satoshis)
      const amountInSatoshis = (parseFloat(amount) * 100000000).toString();
      await onWithdraw?.(address, amountInSatoshis);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Withdrawal failed');
    }
  };

  const handleClose = () => {
    setAddress('');
    setAmount('');
    setError('');
    onOpenChange(false);
  };

  const handleMaxClick = () => {
    const maxAmount = parseFloat(formatBalance(balance));
    // Reserve some for fees
    const availableAmount = Math.max(0, maxAmount - 0.00001);
    setAmount(availableAmount.toFixed(8));
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

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
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