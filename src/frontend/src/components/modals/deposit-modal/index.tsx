import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import QRCode from '@/components/shared/qr-code';
import { Copy, CheckCircle, AlertCircle, Wallet, Building2, Bitcoin } from 'lucide-react';

interface DepositCapabilities {
  canDepositFromCustodial: boolean;
  canDepositFromPersonal: boolean;
  canCreateBtcAccount: boolean;
  canDeposit: boolean;
  personalBalance: string;
  custodialBalance: string;
  requiresSubaccountCreation: boolean;
  requiresBtcAddressCreation: boolean;
}

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGetDepositAddress?: () => Promise<string>;
  depositAddress?: string;
  loading?: boolean;
  // Matrix-aware capabilities
  depositCapabilities?: DepositCapabilities;
  onDepositToCustody?: (amount: string) => Promise<void>;
}

const DepositModal: React.FC<DepositModalProps> = ({
  open,
  onOpenChange,
  onGetDepositAddress,
  depositAddress = '',
  loading = false,
  depositCapabilities,
}) => {
  const [address, setAddress] = useState(depositAddress);
  const [copied, setCopied] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);

  useEffect(() => {
    if (open && !address && onGetDepositAddress) {
      setAddressLoading(true);
      onGetDepositAddress()
        .then(setAddress)
        .catch(console.error)
        .finally(() => setAddressLoading(false));
    }
  }, [open, address, onGetDepositAddress]);

  const copyToClipboard = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setAddress('');
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deposit TestBTC</DialogTitle>
          <DialogDescription>
            Send TestBTC to this address to deposit ckTestBTC to your wallet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Deposit Capability Status */}
          {depositCapabilities && (
            <div className="p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center space-x-2 mb-3">
                <Bitcoin className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-gray-700">Deposit Options</span>
              </div>

              <div className="space-y-2">
                {/* Personal to Custodial Deposit */}
                {depositCapabilities.canDepositFromPersonal && (
                  <div className="flex items-center justify-between p-2 bg-white rounded border">
                    <div className="flex items-center space-x-2">
                      <Wallet className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Personal → Custodial</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-blue-600">
                        {depositCapabilities.personalBalance} ckTestBTC
                      </Badge>
                      {depositCapabilities.requiresSubaccountCreation && (
                        <Badge variant="secondary" className="text-xs">
                          Creates Account
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Bitcoin Testnet Deposit */}
                <div className="flex items-center justify-between p-2 bg-white rounded border">
                  <div className="flex items-center space-x-2">
                    <Bitcoin className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">Bitcoin Testnet → Custodial</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {depositCapabilities.requiresBtcAddressCreation && (
                      <Badge variant="secondary" className="text-xs">
                        Creates BTC Address
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-green-600">
                      Available
                    </Badge>
                  </div>
                </div>

                {/* No deposit options */}
                {!depositCapabilities.canDeposit && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      No deposit options available. Use the faucet to get test tokens first.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center space-y-4">
          {(loading || addressLoading) ? (
            <div className="flex flex-col items-center space-y-4 p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-500">Generating deposit address...</p>
            </div>
          ) : address ? (
            <>
              <QRCode
                value={address}
                size={200}
                className="border rounded-lg p-4"
              />

              <div className="w-full p-3 bg-gray-50 rounded-lg border">
                <p className="text-sm font-medium text-gray-700 mb-2">TestBTC Address:</p>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 text-xs font-mono bg-white p-2 rounded border break-all">
                    {address}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="shrink-0"
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="text-xs text-gray-500 text-center space-y-1">
                <p>• Only send TestBTC to this address</p>
                <p>• Minimum deposit: 0.00001 TestBTC</p>
                <p>• It may take several confirmations to appear in your balance</p>
              </div>
            </>
          ) : (
            <div className="text-center p-8">
              <p className="text-red-500">Failed to generate deposit address</p>
              <Button
                variant="outline"
                onClick={() => onGetDepositAddress?.()}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DepositModal;