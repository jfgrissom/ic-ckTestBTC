import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, formatTokenBalance } from '@/lib';
import { Coins, RefreshCw } from 'lucide-react';

export interface TokenBalanceProps {
  token: 'ckTestBTC';
  balance: string;
  title?: string;
  description?: string;
  loading?: boolean;
  className?: string;
  onRefresh?: () => void;
  showBadge?: boolean;
}

const TokenBalance: React.FC<TokenBalanceProps> = ({
  token,
  balance,
  title,
  description,
  loading = false,
  className,
  onRefresh,
  showBadge = true,
}) => {

  const getTokenColor = () => {
    return 'bg-orange-100 text-orange-800 border-orange-200';
  };

  // If title is provided, use header layout; otherwise use compact layout
  if (title) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Coins className="h-5 w-5 text-orange-600" />
              <span>{title}</span>
            </div>
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={loading}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Refresh balance"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {formatTokenBalance(balance, token, loading)} {token}
          </div>
          {description && (
            <p className="text-sm text-gray-600 mt-1">
              {description}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Compact layout for inline usage
  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {showBadge && (
              <Badge className={getTokenColor()}>
                {token}
              </Badge>
            )}
            <div>
              <div className="text-2xl font-bold">
                {formatTokenBalance(balance, token, loading)}
              </div>
              <div className="text-sm text-gray-500">
                {description || `${token} Balance`}
              </div>
            </div>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Refresh balance"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TokenBalance;