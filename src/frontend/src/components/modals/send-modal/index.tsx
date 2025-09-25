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
import { AlertCircle, Wallet, Building2, Info } from 'lucide-react';
import { formatTokenBalance, TokenType } from '@/lib';

interface TransferCapabilities {
  canTransferPersonal: boolean;
  canTransferCustodial: boolean;
  personalBalance: string;
  custodialBalance: string;
  hasPersonalFunds: boolean;
  hasCustodialFunds: boolean;
}

interface SendModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend?: (token: TokenType, recipient: string, amount: string, usePersonalFunds?: boolean) => Promise<void>;
  loading?: boolean;
  ckTestBTCBalance?: string;
  // Enhanced validation props
  onValidate?: (recipient: string, amount: string, token: TokenType, usePersonalFunds?: boolean) => { valid: boolean; errors: Record<string, string>; details?: Record<string, string> };
  onCalculateMax?: (token: TokenType, usePersonalFunds?: boolean) => string;
  // Transfer capabilities for dual-transfer architecture
  transferCapabilities?: TransferCapabilities;
}

const SendModal: React.FC<SendModalProps> = ({
  open,
  onOpenChange,
  onSend,
  loading = false,
  ckTestBTCBalance = '0',
  onValidate,
  onCalculateMax,
  transferCapabilities,
}) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [usePersonalFunds, setUsePersonalFunds] = useState(true); // Default to personal funds (direct ledger)
  const [isSubmitting, setIsSubmitting] = useState(false); // Local loading state for instant feedback

  // Update transfer method selection when capabilities change
  React.useEffect(() => {
    if (transferCapabilities) {
      // If current selection is not available, switch to available option
      if (usePersonalFunds && !transferCapabilities.canTransferPersonal && transferCapabilities.canTransferCustodial) {
        setUsePersonalFunds(false);
      } else if (!usePersonalFunds && !transferCapabilities.canTransferCustodial && transferCapabilities.canTransferPersonal) {
        setUsePersonalFunds(true);
      }
    }
  }, [transferCapabilities, usePersonalFunds]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [details, setDetails] = useState<Record<string, string>>({});


  const getCurrentBalance = () => {
    // For ckTestBTC, determine balance based on transfer method selection
    if (transferCapabilities) {
      return usePersonalFunds
        ? transferCapabilities.personalBalance
        : transferCapabilities.custodialBalance;
    }

    return ckTestBTCBalance;
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

    // For ckTestBTC, validate against the selected balance type
    if (transferCapabilities) {
      // Check if the selected transfer method is available
      if (usePersonalFunds && !transferCapabilities.canTransferPersonal) {
        setErrors({ general: 'Personal funds not available for transfer' });
        return false;
      }
      if (!usePersonalFunds && !transferCapabilities.canTransferCustodial) {
        setErrors({ general: 'Custodial funds not available for transfer' });
        return false;
      }
    }

    const validationResult = onValidate(
      recipient,
      amount,
      'ckTestBTC',
      usePersonalFunds
    );
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

    setIsSubmitting(true); // Instant feedback - disable button immediately
    try {
      // Note: Amount conversion is now handled by the validation layer
      // The parent component should handle conversion when calling onSend
      // Pass usePersonalFunds parameter for ckTestBTC transfers
      await onSend?.('ckTestBTC', recipient, amount, usePersonalFunds);
      handleClose();
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'Send transaction failed' });
    } finally {
      setIsSubmitting(false); // Re-enable button if there's an error
    }
  };

  const handleClose = () => {
    setRecipient('');
    setAmount('');
    setUsePersonalFunds(true); // Reset to default (personal funds)
    setErrors({});
    setDetails({});
    setIsSubmitting(false); // Reset loading state
    onOpenChange(false);
  };

  const handleMaxClick = () => {
    if (onCalculateMax) {
      const maxAmount = onCalculateMax(
        'ckTestBTC',
        usePersonalFunds
      );
      setAmount(maxAmount);
    } else {
      // Fallback calculation if no prop provided
      const maxAmount = parseFloat(formatTokenBalance(getCurrentBalance(), 'ckTestBTC'));
      const feeReserve = 0.00001;
      const availableAmount = Math.max(0, maxAmount - feeReserve);
      setAmount(availableAmount.toFixed(8));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send ckTestBTC</DialogTitle>
          <DialogDescription>
            Send ckTestBTC tokens to another Principal ID on the Internet Computer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pb-4">
          {/* Transfer Method Selection for ckTestBTC - Always show when ckTestBTC is selected */}
          {transferCapabilities && (
            <div className="border border-blue-200 bg-blue-50 rounded-lg p-3">
              <label className="text-sm font-semibold text-blue-900 mb-3 block">
                Select Transfer Method (Required)
              </label>
              <div className="space-y-3">
                {/* Personal Funds Option - Matrix Row 2: User Principal direct transfer */}
                <div
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    usePersonalFunds
                      ? 'border-blue-500 bg-blue-100 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  } ${!transferCapabilities.canTransferPersonal ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => transferCapabilities.canTransferPersonal && setUsePersonalFunds(true)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        usePersonalFunds ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}>
                        {usePersonalFunds && <div className="w-2 h-2 rounded-full bg-white m-0.5"></div>}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <Wallet className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-gray-900">Personal Account</span>
                        </div>
                        <Badge
                          variant={transferCapabilities.canTransferPersonal ? "outline" : "secondary"}
                          className="text-xs"
                        >
                          {formatTokenBalance(transferCapabilities.personalBalance, 'ckTestBTC')} ckTestBTC
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">
                        Direct transfer via ckTestBTC ledger (User → User)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Custodial Funds Option - Matrix Row 1: Backend proxy transfer */}
                <div
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    !usePersonalFunds
                      ? 'border-blue-500 bg-blue-100 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  } ${!transferCapabilities.canTransferCustodial ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => transferCapabilities.canTransferCustodial && setUsePersonalFunds(false)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        !usePersonalFunds ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}>
                        {!usePersonalFunds && <div className="w-2 h-2 rounded-full bg-white m-0.5"></div>}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-gray-900">Custodial Wallet</span>
                        </div>
                        <Badge
                          variant={transferCapabilities.canTransferCustodial ? "outline" : "secondary"}
                          className="text-xs"
                        >
                          {formatTokenBalance(transferCapabilities.custodialBalance, 'ckTestBTC')} ckTestBTC
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">
                        Backend proxy transfer (Canister → User on your behalf)
                      </p>
                    </div>
                  </div>
                </div>

                {/* No Funds Available */}
                {!transferCapabilities.canTransferPersonal && !transferCapabilities.canTransferCustodial && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No ckTestBTC funds available for transfer. Use the faucet or deposit funds to continue.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Info about both options being shown */}
                {transferCapabilities.canTransferPersonal && transferCapabilities.canTransferCustodial && (
                  <div className="text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-200">
                    <Info className="h-3 w-3 inline mr-1" />
                    <strong>Two methods available:</strong> Personal uses direct ledger, Custodial uses backend proxy.
                  </div>
                )}
              </div>
            </div>
          )}

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
                Amount (ckTestBTC)
              </label>
              <div className="text-xs text-gray-500">
                Balance: {formatTokenBalance(getCurrentBalance(), 'ckTestBTC')} ckTestBTC
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
              min={'0.00001'}
              max={formatTokenBalance(getCurrentBalance(), 'ckTestBTC')}
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
            <p>• Minimum send: 0.00001 ckTestBTC</p>
            <p>• Network fees will be deducted from your balance</p>
            <p>• Transactions are processed on the Internet Computer</p>
            <p>• ckTestBTC is an ICRC-2 token representing Bitcoin testnet</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting || loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={
              isSubmitting ||
              loading ||
              !recipient ||
              !amount ||
              (transferCapabilities &&
               !transferCapabilities.canTransferPersonal &&
               !transferCapabilities.canTransferCustodial)
            }
          >
            {isSubmitting || loading ? 'Sending...' : `Send ckTestBTC`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendModal;