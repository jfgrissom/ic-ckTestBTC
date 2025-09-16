import React, { useState } from 'react';
import ActionButton from '@/components/shared/action-button';
import TransactionItem, { Transaction } from '@/components/shared/transaction-item';
import QRCode from '@/components/shared/qr-code';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Send,
  ArrowDownToLine,
  Copy,
  CheckCircle,
  Coins,
  ArrowUpDown,
  Clock,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib';

interface SendReceiveTabProps {
  icpBalance: string;
  ckTestBTCBalance: string;
  userPrincipal: string;
  btcAddress?: string;
  loading: boolean;
  onOpenSendModal: (token: 'ICP' | 'ckTestBTC') => void;
  onOpenReceiveModal: (token: 'ICP' | 'ckTestBTC') => void;
  recentTransactions?: Transaction[];
}

const SendReceiveTab: React.FC<SendReceiveTabProps> = ({
  icpBalance,
  ckTestBTCBalance,
  userPrincipal,
  btcAddress,
  loading,
  onOpenSendModal,
  onOpenReceiveModal,
  recentTransactions = [],
}) => {
  const [selectedToken, setSelectedToken] = useState<'ICP' | 'ckTestBTC'>('ICP');
  const [isCopied, setIsCopied] = useState(false);

  const formatBalance = (balance: string, token: string) => {
    const numBalance = parseFloat(balance);
    if (token === 'ckTestBTC' || token === 'ICP') {
      return (numBalance / 100000000).toFixed(8);
    }
    return balance;
  };

  const handleCopyPrincipal = async () => {
    try {
      await navigator.clipboard.writeText(userPrincipal);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy principal:', error);
    }
  };

  const getTokenBalance = (token: 'ICP' | 'ckTestBTC') => {
    return token === 'ICP' ? icpBalance : ckTestBTCBalance;
  };

  const getTokenColor = (token: 'ICP' | 'ckTestBTC') => {
    return token === 'ICP' ? 'text-blue-600' : 'text-orange-600';
  };

  const getTokenBgColor = (token: 'ICP' | 'ckTestBTC') => {
    return token === 'ICP' ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200';
  };

  const recentSendReceiveTransactions = recentTransactions
    .filter(tx => tx.tx_type === 'Send' || tx.tx_type === 'Receive')
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Token Balances Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={cn(selectedToken === 'ICP' && 'ring-2 ring-blue-500')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Coins className="h-5 w-5 text-blue-600" />
                <span>ICP Balance</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedToken('ICP')}
                className={cn(
                  selectedToken === 'ICP' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'
                )}
              >
                Select
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatBalance(icpBalance, 'ICP')} ICP
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Native Internet Computer token
            </p>
          </CardContent>
        </Card>

        <Card className={cn(selectedToken === 'ckTestBTC' && 'ring-2 ring-orange-500')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Coins className="h-5 w-5 text-orange-600" />
                <span>ckTestBTC Balance</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedToken('ckTestBTC')}
                className={cn(
                  selectedToken === 'ckTestBTC' ? 'bg-orange-100 text-orange-700' : 'text-gray-500'
                )}
              >
                Select
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatBalance(ckTestBTCBalance, 'ckTestBTC')} ckTestBTC
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Bitcoin TestNet backed token
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Send/Receive Actions */}
      <Tabs defaultValue="send" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="send" className="flex items-center space-x-2">
            <Send className="h-4 w-4" />
            <span>Send</span>
          </TabsTrigger>
          <TabsTrigger value="receive" className="flex items-center space-x-2">
            <ArrowDownToLine className="h-4 w-4" />
            <span>Receive</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-4">
          <Card className={getTokenBgColor(selectedToken)}>
            <CardHeader>
              <CardTitle className={cn("flex items-center space-x-2", getTokenColor(selectedToken))}>
                <Send className="h-5 w-5" />
                <span>Send {selectedToken}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-3">
                <div>
                  <div className={cn("text-3xl font-bold", getTokenColor(selectedToken))}>
                    {formatBalance(getTokenBalance(selectedToken), selectedToken)} {selectedToken}
                  </div>
                  <p className="text-sm text-gray-600">Available to send</p>
                </div>

                <div className="bg-white/60 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Transaction Fee:</span>
                    <span className="font-medium">
                      {selectedToken === 'ICP' ? '0.0001 ICP' : '0.00001 ckTestBTC'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Network:</span>
                    <span className="font-medium">Internet Computer</span>
                  </div>
                </div>

                <Button
                  onClick={() => onOpenSendModal(selectedToken)}
                  className="w-full"
                  size="lg"
                  disabled={parseFloat(getTokenBalance(selectedToken)) === 0 || loading}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send {selectedToken}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receive" className="space-y-4">
          <Card className={getTokenBgColor(selectedToken)}>
            <CardHeader>
              <CardTitle className={cn("flex items-center space-x-2", getTokenColor(selectedToken))}>
                <ArrowDownToLine className="h-5 w-5" />
                <span>Receive {selectedToken}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-4">
                <QRCode value={userPrincipal} size={200} />
                <p className="text-xs text-gray-500">
                  Scan QR code or share your Principal ID below
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Your Principal ID (for {selectedToken}):
                </label>
                <div className="flex items-center space-x-2">
                  <Input
                    value={userPrincipal}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={handleCopyPrincipal}
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

              <div className="bg-white/60 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Network:</span>
                  <span className="font-medium">Internet Computer</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Token Standard:</span>
                  <span className="font-medium">
                    {selectedToken === 'ICP' ? 'ICRC-1' : 'ICRC-2'}
                  </span>
                </div>
              </div>

              <Button
                onClick={() => onOpenReceiveModal(selectedToken)}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <ArrowDownToLine className="h-4 w-4 mr-2" />
                View Receive Details
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator />

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Recent Send/Receive Transactions</span>
            </div>
            <Badge variant="outline" className="text-xs">
              Last 5
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              <span className="text-gray-600">Loading transactions...</span>
            </div>
          ) : recentSendReceiveTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentSendReceiveTransactions.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  userPrincipal={userPrincipal}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No recent send/receive transactions</p>
              <p className="text-sm mt-1">
                Your transaction history will appear here once you start sending or receiving tokens
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ActionButton
              onClick={() => onOpenSendModal('ICP')}
              variant="outline"
              className="flex-col h-20 space-y-1"
              icon={<Send className="h-5 w-5" />}
              disabled={parseFloat(icpBalance) === 0 || loading}
            >
              <span className="text-xs">Send ICP</span>
            </ActionButton>

            <ActionButton
              onClick={() => onOpenReceiveModal('ICP')}
              variant="outline"
              className="flex-col h-20 space-y-1"
              icon={<ArrowDownToLine className="h-5 w-5" />}
            >
              <span className="text-xs">Receive ICP</span>
            </ActionButton>

            <ActionButton
              onClick={() => onOpenSendModal('ckTestBTC')}
              variant="outline"
              className="flex-col h-20 space-y-1"
              icon={<Send className="h-5 w-5" />}
              disabled={parseFloat(ckTestBTCBalance) === 0 || loading}
            >
              <span className="text-xs">Send ckTestBTC</span>
            </ActionButton>

            <ActionButton
              onClick={() => onOpenReceiveModal('ckTestBTC')}
              variant="outline"
              className="flex-col h-20 space-y-1"
              icon={<ArrowDownToLine className="h-5 w-5" />}
            >
              <span className="text-xs">Receive ckTestBTC</span>
            </ActionButton>
          </div>
        </CardContent>
      </Card>

      {/* Information Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-gray-600 space-y-2">
            <h4 className="font-medium text-gray-800">Transfer Information</h4>
            <p>
              • <strong>Network:</strong> All transfers happen on the Internet Computer
            </p>
            <p>
              • <strong>Speed:</strong> Transactions are typically confirmed within seconds
            </p>
            <p>
              • <strong>Fees:</strong> Low fixed fees for all token transfers
            </p>
            <p>
              • <strong>Principal ID:</strong> Your unique identifier for receiving tokens
            </p>
            <p>
              • <strong>Reversibility:</strong> IC transactions are irreversible once confirmed
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SendReceiveTab;