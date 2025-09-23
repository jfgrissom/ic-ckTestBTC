import { render, screen } from '@testing-library/react';
import BalanceSection from './index';
import { describe, it, expect, vi } from 'vitest';

describe('BalanceSection', () => {
  const mockWalletStatus = {
    custodialBalance: '0.12345678',
    personalBalance: '0.00000000',
    totalAvailable: '0.12345678',
    canDeposit: false,
  };

  const mockProps = {
    walletStatus: mockWalletStatus,
    loading: false,
    onRefreshBalance: vi.fn(),
    onFaucet: vi.fn(),
    showFaucet: true,
    faucetLoading: false,
  };

  it('renders BalanceSection component', () => {
    render(<BalanceSection {...mockProps} />);
    expect(screen.getByText('Custodial Wallet Balance')).toBeInTheDocument();
    expect(screen.getByText('0.12345678')).toBeInTheDocument();
    expect(screen.getByText('ckTestBTC')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<BalanceSection {...mockProps} loading={true} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('disables faucet button when faucetLoading is true', () => {
    render(<BalanceSection {...mockProps} faucetLoading={true} />);
    const faucetButton = screen.getByText('Minting Tokens...');
    expect(faucetButton).toBeInTheDocument();
    expect(faucetButton.closest('button')).toBeDisabled();
  });

  it('shows normal faucet button when not loading', () => {
    render(<BalanceSection {...mockProps} faucetLoading={false} />);
    const faucetButton = screen.getByText('Get Test Tokens (Faucet)');
    expect(faucetButton).toBeInTheDocument();
    expect(faucetButton.closest('button')).not.toBeDisabled();
  });

  it('disables faucet button when both loading and faucetLoading are true', () => {
    render(<BalanceSection {...mockProps} loading={true} faucetLoading={true} />);
    const faucetButton = screen.getByText('Minting Tokens...');
    expect(faucetButton.closest('button')).toBeDisabled();
  });
});