import React from 'react';
import { SendSectionProps } from '@/types/wallet.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';

const SendSection: React.FC<SendSectionProps> = ({
  sendAmount,
  sendTo,
  loading,
  onSendAmountChange,
  onSendToChange,
  onSend,
}) => {
  const isFormValid = !loading && sendAmount && sendTo && Number(sendAmount) > 0;

  return (
    <Card className="bg-white/95 backdrop-blur-md shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
          <Send className="w-5 h-5" />
          Send ckTestBTC
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Recipient Principal ID
            </label>
            <Input
              type="text"
              placeholder="Enter recipient's Principal ID"
              value={sendTo}
              onChange={(e) => onSendToChange(e.target.value)}
              disabled={loading}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Amount (ckTestBTC)
            </label>
            <Input
              type="number"
              placeholder="0.00000000"
              step="0.00000001"
              value={sendAmount}
              onChange={(e) => onSendAmountChange(e.target.value)}
              disabled={loading}
              className="text-right"
            />
          </div>

          <Button
            onClick={onSend}
            disabled={!isFormValid}
            className="w-full bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Transaction
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SendSection;