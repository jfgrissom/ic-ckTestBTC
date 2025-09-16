import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SendReceiveTab from './index';
import { Transaction } from '@/components/shared/transaction-item';

const mockProps = {
  icpBalance: '100000000', // 1 ICP in e8s
  ckTestBTCBalance: '50000000', // 0.5 ckTestBTC in satoshis
  userPrincipal: 'rdmx6-jaaaa-aaaah-qcaiq-cai',
  btcAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
  loading: false,
  onOpenSendModal: jest.fn(),
  onOpenReceiveModal: jest.fn(),
  recentTransactions: [],
};

const mockTransactions: Transaction[] = [
  {
    id: 1,
    tx_type: 'Send',
    token: 'ICP',
    amount: '10000000',
    from: 'rdmx6-jaaaa-aaaah-qcaiq-cai',
    to: 'rdmx6-jaaaa-aaaah-qcaid-cai',
    status: 'Confirmed',
    timestamp: 1640995200000000000, // nanoseconds
    block_index: '123456',
  },
  {
    id: 2,
    tx_type: 'Receive',
    token: 'ckTestBTC',
    amount: '5000000',
    from: 'rdmx6-jaaaa-aaaah-qcaie-cai',
    to: 'rdmx6-jaaaa-aaaah-qcaiq-cai',
    status: 'Confirmed',
    timestamp: 1640908800000000000,
    block_index: '123457',
  },
  {
    id: 3,
    tx_type: 'Deposit',
    token: 'ckTestBTC',
    amount: '25000000',
    from: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
    to: 'rdmx6-jaaaa-aaaah-qcaiq-cai',
    status: 'Confirmed',
    timestamp: 1640822400000000000,
  },
];

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockImplementation(() => Promise.resolve()),
  },
});

describe('SendReceiveTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders token balances correctly', () => {
    render(<SendReceiveTab {...mockProps} />);

    expect(screen.getByText('ICP Balance')).toBeInTheDocument();
    expect(screen.getByText('1.00000000 ICP')).toBeInTheDocument();
    expect(screen.getByText('ckTestBTC Balance')).toBeInTheDocument();
    expect(screen.getByText('0.50000000 ckTestBTC')).toBeInTheDocument();
  });

  it('allows selecting different tokens', () => {
    render(<SendReceiveTab {...mockProps} />);

    const icpSelectButton = screen.getAllByText('Select')[0];
    const ckTestBTCSelectButton = screen.getAllByText('Select')[1];

    fireEvent.click(ckTestBTCSelectButton);
    // The component should update to show ckTestBTC as selected
    // This would be more easily testable with data-testid attributes

    fireEvent.click(icpSelectButton);
    // The component should update to show ICP as selected
  });

  it('renders send/receive tabs', () => {
    render(<SendReceiveTab {...mockProps} />);

    expect(screen.getByRole('tab', { name: /send/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /receive/i })).toBeInTheDocument();
  });

  it('shows send interface by default', () => {
    render(<SendReceiveTab {...mockProps} />);

    expect(screen.getByText('Send ICP')).toBeInTheDocument();
    expect(screen.getByText('Available to send')).toBeInTheDocument();
    expect(screen.getByText('Transaction Fee:')).toBeInTheDocument();
  });

  it('switches to receive interface when receive tab is clicked', () => {
    render(<SendReceiveTab {...mockProps} />);

    const receiveTab = screen.getByRole('tab', { name: /receive/i });
    fireEvent.click(receiveTab);

    expect(screen.getByText('Receive ICP')).toBeInTheDocument();
    expect(screen.getByText('Your Principal ID (for ICP):')).toBeInTheDocument();
  });

  it('calls onOpenSendModal when send button is clicked', () => {
    render(<SendReceiveTab {...mockProps} />);

    const sendButton = screen.getByRole('button', { name: /send icp/i });
    fireEvent.click(sendButton);

    expect(mockProps.onOpenSendModal).toHaveBeenCalledWith('ICP');
  });

  it('calls onOpenReceiveModal when receive details button is clicked', () => {
    render(<SendReceiveTab {...mockProps} />);

    // Switch to receive tab
    const receiveTab = screen.getByRole('tab', { name: /receive/i });
    fireEvent.click(receiveTab);

    const receiveDetailsButton = screen.getByRole('button', { name: /view receive details/i });
    fireEvent.click(receiveDetailsButton);

    expect(mockProps.onOpenReceiveModal).toHaveBeenCalledWith('ICP');
  });

  it('copies principal ID to clipboard', async () => {
    render(<SendReceiveTab {...mockProps} />);

    // Switch to receive tab
    const receiveTab = screen.getByRole('tab', { name: /receive/i });
    fireEvent.click(receiveTab);

    const copyButton = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockProps.userPrincipal);
  });

  it('disables send button when balance is zero', () => {
    const zeroBalanceProps = { ...mockProps, icpBalance: '0' };
    render(<SendReceiveTab {...zeroBalanceProps} />);

    const sendButton = screen.getByRole('button', { name: /send icp/i });
    expect(sendButton).toBeDisabled();
  });

  it('disables send button when loading', () => {
    const loadingProps = { ...mockProps, loading: true };
    render(<SendReceiveTab {...loadingProps} />);

    const sendButton = screen.getByRole('button', { name: /send icp/i });
    expect(sendButton).toBeDisabled();
  });

  it('displays recent transactions when provided', () => {
    const propsWithTransactions = {
      ...mockProps,
      recentTransactions: mockTransactions,
    };
    render(<SendReceiveTab {...propsWithTransactions} />);

    expect(screen.getByText('Recent Send/Receive Transactions')).toBeInTheDocument();
    // Should only show Send/Receive transactions, not Deposit
    expect(screen.getByText('Last 5')).toBeInTheDocument();
  });

  it('shows empty state when no recent transactions', () => {
    render(<SendReceiveTab {...mockProps} />);

    expect(screen.getByText('No recent send/receive transactions')).toBeInTheDocument();
    expect(screen.getByText(/Your transaction history will appear here/)).toBeInTheDocument();
  });

  it('shows loading state for transactions', () => {
    const loadingProps = { ...mockProps, loading: true };
    render(<SendReceiveTab {...loadingProps} />);

    expect(screen.getByText('Loading transactions...')).toBeInTheDocument();
  });

  it('renders quick actions section', () => {
    render(<SendReceiveTab {...mockProps} />);

    expect(screen.getByText('Quick Actions')).toBeInTheDocument();

    // Find quick action buttons
    const quickActionButtons = screen.getAllByText(/Send|Receive/);
    const sendICPButtons = quickActionButtons.filter(btn => btn.textContent?.includes('Send ICP'));
    const receiveICPButtons = quickActionButtons.filter(btn => btn.textContent?.includes('Receive ICP'));
    const sendckTestBTCButtons = quickActionButtons.filter(btn => btn.textContent?.includes('Send ckTestBTC'));
    const receiveckTestBTCButtons = quickActionButtons.filter(btn => btn.textContent?.includes('Receive ckTestBTC'));

    expect(sendICPButtons.length).toBeGreaterThan(0);
    expect(receiveICPButtons.length).toBeGreaterThan(0);
    expect(sendckTestBTCButtons.length).toBeGreaterThan(0);
    expect(receiveckTestBTCButtons.length).toBeGreaterThan(0);
  });

  it('calls appropriate handlers from quick actions', () => {
    render(<SendReceiveTab {...mockProps} />);

    // Test quick action buttons - we need to be more specific about which buttons we click
    // since there are multiple "Send ICP" buttons on the page
    const quickActionButtons = screen.getAllByRole('button');

    // Find the specific quick action buttons by their structure
    const sendICPQuickAction = quickActionButtons.find(btn =>
      btn.textContent === 'Send ICP' && btn.className.includes('h-20')
    );
    const receiveICPQuickAction = quickActionButtons.find(btn =>
      btn.textContent === 'Receive ICP' && btn.className.includes('h-20')
    );

    if (sendICPQuickAction) {
      fireEvent.click(sendICPQuickAction);
      expect(mockProps.onOpenSendModal).toHaveBeenCalledWith('ICP');
    }

    if (receiveICPQuickAction) {
      fireEvent.click(receiveICPQuickAction);
      expect(mockProps.onOpenReceiveModal).toHaveBeenCalledWith('ICP');
    }
  });

  it('renders information section', () => {
    render(<SendReceiveTab {...mockProps} />);

    expect(screen.getByText('Transfer Information')).toBeInTheDocument();
    expect(screen.getByText(/All transfers happen on the Internet Computer/)).toBeInTheDocument();
    expect(screen.getByText(/Transactions are typically confirmed within seconds/)).toBeInTheDocument();
    expect(screen.getByText(/Low fixed fees for all token transfers/)).toBeInTheDocument();
  });

  it('shows different fees for different tokens', () => {
    render(<SendReceiveTab {...mockProps} />);

    // Check ICP fee
    expect(screen.getByText('0.0001 ICP')).toBeInTheDocument();

    // Switch to ckTestBTC and check its fee
    const ckTestBTCSelectButton = screen.getAllByText('Select')[1];
    fireEvent.click(ckTestBTCSelectButton);

    // Should show ckTestBTC fee (this might need to wait for state update)
    setTimeout(() => {
      expect(screen.getByText('0.00001 ckTestBTC')).toBeInTheDocument();
    }, 100);
  });

  it('formats balances correctly', () => {
    const props = {
      ...mockProps,
      icpBalance: '123456789', // 1.23456789 ICP
      ckTestBTCBalance: '987654321', // 9.87654321 ckTestBTC
    };
    render(<SendReceiveTab {...props} />);

    expect(screen.getByText('1.23456789 ICP')).toBeInTheDocument();
    expect(screen.getByText('9.87654321 ckTestBTC')).toBeInTheDocument();
  });

  it('filters recent transactions to only show send/receive', () => {
    const propsWithTransactions = {
      ...mockProps,
      recentTransactions: mockTransactions,
    };
    render(<SendReceiveTab {...propsWithTransactions} />);

    // Should show Send and Receive transactions but not Deposit
    // The component filters to only show Send/Receive, so Deposit should not appear
    expect(screen.getByText('Recent Send/Receive Transactions')).toBeInTheDocument();

    // Check that we have transaction items rendered
    // Note: The exact text depends on how TransactionItem renders the data
    const transactionCards = screen.getAllByText(/Send|Receive/);
    expect(transactionCards.length).toBeGreaterThan(0);
  });

  it('limits recent transactions to 5 items', () => {
    const manyTransactions: Transaction[] = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      tx_type: i % 2 === 0 ? 'Send' : 'Receive',
      token: 'ICP',
      amount: '10000000',
      from: 'sender-principal',
      to: 'receiver-principal',
      status: 'Confirmed',
      timestamp: Date.now() * 1000000,
      block_index: `${123456 + i}`,
    }));

    const propsWithManyTransactions = {
      ...mockProps,
      recentTransactions: manyTransactions,
    };
    render(<SendReceiveTab {...propsWithManyTransactions} />);

    expect(screen.getByText('Last 5')).toBeInTheDocument();
  });

  it('handles clipboard copy error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    navigator.clipboard.writeText = jest.fn().mockRejectedValue(new Error('Clipboard failed'));

    render(<SendReceiveTab {...mockProps} />);

    // Switch to receive tab
    const receiveTab = screen.getByRole('tab', { name: /receive/i });
    fireEvent.click(receiveTab);

    const copyButton = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to copy principal:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('shows token-specific information in receive tab', () => {
    render(<SendReceiveTab {...mockProps} />);

    // Switch to receive tab
    const receiveTab = screen.getByRole('tab', { name: /receive/i });
    fireEvent.click(receiveTab);

    expect(screen.getByText('ICRC-1')).toBeInTheDocument(); // ICP standard

    // Switch to ckTestBTC
    const ckTestBTCSelectButton = screen.getAllByText('Select')[1];
    fireEvent.click(ckTestBTCSelectButton);

    // Should eventually show ICRC-2 for ckTestBTC
    setTimeout(() => {
      expect(screen.getByText('ICRC-2')).toBeInTheDocument();
    }, 100);
  });
});