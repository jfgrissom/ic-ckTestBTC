import React, { useState } from 'react';
import { ReceiveSectionProps } from '../../types/wallet.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ForwardRefButton } from '@/components/common/ForwardRefButton';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Download, Copy, Bitcoin, User, Check } from 'lucide-react';

const ReceiveSection: React.FC<ReceiveSectionProps> = ({
  btcAddress,
  principal,
  onCopyBtcAddress,
  onCopyPrincipal,
}) => {
  const [copiedBtc, setCopiedBtc] = useState(false);
  const [copiedPrincipal, setCopiedPrincipal] = useState(false);

  const handleCopyBtc = () => {
    onCopyBtcAddress();
    setCopiedBtc(true);
    setTimeout(() => setCopiedBtc(false), 2000);
  };

  const handleCopyPrincipal = () => {
    onCopyPrincipal();
    setCopiedPrincipal(true);
    setTimeout(() => setCopiedPrincipal(false), 2000);
  };

  return (
    <Card className="bg-white/95 backdrop-blur-md shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
          <Download className="w-5 h-5" />
          Receive ckTestBTC
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Bitcoin Testnet Address */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Bitcoin className="w-5 h-5 text-orange-500" />
              <span className="font-semibold text-gray-800">Bitcoin Testnet Address</span>
              <Badge variant="outline" className="text-xs">
                BTC → ckTestBTC
              </Badge>
            </div>

            <div className="flex flex-col md:flex-row items-stretch gap-3 p-4 bg-gray-50 rounded-lg border">
              <div className="flex-1 font-mono text-sm text-gray-800 break-all">
                {btcAddress || (
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
                    Loading...
                  </div>
                )}
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ForwardRefButton
                      onClick={handleCopyBtc}
                      disabled={!btcAddress}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2 shrink-0"
                    >
                      {copiedBtc ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </ForwardRefButton>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy Bitcoin testnet address</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <p className="text-sm text-gray-600">
              Send testnet BTC to this address to receive ckTestBTC tokens
            </p>
          </div>

          {/* Principal ID */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-gray-800">IC Principal ID</span>
              <Badge variant="outline" className="text-xs">
                Direct Transfer
              </Badge>
            </div>

            <div className="flex flex-col md:flex-row items-stretch gap-3 p-4 bg-gray-50 rounded-lg border">
              <div className="flex-1 font-mono text-sm text-gray-800 break-all">
                {principal}
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ForwardRefButton
                      onClick={handleCopyPrincipal}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2 shrink-0"
                    >
                      {copiedPrincipal ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </ForwardRefButton>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy Principal ID</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <p className="text-sm text-gray-600">
              Use this for direct ckTestBTC transfers within the Internet Computer
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReceiveSection;