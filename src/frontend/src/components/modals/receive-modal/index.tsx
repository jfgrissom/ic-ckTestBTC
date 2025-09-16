import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import QRCode from '@/components/shared/qr-code';
import { Copy, CheckCircle, Info } from 'lucide-react';

interface ReceiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userPrincipal?: string;
  btcAddress?: string;
}

const ReceiveModal: React.FC<ReceiveModalProps> = ({
  open,
  onOpenChange,
  userPrincipal = '',
  btcAddress = '',
}) => {
  const [selectedToken, setSelectedToken] = useState<'ICP' | 'ckTestBTC'>('ckTestBTC');
  const [copied, setCopied] = useState(false);

  const getReceiveAddress = () => {
    if (selectedToken === 'ICP') {
      return userPrincipal;
    } else {
      // For ckTestBTC, we use the Bitcoin address if available, otherwise the Principal
      return btcAddress || userPrincipal;
    }
  };

  const copyToClipboard = async () => {
    const address = getReceiveAddress();
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setSelectedToken('ckTestBTC');
    setCopied(false);
    onOpenChange(false);
  };

  const getInstructions = () => {
    if (selectedToken === 'ICP') {
      return {
        title: 'Receive ICP Tokens',
        description: 'Share your Principal ID to receive ICP tokens on the Internet Computer.',
        addressLabel: 'Your Principal ID:',
        steps: [
          'Share your Principal ID with the sender',
          'They can send ICP tokens directly to this Principal ID',
          'Transactions are processed on the Internet Computer',
          'ICP tokens will appear in your wallet balance'
        ],
        warnings: [
          'Only share this Principal ID for ICP token transfers',
          'Do not send other types of tokens to this address',
          'Make sure the sender is using the Internet Computer network'
        ]
      };
    } else {
      return {
        title: 'Receive ckTestBTC Tokens',
        description: btcAddress
          ? 'You can receive ckTestBTC in two ways: via Bitcoin testnet or directly as ICRC tokens.'
          : 'Share your Principal ID to receive ckTestBTC tokens on the Internet Computer.',
        addressLabel: btcAddress ? 'Bitcoin Testnet Address:' : 'Your Principal ID:',
        steps: btcAddress ? [
          'For Bitcoin testnet: Send TestBTC to the Bitcoin address above',
          'For direct transfer: Share your Principal ID for ICRC ckTestBTC transfers',
          'Bitcoin deposits will be converted to ckTestBTC automatically',
          'Direct ICRC transfers appear immediately in your balance'
        ] : [
          'Share your Principal ID with the sender',
          'They can send ckTestBTC tokens directly to this Principal ID',
          'Transactions are processed on the Internet Computer',
          'ckTestBTC tokens will appear in your wallet balance'
        ],
        warnings: btcAddress ? [
          'Only send TestBTC (not mainnet Bitcoin) to the Bitcoin address',
          'Bitcoin deposits may take several confirmations to appear',
          'For instant transfers, use ICRC ckTestBTC with your Principal ID',
          'Minimum Bitcoin deposit: 0.00001 TestBTC'
        ] : [
          'Only ckTestBTC tokens can be sent to this Principal ID',
          'Make sure the sender is using the Internet Computer network',
          'For Bitcoin deposits, use the Deposit function instead'
        ]
      };
    }
  };

  const instructions = getInstructions();
  const receiveAddress = getReceiveAddress();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Receive {selectedToken}</DialogTitle>
          <DialogDescription>
            {instructions.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Token Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Select Token to Receive
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={selectedToken === 'ckTestBTC' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedToken('ckTestBTC')}
                className="justify-center"
              >
                <span className="flex items-center">
                  <Badge variant="secondary" className="mr-2">
                    ckTestBTC
                  </Badge>
                  <span className="truncate">Testnet Bitcoin</span>
                </span>
              </Button>
              <Button
                variant={selectedToken === 'ICP' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedToken('ICP')}
                className="justify-center"
              >
                <span className="flex items-center">
                  <Badge variant="secondary" className="mr-2">
                    ICP
                  </Badge>
                  <span className="truncate">Internet Computer</span>
                </span>
              </Button>
            </div>
          </div>

          {/* Address Display */}
          {receiveAddress ? (
            <>
              {/* QR Code */}
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg border inline-block">
                  <QRCode
                    value={receiveAddress}
                    size={200}
                  />
                </div>
              </div>

              {/* Address */}
              <div className="w-full">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  {instructions.addressLabel}
                </p>
                <div className="flex items-start gap-2 bg-gray-50 p-3 rounded-lg border">
                  <code className="flex-1 text-xs font-mono break-all leading-relaxed">
                    {receiveAddress}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyToClipboard}
                    className="shrink-0 h-8 w-8"
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Special ckTestBTC dual address info */}
              {selectedToken === 'ckTestBTC' && btcAddress && userPrincipal && (
                <Alert>
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <AlertDescription className="text-xs">
                    <strong>Alternative:</strong> Your Principal ID for direct ICRC ckTestBTC transfers:
                    <code className="block text-xs font-mono bg-gray-100 px-2 py-1 rounded mt-1 break-all">
                      {userPrincipal}
                    </code>
                  </AlertDescription>
                </Alert>
              )}

              {/* Instructions */}
              <div className="space-y-3">
                <div className="text-xs text-gray-700 space-y-1">
                  <p className="font-medium">How to receive {selectedToken}:</p>
                  {instructions.steps.map((step, index) => (
                    <p key={index} className="pl-3">• {step}</p>
                  ))}
                </div>

                <div className="text-xs text-yellow-700 bg-yellow-50 p-3 rounded-lg space-y-1">
                  <p className="font-medium">Important notes:</p>
                  {instructions.warnings.map((warning, index) => (
                    <p key={index} className="pl-3">• {warning}</p>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center p-8">
              <p className="text-gray-500">
                {selectedToken === 'ICP'
                  ? 'Principal ID not available'
                  : 'Address not available'}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Please ensure you are logged in to view your receive address
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiveModal;