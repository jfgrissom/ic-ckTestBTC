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
import { formatTokenBalance, TokenType } from '@/lib';

interface SendModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend?: (token: TokenType, recipient: string, amount: string) => Promise<void>;
  loading?: boolean;
  icpBalance?: string;
  ckTestBTCBalance?: string;
  // Enhanced validation props
  onValidate?: (recipient: string, amount: string, token: TokenType) => { valid: boolean; errors: Record<string, string>; details?: Record<string, string> };
  onCalculateMax?: (token: TokenType) => string;
}

const SendModal: React.FC<SendModalProps> = ({
  open,
  onOpenChange,
  onSend,
  loading = false,
  icpBalance = '0',
  ckTestBTCBalance = '0',
  onValidate,
  onCalculateMax,
}) => {
  const [selectedToken, setSelectedToken] = useState<TokenType>('ckTestBTC');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [details, setDetails] = useState<Record<string, string>>({});


  const getCurrentBalance = () => {
    return selectedToken === 'ICP' ? icpBalance : ckTestBTCBalance;
  };


  // Validate inputs using shared validation layer via props
  const validateInputs = () => {
    setErrors({});
    setDetails({});

    if (!onValidate) {
      // Fallback validation if no validation function provided
      if (!recipient) {
        setErrors({ recipient: 'Please enter a recipient Principal ID' });
        return false;
      }
      if (!amount) {
        setErrors({ amount: 'Please enter an amount' });
        return false;
      }
      return true;
    }

    const validationResult = onValidate(recipient, amount, selectedToken);
    if (!validationResult.valid) {
      setErrors(validationResult.errors);
      if (validationResult.details) {
        setDetails(validationResult.details);
      }
      return false;
    }

    return true;
  };

  const handleSend = async () => {
    if (!validateInputs()) return;

    try {
      // Note: Amount conversion is now handled by the validation layer
      // The parent component should handle conversion when calling onSend
      await onSend?.(selectedToken, recipient, amount);
      handleClose();
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'Send transaction failed' });
    }
  };

  const handleClose = () => {
    setSelectedToken('ckTestBTC');
    setRecipient('');
    setAmount('');
    setErrors({});
    setDetails({});
    onOpenChange(false);
  };

  const handleMaxClick = () => {
    if (onCalculateMax) {
      const maxAmount = onCalculateMax(selectedToken);
      setAmount(maxAmount);
    } else {
      // Fallback calculation if no prop provided
      const maxAmount = parseFloat(formatTokenBalance(getCurrentBalance(), selectedToken));
      const feeReserve = selectedToken === 'ICP' ? 0.0001 : 0.00001;
      const availableAmount = Math.max(0, maxAmount - feeReserve);
      setAmount(availableAmount.toFixed(8));
    }
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
                {formatTokenBalance(ckTestBTCBalance, 'ckTestBTC')}
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
                {formatTokenBalance(icpBalance, 'ICP')}
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
                Balance: {formatTokenBalance(getCurrentBalance(), selectedToken)} {selectedToken}
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
              max={formatTokenBalance(getCurrentBalance(), selectedToken)}
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
              {errors.recipient && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Recipient: {errors.recipient}</AlertDescription>
                  {details.recipient && (
                    <p className="text-xs mt-1 opacity-80">{details.recipient}</p>
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