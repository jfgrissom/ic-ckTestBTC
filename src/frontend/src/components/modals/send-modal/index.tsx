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
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

interface SendModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend?: (token: 'ICP' | 'ckTestBTC', recipient: string, amount: string) => Promise<void>;
  loading?: boolean;
  icpBalance?: string;
  ckTestBTCBalance?: string;
}

const SendModal: React.FC<SendModalProps> = ({
  open,
  onOpenChange,
  onSend,
  loading = false,
  icpBalance = '0',
  ckTestBTCBalance = '0',
}) => {
  const [selectedToken, setSelectedToken] = useState<'ICP' | 'ckTestBTC'>('ckTestBTC');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const formatBalance = (balance: string, token: 'ICP' | 'ckTestBTC') => {
    const numBalance = parseFloat(balance || '0');
    if (token === 'ICP') {
      // ICP uses 8 decimal places (100000000 = 1 ICP)
      return (numBalance / 100000000).toFixed(8);
    } else {
      // ckTestBTC uses 8 decimal places (100000000 = 1 ckTestBTC)
      return (numBalance / 100000000).toFixed(8);
    }
  };

  const getCurrentBalance = () => {
    return selectedToken === 'ICP' ? icpBalance : ckTestBTCBalance;
  };

  const validatePrincipal = (principal: string) => {
    // Basic Principal validation - should be base32 encoded and end with specific suffixes
    const principalRegex = /^[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{3}$/;
    const canisterRegex = /^[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{3}$/;

    return principalRegex.test(principal) || canisterRegex.test(principal);
  };

  const validateInputs = () => {
    setError('');

    if (!recipient) {
      setError('Please enter a recipient Principal ID');
      return false;
    }

    if (!validatePrincipal(recipient)) {
      setError('Invalid Principal ID format');
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

    const maxAmount = parseFloat(formatBalance(getCurrentBalance(), selectedToken));
    if (numAmount > maxAmount) {
      setError('Amount exceeds available balance');
      return false;
    }

    const minAmount = selectedToken === 'ICP' ? 0.0001 : 0.00001; // Minimum amounts
    if (numAmount < minAmount) {
      setError(`Minimum send amount is ${minAmount} ${selectedToken}`);
      return false;
    }

    return true;
  };

  const handleSend = async () => {
    if (!validateInputs()) return;

    try {
      // Convert amount to smallest units
      const amountInSmallestUnits = selectedToken === 'ICP'
        ? (parseFloat(amount) * 100000000).toString() // Convert to e8s
        : (parseFloat(amount) * 100000000).toString(); // Convert to satoshis

      await onSend?.(selectedToken, recipient, amountInSmallestUnits);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send transaction failed');
    }
  };

  const handleClose = () => {
    setSelectedToken('ckTestBTC');
    setRecipient('');
    setAmount('');
    setError('');
    onOpenChange(false);
  };

  const handleMaxClick = () => {
    const maxAmount = parseFloat(formatBalance(getCurrentBalance(), selectedToken));
    // Reserve some for fees
    const feeReserve = selectedToken === 'ICP' ? 0.0001 : 0.00001;
    const availableAmount = Math.max(0, maxAmount - feeReserve);
    setAmount(availableAmount.toFixed(8));
  };

  const getTokenDescription = () => {
    if (selectedToken === 'ICP') {
      return 'Send ICP tokens to another Principal ID on the Internet Computer.';
    } else {
      return 'Send ckTestBTC tokens to another Principal ID on the Internet Computer.';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send {selectedToken}</DialogTitle>
          <DialogDescription>
            {getTokenDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Token Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Select Token
            </label>
            <div className="flex space-x-2">
              <Button
                variant={selectedToken === 'ckTestBTC' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedToken('ckTestBTC')}
                className="flex-1"
              >
                <Badge variant="secondary" className="mr-2">
                  ckTestBTC
                </Badge>
                {formatBalance(ckTestBTCBalance, 'ckTestBTC')}
              </Button>
              <Button
                variant={selectedToken === 'ICP' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedToken('ICP')}
                className="flex-1"
              >
                <Badge variant="secondary" className="mr-2">
                  ICP
                </Badge>
                {formatBalance(icpBalance, 'ICP')}
              </Button>
            </div>
          </div>

          {/* Recipient */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Recipient Principal ID
            </label>
            <Input
              type="text"
              placeholder="rdmx6-jaaaa-aaaah-qcaiq-cai"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the Principal ID of the recipient on the Internet Computer
            </p>
          </div>

          {/* Amount */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">
                Amount ({selectedToken})
              </label>
              <div className="text-xs text-gray-500">
                Balance: {formatBalance(getCurrentBalance(), selectedToken)} {selectedToken}
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
              min={selectedToken === 'ICP' ? '0.0001' : '0.00001'}
              max={formatBalance(getCurrentBalance(), selectedToken)}
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
            <p>• Minimum send: {selectedToken === 'ICP' ? '0.0001 ICP' : '0.00001 ckTestBTC'}</p>
            <p>• Network fees will be deducted from your balance</p>
            <p>• Transactions are processed on the Internet Computer</p>
            {selectedToken === 'ckTestBTC' && (
              <p>• ckTestBTC is an ICRC-2 token representing Bitcoin testnet</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={loading || !recipient || !amount}
          >
            {loading ? 'Sending...' : `Send ${selectedToken}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendModal;