import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DepositModal from './index';

describe('DepositModal Component', () => {
  it('renders when open', () => {
    render(<DepositModal open={true} onOpenChange={() => {}} />);
    expect(screen.getByText('Deposit TestBTC')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<DepositModal open={true} onOpenChange={() => {}} loading={true} />);
    expect(screen.getByText('Generating deposit address...')).toBeInTheDocument();
  });

  it('displays address when provided', () => {
    const address = 'tb1qtest123address';
    render(
      <DepositModal
        open={true}
        onOpenChange={() => {}}
        depositAddress={address}
      />
    );
    expect(screen.getByText(address)).toBeInTheDocument();
  });
});