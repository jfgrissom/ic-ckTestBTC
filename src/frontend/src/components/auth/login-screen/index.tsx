import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Login screen component using @dfinity/auth-client
 * Provides Internet Identity authentication UI
 */
const LoginScreen: React.FC = () => {
  const { login, isLoading, error } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center text-white p-8">
      <Card className="bg-white/20 backdrop-blur-md border-white/30 shadow-xl">
        <CardContent className="pt-6 pb-6 px-8">
          <h1 className="text-5xl font-bold mb-4 text-shadow-lg">ckTestBTC Wallet</h1>
          <p className="text-xl mb-8 opacity-90">
            Simple ckTestBTC token wallet on the Internet Computer
          </p>

          {/* Login Button */}
          <Button
            onClick={login}
            disabled={isLoading}
            size="lg"
            className="bg-white text-purple-700 hover:bg-white/90 font-semibold px-8 py-3"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-700"></span>
                Connecting...
              </span>
            ) : (
              'Login with Internet Identity'
            )}
          </Button>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/40 rounded-lg">
              <p className="text-sm text-white">{error}</p>
            </div>
          )}

          {/* Information Text */}
          <p className="mt-6 text-sm opacity-75">
            Connect with Internet Identity to access your wallet
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginScreen;