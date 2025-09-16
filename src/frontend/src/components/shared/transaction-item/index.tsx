import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib';

export interface Transaction {
  id: number;
  tx_type: 'Send' | 'Receive' | 'Deposit' | 'Withdraw' | 'Mint';
  token: string;
  amount: string;
  from: string;
  to: string;
  status: 'Pending' | 'Confirmed' | 'Failed';
  timestamp: number;
  block_index?: string;
}

interface TransactionItemProps {
  transaction: Transaction;
  className?: string;
  userPrincipal?: string;
}

const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  className,
  userPrincipal,
}) => {
  const formatAmount = (amount: string, token: string) => {
    const numAmount = parseFloat(amount);
    if (token === 'ckTestBTC' || token === 'ICP') {
      return (numAmount / 100000000).toFixed(8);
    }
    return amount;
  };

  const formatAddress = (address: string) => {
    if (address.length > 20) {
      return `${address.slice(0, 10)}...${address.slice(-10)}`;
    }
    return address;
  };

  const formatTimestamp = (timestamp: number) => {
    // Convert nanoseconds to milliseconds
    const date = new Date(timestamp / 1000000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Send':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Receive':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Deposit':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Withdraw':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Mint':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isOutgoing = transaction.tx_type === 'Send' || transaction.tx_type === 'Withdraw';
  const isIncoming = transaction.tx_type === 'Receive' || transaction.tx_type === 'Deposit' || transaction.tx_type === 'Mint';

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex flex-col space-y-1">
              <Badge className={getTypeColor(transaction.tx_type)}>
                {transaction.tx_type}
              </Badge>
              <Badge className={getStatusColor(transaction.status)} variant="outline">
                {transaction.status}
              </Badge>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className={`text-lg font-bold ${
                  isOutgoing ? 'text-red-600' : isIncoming ? 'text-green-600' : 'text-gray-900'
                }`}>
                  {isOutgoing ? '-' : isIncoming ? '+' : ''}
                  {formatAmount(transaction.amount, transaction.token)} {transaction.token}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {transaction.tx_type === 'Send' && (
                  <>To: {formatAddress(transaction.to)}</>
                )}
                {transaction.tx_type === 'Receive' && (
                  <>From: {formatAddress(transaction.from)}</>
                )}
                {transaction.tx_type === 'Deposit' && (
                  <>From TestBTC: {formatAddress(transaction.from)}</>
                )}
                {transaction.tx_type === 'Withdraw' && (
                  <>To TestBTC: {formatAddress(transaction.to)}</>
                )}
                {transaction.tx_type === 'Mint' && (
                  <>New Tokens Minted</>
                )}
              </div>
              <div className="text-xs text-gray-400">
                {formatTimestamp(transaction.timestamp)}
                {transaction.block_index && (
                  <> • Block: {transaction.block_index}</>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionItem;