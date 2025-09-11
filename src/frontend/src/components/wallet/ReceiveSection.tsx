import React from 'react';
import { ReceiveSectionProps } from '../../types/wallet.types';
import './ReceiveSection.css';

const ReceiveSection: React.FC<ReceiveSectionProps> = ({
  btcAddress,
  principal,
  onCopyBtcAddress,
  onCopyPrincipal,
}) => {
  return (
    <div className="receive-section">
      <h2>Receive ckTestBTC</h2>
      
      <div className="address-group">
        <p><strong>Bitcoin Testnet Address:</strong></p>
        <div className="address-display">
          {btcAddress || 'Loading...'}
          <button 
            onClick={onCopyBtcAddress}
            className="copy-btn"
            disabled={!btcAddress}
          >
            Copy BTC Address
          </button>
        </div>
        <p className="address-description">
          Send testnet BTC to this address to receive ckTestBTC
        </p>
      </div>

      <div className="address-group">
        <p><strong>IC Principal ID:</strong></p>
        <div className="address-display">
          {principal}
          <button 
            onClick={onCopyPrincipal}
            className="copy-btn"
          >
            Copy Principal
          </button>
        </div>
        <p className="address-description">
          Use this for direct ckTestBTC transfers within IC
        </p>
      </div>
    </div>
  );
};

export default ReceiveSection;