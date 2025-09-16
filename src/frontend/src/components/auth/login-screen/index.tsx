import React from 'react';
import { LoginScreenProps } from '@/types/auth.types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, loading, authClient }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center text-white p-8">
      <Card className="bg-white/20 backdrop-blur-md border-white/30 shadow-xl">
        <CardContent className="pt-6 pb-6 px-8">
          <h1 className="text-5xl font-bold mb-4 text-shadow-lg">ckTestBTC Wallet</h1>
          <p className="text-xl mb-8 opacity-90">
            Simple ckTestBTC token wallet on the Internet Computer
          </p>
          <Button
            onClick={onLogin}
            disabled={!authClient || loading}
            size="lg"
            className="bg-white/20 hover:bg-white/30 border-2 border-white/30 hover:border-white/40 backdrop-blur-sm text-white hover:text-white transition-all duration-300 hover:-translate-y-1"
          >
            {loading ? 'Signing in...' : 'Sign in with Internet Identity'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginScreen;