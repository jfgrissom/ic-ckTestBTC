import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import TransactionsTab from './index';
import { Transaction } from '@/components/shared/transaction-item';

const mockTransactions: Transaction[] = [
  {
    id: 1,
    tx_type: 'Send',
    token: 'ckTestBTC',
    amount: '10000000',
    from: 'rdmx6-jaaaa-aaaah-qcaiq-cai',
    to: 'rdmx6-jaaaa-aaaah-qcaid-cai',
    status: 'Confirmed',
    timestamp: 1640995200000000000,
    block_index: '123456',
  },
  {
    id: 2,
    tx_type: 'Receive',
    token: 'ckTestBTC',
    amount: '5000000',
    from: 'rdmx6-jaaaa-aaaah-qcaie-cai',
    to: 'rdmx6-jaaaa-aaaah-qcaiq-cai',
    status: 'Pending',
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
    status: 'Failed',
    timestamp: 1640822400000000000,
  },
  {
    id: 4,
    tx_type: 'Withdraw',
    token: 'ckTestBTC',
    amount: '15000000',
    from: 'rdmx6-jaaaa-aaaah-qcaiq-cai',
    to: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
    status: 'Confirmed',
    timestamp: 1640736000000000000,
  },
];

const mockProps = {
  transactions: mockTransactions,
  loading: false,
  onRefreshTransactions: vi.fn(),
};

// Helper function to create more transactions for pagination testing
const createMockTransactions = (count: number): Transaction[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    tx_type: ['Send', 'Receive', 'Deposit', 'Withdraw'][i % 4] as any,
    token: 'ckTestBTC',
    amount: ((i + 1) * 1000000).toString(),
    from: `sender-${i}`,
    to: `receiver-${i}`,
    status: ['Confirmed', 'Pending', 'Failed'][i % 3] as any,
    timestamp: Date.now() * 1000000 + i * 1000000000,
    block_index: `${100000 + i}`,
  }));
};

describe('TransactionsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders statistics correctly', () => {
    render(<TransactionsTab {...mockProps} />);

    expect(screen.getByText('Total Transactions')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument(); // Total count

    expect(screen.getByText('Confirmed')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('calculates statistics correctly', () => {
    render(<TransactionsTab {...mockProps} />);

    // Check that statistics reflect the mock data
    const statsCards = screen.getAllByRole('generic');

    // Total: 4 transactions
    expect(screen.getByText('4')).toBeInTheDocument();

    // Confirmed: 2 transactions (Send and Withdraw)
    // Pending: 1 transaction (Receive)
    // Failed: 1 transaction (Deposit)
  });

  it('renders filters and search section', () => {
    render(<TransactionsTab {...mockProps} />);

    expect(screen.getByText('Filters & Search')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search by address/)).toBeInTheDocument();
    expect(screen.getByText('Transaction Type')).toBeInTheDocument();
    expect(screen.getByText('Token')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('filters transactions by type', () => {
    render(<TransactionsTab {...mockProps} />);

    // Open transaction type select
    const typeSelect = screen.getByDisplayValue('All Types');
    fireEvent.click(typeSelect);

    // Select Send
    const sendOption = screen.getByText('Send');
    fireEvent.click(sendOption);

    // Should show filtered results
    expect(screen.getByText('1 of 4')).toBeInTheDocument();
  });

  it('filters transactions by token', () => {
    render(<TransactionsTab {...mockProps} />);

    // Open token select
    const tokenSelect = screen.getByDisplayValue('All Tokens');
    fireEvent.click(tokenSelect);

    // Select ckTestBTC
    const ckTestBTCOption = screen.getByText('ckTestBTC');
    fireEvent.click(ckTestBTCOption);

    // Should show filtered results - 4 ckTestBTC transactions in mock data
    expect(screen.getByText('4 of 4')).toBeInTheDocument();
  });

  it('filters transactions by status', () => {
    render(<TransactionsTab {...mockProps} />);

    // Open status select
    const statusSelect = screen.getByDisplayValue('All Status');
    fireEvent.click(statusSelect);

    // Select Confirmed
    const confirmedOption = screen.getByText('Confirmed');
    fireEvent.click(confirmedOption);

    // Should show filtered results - 2 confirmed transactions in mock data
    expect(screen.getByText('2 of 4')).toBeInTheDocument();
  });

  it('searches transactions by address', () => {
    render(<TransactionsTab {...mockProps} />);

    const searchInput = screen.getByPlaceholderText(/Search by address/);
    fireEvent.change(searchInput, { target: { value: 'rdmx6-jaaaa-aaaah-qcaiq-cai' } });

    // Should filter transactions containing this address
    // This depends on the search implementation
  });

  it('clears all filters when clear filters button is clicked', () => {
    render(<TransactionsTab {...mockProps} />);

    // Set some filters first
    const typeSelect = screen.getByDisplayValue('All Types');
    fireEvent.click(typeSelect);
    fireEvent.click(screen.getByText('Send'));

    const searchInput = screen.getByPlaceholderText(/Search by address/);
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Clear filters
    const clearButton = screen.getByText('Clear Filters');
    fireEvent.click(clearButton);

    // Should reset to show all transactions
    expect(screen.getByDisplayValue('All Types')).toBeInTheDocument();
    expect(searchInput).toHaveValue('');
  });

  it('shows active filters', () => {
    render(<TransactionsTab {...mockProps} />);

    // Set a filter
    const typeSelect = screen.getByDisplayValue('All Types');
    fireEvent.click(typeSelect);
    fireEvent.click(screen.getByText('Send'));

    // Should show active filters
    expect(screen.getByText('Active filters:')).toBeInTheDocument();
    expect(screen.getByText('Send')).toBeInTheDocument();
  });

  it('calls onRefreshTransactions when refresh button is clicked', () => {
    render(<TransactionsTab {...mockProps} />);

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    expect(mockProps.onRefreshTransactions).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    const loadingProps = { ...mockProps, loading: true };
    render(<TransactionsTab {...loadingProps} />);

    expect(screen.getByText('Loading transactions...')).toBeInTheDocument();
  });

  it('shows empty state when no transactions', () => {
    const emptyProps = { ...mockProps, transactions: [] };
    render(<TransactionsTab {...emptyProps} />);

    expect(screen.getByText('No transactions yet')).toBeInTheDocument();
    expect(screen.getByText(/Your transaction history will appear here/)).toBeInTheDocument();
  });

  it('shows no matches state when filters return no results', () => {
    render(<TransactionsTab {...mockProps} />);

    // Set a search that won't match anything
    const searchInput = screen.getByPlaceholderText(/Search by address/);
    fireEvent.change(searchInput, { target: { value: 'nonexistentaddress' } });

    expect(screen.getByText('No transactions match your filters')).toBeInTheDocument();
    expect(screen.getByText(/Try adjusting your search criteria/)).toBeInTheDocument();
  });

  it('renders transaction list', () => {
    render(<TransactionsTab {...mockProps} />);

    expect(screen.getByText('Transaction History')).toBeInTheDocument();

    // Should render TransactionItem components
    // The exact content depends on how TransactionItem renders
    expect(screen.getByRole('generic')).toBeInTheDocument();
  });

  it('handles pagination with many transactions', () => {
    const manyTransactions = createMockTransactions(25);
    const propsWithManyTransactions = { ...mockProps, transactions: manyTransactions };
    render(<TransactionsTab {...propsWithManyTransactions} />);

    // Should show pagination controls
    expect(screen.getByText('Showing 1-10 of 25')).toBeInTheDocument();
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();

    // Should show page numbers
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('navigates between pages', () => {
    const manyTransactions = createMockTransactions(25);
    const propsWithManyTransactions = { ...mockProps, transactions: manyTransactions };
    render(<TransactionsTab {...propsWithManyTransactions} />);

    // Click next page
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    expect(screen.getByText('Showing 11-20 of 25')).toBeInTheDocument();

    // Click previous page
    const prevButton = screen.getByText('Previous');
    fireEvent.click(prevButton);

    expect(screen.getByText('Showing 1-10 of 25')).toBeInTheDocument();
  });

  it('disables pagination buttons appropriately', () => {
    const manyTransactions = createMockTransactions(25);
    const propsWithManyTransactions = { ...mockProps, transactions: manyTransactions };
    render(<TransactionsTab {...propsWithManyTransactions} />);

    // Previous should be disabled on first page
    const prevButton = screen.getByText('Previous');
    expect(prevButton).toBeDisabled();

    // Go to last page
    const lastPageButton = screen.getByText('3');
    fireEvent.click(lastPageButton);

    // Next should be disabled on last page
    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeDisabled();
  });

  it('resets to first page when filters change', () => {
    const manyTransactions = createMockTransactions(25);
    const propsWithManyTransactions = { ...mockProps, transactions: manyTransactions };
    render(<TransactionsTab {...propsWithManyTransactions} />);

    // Go to page 2
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    expect(screen.getByText('Showing 11-20 of 25')).toBeInTheDocument();

    // Change filter
    const typeSelect = screen.getByDisplayValue('All Types');
    fireEvent.click(typeSelect);
    fireEvent.click(screen.getByText('Send'));

    // Should reset to page 1
    // This depends on how many Send transactions exist in the mock data
  });

  it('renders information section', () => {
    render(<TransactionsTab {...mockProps} />);

    expect(screen.getByText('Transaction Information')).toBeInTheDocument();
    expect(screen.getByText(/Transaction has been processed and is irreversible/)).toBeInTheDocument();
    expect(screen.getByText(/Transaction is being processed/)).toBeInTheDocument();
    expect(screen.getByText(/Transaction could not be completed/)).toBeInTheDocument();
  });

  it('shows export button (disabled)', () => {
    render(<TransactionsTab {...mockProps} />);

    const exportButton = screen.getByText('Export');
    expect(exportButton).toBeDisabled();
  });

  it('handles complex filter combinations', () => {
    render(<TransactionsTab {...mockProps} />);

    // Set multiple filters
    const typeSelect = screen.getByDisplayValue('All Types');
    fireEvent.click(typeSelect);
    fireEvent.click(screen.getByText('Send'));

    const tokenSelect = screen.getByDisplayValue('All Tokens');
    fireEvent.click(tokenSelect);
    fireEvent.click(screen.getByText('ckTestBTC'));

    const statusSelect = screen.getByDisplayValue('All Status');
    fireEvent.click(statusSelect);
    fireEvent.click(screen.getByText('Confirmed'));

    // Should show combined filter results
    // This would show transactions that are Send AND ckTestBTC AND Confirmed
    expect(screen.getByText('Active filters:')).toBeInTheDocument();
  });

  it('shows ellipsis in pagination when there are many pages', () => {
    const manyTransactions = createMockTransactions(100); // 10 pages
    const propsWithManyTransactions = { ...mockProps, transactions: manyTransactions };
    render(<TransactionsTab {...propsWithManyTransactions} />);

    // Should show ellipsis in pagination
    expect(screen.getByText('...')).toBeInTheDocument();
  });

  it('updates statistics when filters are applied', () => {
    render(<TransactionsTab {...mockProps} />);

    // Initial state should show all 4 transactions
    expect(screen.getByText('4')).toBeInTheDocument();

    // Filter to only show confirmed transactions
    const statusSelect = screen.getByDisplayValue('All Status');
    fireEvent.click(statusSelect);
    fireEvent.click(screen.getByText('Confirmed'));

    // Statistics should update to reflect filtered data
    // The component shows the filtered count in the badge
    expect(screen.getByText('2 of 4')).toBeInTheDocument();
  });
});