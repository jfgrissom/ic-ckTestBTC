import React from 'react';
import { BalanceSectionProps } from '../../types/wallet.types';
import { getNetworkConfig } from '../../types/backend.types';
import './BalanceSection.css';

const BalanceSection: React.FC<BalanceSectionProps> = ({
  balance,
  loading,
  onRefreshBalance,
  onFaucet,
  showFaucet = getNetworkConfig().network === 'local',
}) => {
  return (
    <div className="balance-section">
      <h2>Balance</h2>
      <div className="balance-display">
        {loading ? 'Loading...' : `${balance} ckTestBTC`}
      </div>
      <div className="balance-actions">
        <button onClick={onRefreshBalance} disabled={loading}>
          Refresh Balance
        </button>
        {showFaucet && onFaucet && (
          <button 
            onClick={onFaucet}
            disabled={loading}
            className="faucet-button"
          >
            Get Test Tokens (Faucet)
          </button>
        )}
      </div>
    </div>
  );
};

export default BalanceSection;