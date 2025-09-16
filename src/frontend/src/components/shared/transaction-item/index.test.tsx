import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TransactionItem from './index';

const mockTransaction = {
  id: 1,
  tx_type: 'Send' as const,
  token: 'ckTestBTC',
  amount: '50000000',
  from: 'user-principal-123',
  to: 'recipient-principal-456',
  status: 'Confirmed' as const,
  timestamp: Date.now() * 1000000, // Convert to nanoseconds
  block_index: '123',
};

describe('TransactionItem Component', () => {
  it('displays send transaction correctly', () => {
    render(<TransactionItem transaction={mockTransaction} />);

    expect(screen.getByText('Send')).toBeInTheDocument();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
    expect(screen.getByText(/^-0\.50000000 ckTestBTC$/)).toBeInTheDocument();
  });

  it('displays receive transaction correctly', () => {
    const receiveTransaction = {
      ...mockTransaction,
      tx_type: 'Receive' as const,
    };

    render(<TransactionItem transaction={receiveTransaction} />);

    expect(screen.getByText('Receive')).toBeInTheDocument();
    expect(screen.getByText(/^\+0\.50000000 ckTestBTC$/)).toBeInTheDocument();
  });

  it('shows block index when available', () => {
    render(<TransactionItem transaction={mockTransaction} />);
    expect(screen.getByText(/Block: 123/)).toBeInTheDocument();
  });
});