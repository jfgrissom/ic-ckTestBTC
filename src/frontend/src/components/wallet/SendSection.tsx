import React from 'react';
import { SendSectionProps } from '../../types/wallet.types';
import './SendSection.css';

const SendSection: React.FC<SendSectionProps> = ({
  sendAmount,
  sendTo,
  loading,
  onSendAmountChange,
  onSendToChange,
  onSend,
}) => {
  return (
    <div className="send-section">
      <h2>Send ckTestBTC</h2>
      <div className="send-form">
        <input
          type="text"
          placeholder="Recipient Principal ID"
          value={sendTo}
          onChange={(e) => onSendToChange(e.target.value)}
          disabled={loading}
        />
        <input
          type="number"
          placeholder="Amount"
          step="0.00000001"
          value={sendAmount}
          onChange={(e) => onSendAmountChange(e.target.value)}
          disabled={loading}
        />
        <button 
          onClick={onSend}
          disabled={loading || !sendAmount || !sendTo || Number(sendAmount) <= 0}
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default SendSection;