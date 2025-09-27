import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * User header component using @dfinity/auth-client
 * Displays user principal and provides logout functionality
 */
const UserHeader: React.FC = () => {
  const { principal, logout } = useAuth();

  return (
    <Card className="bg-white/95 backdrop-blur-md shadow-lg border-0">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 text-center md:text-left">
          ckTestBTC Wallet
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-2 text-gray-600">
            <span className="font-medium">Principal:</span>
            <Badge variant="secondary" className="font-mono text-sm">
              {principal ? `${principal.toString().slice(0, 8)}...` : 'Not connected'}
            </Badge>
          </div>
          <Button
            onClick={logout}
            variant="destructive"
            className="hover:bg-red-600 transition-colors"
          >
            Logout
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default UserHeader;