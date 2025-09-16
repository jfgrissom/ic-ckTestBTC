import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DepositsWithdrawalsTab from './index';

const mockProps = {
  loading: false,
  balance: '50000000', // 0.5 ckTestBTC in satoshis
  depositAddress: undefined,
  onGetDepositAddress: jest.fn(),
  onFaucet: jest.fn(),
  onOpenDepositModal: jest.fn(),
  onOpenWithdrawModal: jest.fn(),
  isLocalDev: false,
};

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockImplementation(() => Promise.resolve()),
  },
});

describe('DepositsWithdrawalsTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders balance correctly', () => {
    render(<DepositsWithdrawalsTab {...mockProps} />);

    expect(screen.getByText('ckTestBTC Balance')).toBeInTheDocument();
    expect(screen.getByText('0.50000000 ckTestBTC')).toBeInTheDocument();
    expect(screen.getByText('Backed 1:1 by Bitcoin TestNet (Testnet Bitcoin)')).toBeInTheDocument();
  });

  it('shows faucet section when isLocalDev is true', () => {
    const localDevProps = { ...mockProps, isLocalDev: true };
    render(<DepositsWithdrawalsTab {...localDevProps} />);

    expect(screen.getByText('Development Faucet')).toBeInTheDocument();
    expect(screen.getByText('Get Test Tokens')).toBeInTheDocument();
    expect(screen.getByText(/Get free ckTestBTC tokens for testing/)).toBeInTheDocument();
  });

  it('hides faucet section when isLocalDev is false', () => {
    render(<DepositsWithdrawalsTab {...mockProps} />);

    expect(screen.queryByText('Development Faucet')).not.toBeInTheDocument();
    expect(screen.queryByText('Get Test Tokens')).not.toBeInTheDocument();
  });

  it('calls onFaucet when faucet button is clicked', async () => {
    const localDevProps = { ...mockProps, isLocalDev: true };
    render(<DepositsWithdrawalsTab {...localDevProps} />);

    const faucetButton = screen.getByText('Get Test Tokens');
    fireEvent.click(faucetButton);

    expect(mockProps.onFaucet).toHaveBeenCalledTimes(1);
  });

  it('renders deposit section without address initially', () => {
    render(<DepositsWithdrawalsTab {...mockProps} />);

    expect(screen.getByText('Deposit Bitcoin TestNet')).toBeInTheDocument();
    expect(screen.getByText('How Deposits Work')).toBeInTheDocument();
    expect(screen.getByText('Get Deposit Address')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('calls onGetDepositAddress when get deposit address button is clicked', async () => {
    mockProps.onGetDepositAddress.mockResolvedValue('tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4');
    render(<DepositsWithdrawalsTab {...mockProps} />);

    const getAddressButton = screen.getByText('Get Deposit Address');
    fireEvent.click(getAddressButton);

    expect(mockProps.onGetDepositAddress).toHaveBeenCalledTimes(1);
  });

  it('renders deposit address when provided', () => {
    const propsWithAddress = {
      ...mockProps,
      depositAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
    };
    render(<DepositsWithdrawalsTab {...propsWithAddress} />);

    expect(screen.getByDisplayValue('tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')).toBeInTheDocument();
    expect(screen.getByText('Your Bitcoin TestNet Deposit Address:')).toBeInTheDocument();
  });

  it('copies deposit address to clipboard when copy button is clicked', async () => {
    const propsWithAddress = {
      ...mockProps,
      depositAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
    };
    render(<DepositsWithdrawalsTab {...propsWithAddress} />);

    const copyButton = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4');
  });

  it('renders withdraw section correctly', () => {
    render(<DepositsWithdrawalsTab {...mockProps} />);

    expect(screen.getByText('Withdraw to Bitcoin TestNet')).toBeInTheDocument();
    expect(screen.getByText('How Withdrawals Work')).toBeInTheDocument();
    expect(screen.getByText('Available to Withdraw')).toBeInTheDocument();
    expect(screen.getByText('Network Fee (BTC)')).toBeInTheDocument();
  });

  it('calls onOpenDepositModal when View Deposit Details button is clicked', () => {
    render(<DepositsWithdrawalsTab {...mockProps} />);

    const depositModalButton = screen.getByText('View Deposit Details');
    fireEvent.click(depositModalButton);

    expect(mockProps.onOpenDepositModal).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenWithdrawModal when Withdraw ckTestBTC button is clicked', () => {
    render(<DepositsWithdrawalsTab {...mockProps} />);

    const withdrawModalButton = screen.getByText('Withdraw ckTestBTC');
    fireEvent.click(withdrawModalButton);

    expect(mockProps.onOpenWithdrawModal).toHaveBeenCalledTimes(1);
  });

  it('disables withdraw button when balance is zero', () => {
    const zeroBalanceProps = { ...mockProps, balance: '0' };
    render(<DepositsWithdrawalsTab {...zeroBalanceProps} />);

    const withdrawButton = screen.getByText('Withdraw ckTestBTC');
    expect(withdrawButton).toBeDisabled();
  });

  it('renders quick actions section', () => {
    render(<DepositsWithdrawalsTab {...mockProps} />);

    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Deposit')).toBeInTheDocument();
    expect(screen.getByText('Withdraw')).toBeInTheDocument();
    expect(screen.getByText('Bitcoin TestNet → ckTestBTC')).toBeInTheDocument();
    expect(screen.getByText('ckTestBTC → Bitcoin TestNet')).toBeInTheDocument();
  });

  it('calls appropriate handlers from quick actions', () => {
    render(<DepositsWithdrawalsTab {...mockProps} />);

    const quickDepositButton = screen.getAllByText('Deposit')[0]; // First occurrence in quick actions
    const quickWithdrawButton = screen.getAllByText('Withdraw')[0]; // First occurrence in quick actions

    fireEvent.click(quickDepositButton);
    expect(mockProps.onOpenDepositModal).toHaveBeenCalled();

    fireEvent.click(quickWithdrawButton);
    expect(mockProps.onOpenWithdrawModal).toHaveBeenCalled();
  });

  it('renders important information section', () => {
    render(<DepositsWithdrawalsTab {...mockProps} />);

    expect(screen.getByText('Important Information')).toBeInTheDocument();
    expect(screen.getByText(/Minimum Deposit/)).toBeInTheDocument();
    expect(screen.getByText(/Minimum Withdrawal/)).toBeInTheDocument();
    expect(screen.getByText(/Bitcoin TestNet only/)).toBeInTheDocument();
    expect(screen.getByText(/1 Bitcoin TestNet confirmation/)).toBeInTheDocument();
  });

  it('formats balance correctly', () => {
    const props = { ...mockProps, balance: '123456789' }; // 1.23456789 ckTestBTC
    render(<DepositsWithdrawalsTab {...props} />);

    expect(screen.getByText('1.23456789 ckTestBTC')).toBeInTheDocument();
  });

  it('shows loading state for faucet button', async () => {
    const localDevProps = { ...mockProps, isLocalDev: true };
    mockProps.onFaucet.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    render(<DepositsWithdrawalsTab {...localDevProps} />);

    const faucetButton = screen.getByText('Get Test Tokens');
    fireEvent.click(faucetButton);

    expect(screen.getByText('Getting Test Tokens...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /getting test tokens/i })).toBeDisabled();
  });

  it('shows loading state for get deposit address button', async () => {
    mockProps.onGetDepositAddress.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    render(<DepositsWithdrawalsTab {...mockProps} />);

    const getAddressButton = screen.getByText('Get Deposit Address');
    fireEvent.click(getAddressButton);

    expect(screen.getByText('Getting Address...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /getting address/i })).toBeDisabled();
  });

  it('shows copy success state temporarily', async () => {
    const propsWithAddress = {
      ...mockProps,
      depositAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
    };
    render(<DepositsWithdrawalsTab {...propsWithAddress} />);

    const copyButton = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(copyButton);

    // Note: The actual icon change would be tested with more specific selectors
    // This tests that the clipboard function was called
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it('handles error in clipboard copy gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    navigator.clipboard.writeText = jest.fn().mockRejectedValue(new Error('Clipboard failed'));

    const propsWithAddress = {
      ...mockProps,
      depositAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
    };
    render(<DepositsWithdrawalsTab {...propsWithAddress} />);

    const copyButton = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to copy address:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });
});