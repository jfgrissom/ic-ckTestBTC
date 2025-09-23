import React from 'react';
import { getNetworkConfig } from '@/types/backend.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Coins, ArrowDown, Info } from 'lucide-react';
import { WalletStatus } from '@/services/wallet.service';
import { calculateMaxAvailable, TokenType } from '@/lib';

interface BalanceSectionProps {
  walletStatus?: WalletStatus;
  loading: boolean;
  error?: string | null;
  initialized?: boolean;
  onRefreshBalance: () => void;
  onFaucet?: () => void;
  onDepositToCustody?: (amount: string) => void;
  showFaucet?: boolean;
}

const BalanceSection: React.FC<BalanceSectionProps> = ({
  walletStatus,
  loading,
  error,
  initialized,
  onRefreshBalance,
  onFaucet,
  onDepositToCustody,
  showFaucet = getNetworkConfig().network === 'local',
}) => {
  const handleDepositMax = () => {
    if (walletStatus?.personalBalance && onDepositToCustody) {
      // Convert personal balance to smallest units for calculation
      const personalBalanceInSatoshis = Math.floor(parseFloat(walletStatus.personalBalance) * 100000000).toString();

      // Calculate maximum available amount (balance - fees)
      const maxAvailableAmount = calculateMaxAvailable(
        personalBalanceInSatoshis,
        'ckTestBTC' as TokenType,
        'TRANSFER'
      );

      onDepositToCustody(maxAvailableAmount);
    }
  };

  return (
    <Card className="bg-white/95 backdrop-blur-md shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-xl text-gray-800">Custodial Wallet Balance</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Primary Balance Display */}
        <div className="text-center mb-6">
          <div className="text-4xl font-bold text-purple-600 mb-2">
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="w-8 h-8 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-3">
                <div className="text-red-500 text-lg font-medium">Failed to load balance</div>
                <Button onClick={onRefreshBalance} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>{walletStatus?.custodialBalance || '0.00000000'}</span>
                <Badge variant="secondary" className="text-sm font-medium">
                  ckTestBTC
                </Badge>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600">
            {error ? `Error: ${error}` : 'Available in custodial wallet'}
          </p>
        </div>

        {/* Initialization Error Alert */}
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <Info className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="flex flex-col gap-2">
                <div>
                  <strong>Initialization Error:</strong> {error}
                </div>
                <Button
                  size="sm"
                  onClick={onRefreshBalance}
                  variant="outline"
                  className="self-start border-red-300 text-red-700 hover:bg-red-100"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Personal Balance Alert */}
        {walletStatus?.canDeposit && (
          <Alert className="mb-4 border-orange-200 bg-orange-50">
            <Info className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="flex flex-col gap-2">
                <div>
                  You have <strong>{walletStatus.personalBalance} ckTestBTC</strong> in your personal account
                  that is not in your custodial wallet.
                </div>
                <Button
                  size="sm"
                  onClick={handleDepositMax}
                  className="self-start bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <ArrowDown className="w-4 h-4 mr-2" />
                  Deposit to Wallet
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Balance Breakdown */}
        {walletStatus && !loading && (
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-purple-700 font-medium">In Custody</div>
              <div className="text-purple-900 font-semibold">{walletStatus.custodialBalance}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-gray-600 font-medium">Personal</div>
              <div className="text-gray-800 font-semibold">{walletStatus.personalBalance}</div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col md:flex-row gap-3 justify-center">
            <Button
              onClick={onRefreshBalance}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2 hover:bg-purple-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Balance
            </Button>

            {showFaucet && onFaucet && (
              <Button
                onClick={onFaucet}
                disabled={loading}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <Coins className="w-4 h-4" />
                Get Test Tokens (Faucet)
              </Button>
            )}
          </div>

          {/* Show faucet note when balances are zero */}
          {walletStatus &&
           walletStatus.custodialBalance === '0.00000000' &&
           walletStatus.personalBalance === '0.00000000' &&
           showFaucet && (
            <div className="text-center text-sm text-gray-600 mt-2">
              Use the faucet to get test tokens, then they will appear in your personal balance.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BalanceSection;