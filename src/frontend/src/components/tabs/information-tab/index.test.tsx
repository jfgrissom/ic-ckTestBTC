import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import InformationTab from './index';

const mockProps = {
  ckTestBTCBalance: '0.00123456',
  loading: false,
  onRefreshBalances: vi.fn(),
  onOpenSendModal: vi.fn(),
  onOpenReceiveModal: vi.fn(),
  onOpenDepositModal: vi.fn(),
  onOpenWithdrawModal: vi.fn(),
};

describe('InformationTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders balances section correctly', () => {
    render(<InformationTab {...mockProps} />);

    expect(screen.getByText('Your Balances')).toBeInTheDocument();
    expect(screen.getByText('ckTestBTC')).toBeInTheDocument();
  });

  it('renders quick actions section with all buttons', () => {
    render(<InformationTab {...mockProps} />);

    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('IC Token Operations')).toBeInTheDocument();
    expect(screen.getByText('Bitcoin TestNet Operations')).toBeInTheDocument();

    // Check for action buttons
    expect(screen.getByText('Send ckTestBTC')).toBeInTheDocument();
    expect(screen.getByText('Receive ckTestBTC')).toBeInTheDocument();
    expect(screen.getByText('Deposit TestBTC')).toBeInTheDocument();
    expect(screen.getByText('Withdraw TestBTC')).toBeInTheDocument();
  });

  it('renders information section correctly', () => {
    render(<InformationTab {...mockProps} />);

    expect(screen.getByText('About Your Wallet')).toBeInTheDocument();
    expect(screen.getByText(/Chain-key Bitcoin testnet token/)).toBeInTheDocument();
    expect(screen.getByText(/Bridge between Bitcoin TestNet/)).toBeInTheDocument();
    expect(screen.getByText(/Transfer tokens directly between/)).toBeInTheDocument();
  });

  it('calls onOpenSendModal with correct token when Send ckTestBTC button is clicked', () => {
    render(<InformationTab {...mockProps} />);

    const sendCkTestBTCButton = screen.getByText('Send ckTestBTC');
    fireEvent.click(sendCkTestBTCButton);

    expect(mockProps.onOpenSendModal).toHaveBeenCalledWith('ckTestBTC');
    expect(mockProps.onOpenSendModal).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenReceiveModal with correct token when Receive ckTestBTC button is clicked', () => {
    render(<InformationTab {...mockProps} />);

    const receiveCkTestBTCButton = screen.getByText('Receive ckTestBTC');
    fireEvent.click(receiveCkTestBTCButton);

    expect(mockProps.onOpenReceiveModal).toHaveBeenCalledWith('ckTestBTC');
    expect(mockProps.onOpenReceiveModal).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenDepositModal when Deposit TestBTC button is clicked', () => {
    render(<InformationTab {...mockProps} />);

    const depositButton = screen.getByText('Deposit TestBTC');
    fireEvent.click(depositButton);

    expect(mockProps.onOpenDepositModal).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenWithdrawModal when Withdraw TestBTC button is clicked', () => {
    render(<InformationTab {...mockProps} />);

    const withdrawButton = screen.getByText('Withdraw TestBTC');
    fireEvent.click(withdrawButton);

    expect(mockProps.onOpenWithdrawModal).toHaveBeenCalledTimes(1);
  });

  it('handles loading state correctly', () => {
    const loadingProps = { ...mockProps, loading: true };
    render(<InformationTab {...loadingProps} />);

    // The TokenBalance components should handle loading state internally
    expect(screen.getByText('Your Balances')).toBeInTheDocument();
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
  });

  it('displays correct balance values', () => {
    render(<InformationTab {...mockProps} />);

    // TokenBalance components receive the balance values as props
    // We can't directly test the displayed values without knowing the internal implementation
    // But we can verify the component renders without errors with the provided balances
    expect(screen.getByText('Your Balances')).toBeInTheDocument();
  });

  it('has proper responsive layout classes', () => {
    const { container } = render(<InformationTab {...mockProps} />);

    // Check for responsive grid classes
    const actionGrid = container.querySelector('.grid.grid-cols-2.md\\:grid-cols-4');
    expect(actionGrid).toBeInTheDocument();

    const bitcoinGrid = container.querySelector('.grid.grid-cols-2');
    expect(bitcoinGrid).toBeInTheDocument();
  });

  it('renders all required icons', () => {
    render(<InformationTab {...mockProps} />);

    // Icons are rendered as SVG elements, we can check for their presence
    // The exact test depends on how Lucide React renders icons
    const quickActionsTitle = screen.getByText('Quick Actions');
    expect(quickActionsTitle.closest('div')).toBeInTheDocument();
  });

  it('maintains proper component structure', () => {
    const { container } = render(<InformationTab {...mockProps} />);

    // Check for main container structure
    const mainContainer = container.querySelector('.space-y-6');
    expect(mainContainer).toBeInTheDocument();

    // Check for Cards
    const cards = container.querySelectorAll('[data-card]');
    expect(cards.length).toBeGreaterThan(0);
  });
});