import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, formatTokenBalance } from '@/lib';

export interface TokenBalanceProps {
  token: 'ICP' | 'ckTestBTC';
  balance: string;
  loading?: boolean;
  className?: string;
  onRefresh?: () => void;
}

const TokenBalance: React.FC<TokenBalanceProps> = ({
  token,
  balance,
  loading = false,
  className,
  onRefresh,
}) => {

  const getTokenColor = (token: string) => {
    switch (token) {
      case 'ICP':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ckTestBTC':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Badge className={getTokenColor(token)}>
              {token}
            </Badge>
            <div>
              <div className="text-2xl font-bold">
                {formatTokenBalance(balance, token, loading)}
              </div>
              <div className="text-sm text-gray-500">
                {token} Balance
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
              <svg
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TokenBalance;