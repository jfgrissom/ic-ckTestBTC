import React, { useState, useEffect } from 'react';
import Modal from '@/components/shared/modal';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import QRCode from '@/components/shared/qr-code';
import { Copy, CheckCircle, AlertCircle, Wallet, Bitcoin } from 'lucide-react';

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
    <Modal
      open={open}
      onOpenChange={handleClose}
      title="Deposit TestBTC"
      description="Send TestBTC to this address to deposit ckTestBTC to your wallet."
      size="sm"
    >
      <div className="space-y-4 w-full">
        {/* Deposit Capability Status */}
        {depositCapabilities && (
          <div className="p-2 bg-gray-50 rounded-lg border">
            <div className="flex items-center space-x-1.5 mb-2">
              <Bitcoin className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-gray-700">Deposit Options</span>
            </div>

            <div className="space-y-1.5">
              {/* Personal to Custodial Deposit */}
              {depositCapabilities.canDepositFromPersonal && (
                <div className="bg-white rounded border p-1.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-1.5">
                      <Wallet className="h-4 w-4 text-blue-600 shrink-0" />
                      <span className="text-xs">Personal → Custodial</span>
                    </div>
                    <Badge variant="outline" className="text-blue-600 text-xs shrink-0">
                      {depositCapabilities.personalBalance} ckTestBTC
                    </Badge>
                  </div>
                  {depositCapabilities.requiresSubaccountCreation && (
                    <div className="flex justify-end">
                      <Badge variant="secondary" className="text-xs">
                        Creates Account
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              {/* Bitcoin Testnet Deposit */}
              <div className="bg-white rounded border p-1.5 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1.5">
                    <Bitcoin className="h-4 w-4 text-orange-600 shrink-0" />
                    <span className="text-xs">Bitcoin Testnet → Custodial</span>
                  </div>
                  <Badge variant="outline" className="text-green-600 text-xs shrink-0">
                    Available
                  </Badge>
                </div>
                {depositCapabilities.requiresBtcAddressCreation && (
                  <div className="flex justify-end">
                    <Badge variant="secondary" className="text-xs">
                      Creates BTC Address
                    </Badge>
                  </div>
                )}
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

        <div className="flex flex-col items-center space-y-4 w-full">
          {(loading || addressLoading) ? (
            <div className="flex flex-col items-center space-y-4 p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-500">Generating deposit address...</p>
            </div>
          ) : address ? (
            <>
              <div className="flex justify-center w-full">
                <QRCode
                  value={address}
                  size={200}
                  className="border rounded-lg p-4"
                />
              </div>

              <div className="w-full p-3 bg-gray-50 rounded-lg border">
                <p className="text-sm font-medium text-gray-700 mb-2">TestBTC Address:</p>
                <div className="flex items-start space-x-2 min-w-0">
                  <code className="flex-1 text-xs font-mono bg-white p-2 rounded border break-all overflow-hidden min-w-0">
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

              <div className="text-xs text-gray-500 text-center space-y-1 w-full">
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
      </div>
    </Modal>
  );
};

export default DepositModal;