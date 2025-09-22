import React from 'react';
import { ConnectButton, ConnectDialog } from '@connect2ic/react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Login screen component using Connect2IC v2 pattern
 * Provides multi-provider authentication UI (Internet Identity & NFID)
 */
const LoginScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center text-white p-8">
      <Card className="bg-white/20 backdrop-blur-md border-white/30 shadow-xl">
        <CardContent className="pt-6 pb-6 px-8">
          <h1 className="text-5xl font-bold mb-4 text-shadow-lg">ckTestBTC Wallet</h1>
          <p className="text-xl mb-8 opacity-90">
            Simple ckTestBTC token wallet on the Internet Computer
          </p>

          {/* Connect2IC button - handles provider selection automatically */}
          <ConnectButton />

          {/* Connect2IC dialog - shows provider options when ConnectButton is clicked */}
          <ConnectDialog />
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginScreen;