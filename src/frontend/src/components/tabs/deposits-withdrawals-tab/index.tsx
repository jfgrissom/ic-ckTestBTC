import React, { useState } from 'react';
import ActionButton from '@/components/shared/action-button';
import QRCode from '@/components/shared/qr-code';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Download,
  Upload,
  Copy,
  ExternalLink,
  Coins,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib';

interface DepositsWithdrawalsTabProps {
  loading: boolean;
  balance: string;
  depositAddress?: string;
  onGetDepositAddress: () => Promise<string>;
  onFaucet: () => Promise<void>;
  onOpenDepositModal: () => void;
  onOpenWithdrawModal: () => void;
  isLocalDev?: boolean;
}

const DepositsWithdrawalsTab: React.FC<DepositsWithdrawalsTabProps> = ({
  loading,
  balance,
  depositAddress,
  onGetDepositAddress,
  onFaucet,
  onOpenDepositModal,
  onOpenWithdrawModal,
  isLocalDev = false,
}) => {
  const [isGettingAddress, setIsGettingAddress] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [faucetLoading, setFaucetLoading] = useState(false);

  const handleGetDepositAddress = async () => {
    setIsGettingAddress(true);
    try {
      await onGetDepositAddress();
    } catch (error) {
      console.error('Error getting deposit address:', error);
    } finally {
      setIsGettingAddress(false);
    }
  };

  const handleCopyAddress = async () => {
    if (depositAddress) {
      try {
        await navigator.clipboard.writeText(depositAddress);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy address:', error);
      }
    }
  };

  const handleFaucet = async () => {
    setFaucetLoading(true);
    try {
      await onFaucet();
    } catch (error) {
      console.error('Error getting test tokens:', error);
    } finally {
      setFaucetLoading(false);
    }
  };

  const formatBalance = (balance: string) => {
    // Balance is already formatted by the service layer
    const numBalance = parseFloat(balance);
    return numBalance.toFixed(8);
  };

  return (
    <div className="space-y-6">
      {/* Current Balance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Coins className="h-5 w-5 text-orange-600" />
            <span>ckTestBTC Balance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-orange-600">
            {formatBalance(balance)} ckTestBTC
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Backed 1:1 by Bitcoin TestNet (Testnet Bitcoin)
          </p>
        </CardContent>
      </Card>

      {/* Faucet Section (Local Dev Only) */}
      {isLocalDev && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-700">
              <Coins className="h-5 w-5" />
              <span>Development Faucet</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-green-700">
              Get free ckTestBTC tokens for testing purposes (local development only)
            </p>
            <Button
              onClick={handleFaucet}
              disabled={faucetLoading}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {faucetLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Getting Test Tokens...
                </>
              ) : (
                <>
                  <Coins className="h-4 w-4 mr-2" />
                  Get Test Tokens
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Deposit Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5 text-blue-600" />
            <span>Deposit Bitcoin TestNet</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">How Deposits Work</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Send Bitcoin TestNet to your deposit address below. It will be automatically
                  converted to ckTestBTC tokens in your wallet.
                </p>
              </div>
            </div>
          </div>

          {!depositAddress ? (
            <div className="text-center space-y-4">
              <p className="text-gray-600">Get your unique Bitcoin TestNet deposit address</p>
              <Button
                onClick={handleGetDepositAddress}
                disabled={isGettingAddress}
                variant="outline"
                size="lg"
              >
                {isGettingAddress ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Getting Address...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Get Deposit Address
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <QRCode value={depositAddress} size={200} />
                <p className="text-xs text-gray-500 mt-2">
                  Scan QR code or copy address below
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Your Bitcoin TestNet Deposit Address:
                </label>
                <div className="flex items-center space-x-2">
                  <Input
                    value={depositAddress}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={handleCopyAddress}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "shrink-0",
                      isCopied && "text-green-600 border-green-600"
                    )}
                  >
                    {isCopied ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900">Processing Time</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Deposits typically take 10-30 minutes to process after 1 Bitcoin TestNet confirmation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4">
            <Button
              onClick={onOpenDepositModal}
              variant="default"
              className="w-full"
              size="lg"
            >
              <Download className="h-4 w-4 mr-2" />
              View Deposit Details
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Withdraw Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5 text-purple-600" />
            <span>Withdraw to Bitcoin TestNet</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-purple-900">How Withdrawals Work</h4>
                <p className="text-sm text-purple-700 mt-1">
                  Convert your ckTestBTC tokens back to Bitcoin TestNet. Specify a destination
                  address and amount to withdraw.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-lg font-semibold text-gray-900">
                  {formatBalance(balance)}
                </div>
                <div className="text-sm text-gray-500">Available to Withdraw</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-lg font-semibold text-gray-900">
                  ~0.00001
                </div>
                <div className="text-sm text-gray-500">Network Fee (BTC)</div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900">Processing Time</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Withdrawals are processed in batches and may take 30-60 minutes to complete.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button
              onClick={onOpenWithdrawModal}
              variant="default"
              className="w-full"
              size="lg"
              disabled={parseFloat(balance) === 0}
            >
              <Upload className="h-4 w-4 mr-2" />
              Withdraw ckTestBTC
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ActionButton
              onClick={onOpenDepositModal}
              variant="outline"
              className="flex-col h-24 space-y-2"
              icon={<Download className="h-6 w-6" />}
            >
              <span className="font-medium">Deposit</span>
              <span className="text-xs text-gray-500">Bitcoin TestNet → ckTestBTC</span>
            </ActionButton>

            <ActionButton
              onClick={onOpenWithdrawModal}
              variant="outline"
              className="flex-col h-24 space-y-2"
              icon={<Upload className="h-6 w-6" />}
              disabled={parseFloat(balance) === 0}
            >
              <span className="font-medium">Withdraw</span>
              <span className="text-xs text-gray-500">ckTestBTC → Bitcoin TestNet</span>
            </ActionButton>
          </div>
        </CardContent>
      </Card>

      {/* Information Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-gray-600 space-y-2">
            <h4 className="font-medium text-gray-800">Important Information</h4>
            <p>
              • <strong>Minimum Deposit:</strong> 0.0001 Bitcoin TestNet
            </p>
            <p>
              • <strong>Minimum Withdrawal:</strong> 0.0001 ckTestBTC
            </p>
            <p>
              • <strong>Network:</strong> Bitcoin TestNet only (not mainnet)
            </p>
            <p>
              • <strong>Confirmations:</strong> 1 Bitcoin TestNet confirmation required
            </p>
            <p>
              • <strong>Fees:</strong> Network fees apply for Bitcoin TestNet transactions
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DepositsWithdrawalsTab;