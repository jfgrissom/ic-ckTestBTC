import React from 'react';
import { BalanceSectionProps } from '../../types/wallet.types';
import { getNetworkConfig } from '../../types/backend.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Coins } from 'lucide-react';

const BalanceSection: React.FC<BalanceSectionProps> = ({
  balance,
  loading,
  onRefreshBalance,
  onFaucet,
  showFaucet = getNetworkConfig().network === 'local',
}) => {
  return (
    <Card className="bg-white/95 backdrop-blur-md shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-xl text-gray-800">Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-6">
          <div className="text-4xl font-bold text-purple-600 mb-2">
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="w-8 h-8 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>{balance}</span>
                <Badge variant="secondary" className="text-sm font-medium">
                  ckTestBTC
                </Badge>
              </div>
            )}
          </div>
        </div>

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
      </CardContent>
    </Card>
  );
};

export default BalanceSection;