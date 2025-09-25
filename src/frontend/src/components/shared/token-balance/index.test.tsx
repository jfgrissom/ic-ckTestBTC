import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TokenBalance from './index';

describe('TokenBalance Component', () => {
  it('displays ckTestBTC balance correctly in compact layout', () => {
    render(<TokenBalance token="ckTestBTC" balance="50000000" />);
    expect(screen.getByText('0.50000000')).toBeInTheDocument();
    expect(screen.getByText('ckTestBTC')).toBeInTheDocument();
  });

  it('displays ckTestBTC balance correctly in header layout', () => {
    render(
      <TokenBalance
        token="ckTestBTC"
        balance="50000000"
        title="Test Balance"
        description="Test description"
      />
    );
    expect(screen.getByText('0.50000000 ckTestBTC')).toBeInTheDocument();
    expect(screen.getByText('Test Balance')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<TokenBalance token="ckTestBTC" balance="0" loading={true} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('handles zero balance', () => {
    render(<TokenBalance token="ckTestBTC" balance="0" />);
    expect(screen.getByText('0.00000000')).toBeInTheDocument();
  });

  it('displays refresh button when onRefresh is provided', () => {
    const mockRefresh = jest.fn();
    render(
      <TokenBalance
        token="ckTestBTC"
        balance="50000000"
        onRefresh={mockRefresh}
      />
    );
    const refreshButton = screen.getByLabelText('Refresh balance');
    expect(refreshButton).toBeInTheDocument();
  });

  it('calls onRefresh when refresh button is clicked', () => {
    const mockRefresh = jest.fn();
    render(
      <TokenBalance
        token="ckTestBTC"
        balance="50000000"
        onRefresh={mockRefresh}
      />
    );
    const refreshButton = screen.getByLabelText('Refresh balance');
    fireEvent.click(refreshButton);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it('disables refresh button when loading', () => {
    const mockRefresh = jest.fn();
    render(
      <TokenBalance
        token="ckTestBTC"
        balance="50000000"
        onRefresh={mockRefresh}
        loading={true}
      />
    );
    const refreshButton = screen.getByLabelText('Refresh balance');
    expect(refreshButton).toBeDisabled();
  });

  it('hides badge when showBadge is false', () => {
    render(
      <TokenBalance
        token="ckTestBTC"
        balance="50000000"
        showBadge={false}
      />
    );
    expect(screen.queryByText('ckTestBTC')).not.toBeInTheDocument();
  });

  it('uses custom description when provided', () => {
    render(
      <TokenBalance
        token="ckTestBTC"
        balance="50000000"
        description="Custom description"
      />
    );
    expect(screen.getByText('Custom description')).toBeInTheDocument();
    expect(screen.queryByText('ckTestBTC Balance')).not.toBeInTheDocument();
  });
});