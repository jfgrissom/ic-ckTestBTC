import React, { useState } from 'react';
import ActionButton from '@/components/shared/action-button';
import TransactionItem from '@/components/shared/transaction-item';
import QRCode from '@/components/shared/qr-code';
import TokenBalance from '@/components/shared/token-balance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Send,
  ArrowDownToLine,
  Copy,
  CheckCircle,
  Clock,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { useWalletBalance, useWalletState, useTransactions, useWalletActions } from '@/contexts/wallet-context/hooks';
import { useModals } from '@/hooks/use-modals';

const SendReceiveTab: React.FC = () => {
  const { totalAvailable, loading } = useWalletBalance();
  const { principal } = useWalletState();
  const { getRecent } = useTransactions();
  const { refreshWallet } = useWalletActions();
  const { openModal } = useModals();
  const recentTransactions = getRecent(5);

  const [isCopied, setIsCopied] = useState(false);

  const handleCopyPrincipal = async () => {
    if (!principal) return;
    try {
      await navigator.clipboard.writeText(principal);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy principal:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Balance Overview */}
      <TokenBalance
        token="ckTestBTC"
        balance={totalAvailable}
        title="Available Balance"
        description="Ready to send or receive"
        loading={loading}
        onRefresh={refreshWallet}
      />

      {/* Send & Receive Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span>Send & Receive</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="send" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="send">Send</TabsTrigger>
              <TabsTrigger value="receive">Receive</TabsTrigger>
            </TabsList>

            <TabsContent value="send" className="space-y-4 mt-6">
              <div className="space-y-4">
                <TokenBalance
                  token="ckTestBTC"
                  balance={totalAvailable}
                  description="Available to send"
                  loading={loading}
                  onRefresh={refreshWallet}
                  showBadge={false}
                />

                <div className="grid grid-cols-1 gap-4">
                  <ActionButton
                    onClick={() => openModal('send')}
                    variant="outline"
                    className="flex-col h-20 space-y-1"
                    icon={<Send className="h-5 w-5" />}
                  >
                    <span className="text-xs">Send ckTestBTC</span>
                  </ActionButton>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="receive" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Your Principal ID</h3>
                  <p className="text-sm text-gray-600">
                    Share this address to receive ckTestBTC tokens
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Input
                    value={principal || 'Not connected'}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyPrincipal}
                    disabled={!principal}
                    className="shrink-0"
                  >
                    {isCopied ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {principal && (
                  <div className="mt-4">
                    <QRCode value={principal} size={200} />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  <ActionButton
                    onClick={() => openModal('receive')}
                    variant="outline"
                    className="flex-col h-20 space-y-1"
                    icon={<ArrowDownToLine className="h-5 w-5" />}
                  >
                    <span className="text-xs">Receive ckTestBTC</span>
                  </ActionButton>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-gray-600" />
            <span>Recent Transactions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              <span>Loading transactions...</span>
            </div>
          ) : recentTransactions.length > 0 ? (
            <div className="space-y-2">
              {recentTransactions.map((transaction, index) => (
                <TransactionItem key={index} transaction={transaction} />
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No transactions yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SendReceiveTab;