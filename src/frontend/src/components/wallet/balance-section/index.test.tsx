import { render, screen } from '@testing-library/react';
import BalanceSection from './index';
import { describe, it, expect, vi } from 'vitest';

describe('BalanceSection', () => {
  const mockProps = {
    balance: '0.12345678',
    loading: false,
    onRefreshBalance: vi.fn(),
    onFaucet: vi.fn(),
    showFaucet: true,
  };

  it('renders BalanceSection component', () => {
    render(<BalanceSection {...mockProps} />);
    expect(screen.getByText('Balance')).toBeInTheDocument();
    expect(screen.getByText('0.12345678')).toBeInTheDocument();
    expect(screen.getByText('ckTestBTC')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<BalanceSection {...mockProps} loading={true} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});