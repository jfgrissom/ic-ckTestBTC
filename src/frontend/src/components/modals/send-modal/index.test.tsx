import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SendModal from './index';

describe('SendModal Component', () => {
  const mockOnSend = jest.fn();
  const mockOnOpenChange = jest.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    onSend: mockOnSend,
    icpBalance: '100000000', // 1 ICP
    ckTestBTCBalance: '200000000', // 2 ckTestBTC
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when open', () => {
    render(<SendModal {...defaultProps} />);
    expect(screen.getByText('Send ckTestBTC')).toBeInTheDocument();
    expect(screen.getByLabelText('Select Token')).toBeInTheDocument();
    expect(screen.getByLabelText('Recipient Principal ID')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount (ckTestBTC)')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<SendModal {...defaultProps} open={false} />);
    expect(screen.queryByText('Send ckTestBTC')).not.toBeInTheDocument();
  });

  it('displays correct balances for both tokens', () => {
    render(<SendModal {...defaultProps} />);

    // Should show ckTestBTC balance initially (default selected)
    expect(screen.getByText('Balance: 2.00000000 ckTestBTC')).toBeInTheDocument();

    // Check that ICP button shows ICP balance
    expect(screen.getByText('1.00000000')).toBeInTheDocument();
    expect(screen.getByText('2.00000000')).toBeInTheDocument();
  });

  it('switches between tokens correctly', () => {
    render(<SendModal {...defaultProps} />);

    // Initially ckTestBTC is selected
    expect(screen.getByText('Send ckTestBTC')).toBeInTheDocument();
    expect(screen.getByText('Balance: 2.00000000 ckTestBTC')).toBeInTheDocument();

    // Click ICP button
    const icpButton = screen.getByRole('button', { name: /ICP 1\.00000000/ });
    fireEvent.click(icpButton);

    // Should switch to ICP
    expect(screen.getByText('Send ICP')).toBeInTheDocument();
    expect(screen.getByText('Balance: 1.00000000 ICP')).toBeInTheDocument();
  });

  it('validates empty recipient', async () => {
    render(<SendModal {...defaultProps} />);

    const sendButton = screen.getByRole('button', { name: /send ckTestBTC/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a recipient Principal ID')).toBeInTheDocument();
    });
    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('validates invalid principal format', async () => {
    render(<SendModal {...defaultProps} />);

    const recipientInput = screen.getByLabelText('Recipient Principal ID');
    const sendButton = screen.getByRole('button', { name: /send ckTestBTC/i });

    fireEvent.change(recipientInput, { target: { value: 'invalid-principal' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid Principal ID format')).toBeInTheDocument();
    });
    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('validates empty amount', async () => {
    render(<SendModal {...defaultProps} />);

    const recipientInput = screen.getByLabelText('Recipient Principal ID');
    const sendButton = screen.getByRole('button', { name: /send ckTestBTC/i });

    fireEvent.change(recipientInput, { target: { value: 'rdmx6-jaaaa-aaaah-qcaiq-cai' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter an amount')).toBeInTheDocument();
    });
    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('validates minimum amount for ckTestBTC', async () => {
    render(<SendModal {...defaultProps} />);

    const recipientInput = screen.getByLabelText('Recipient Principal ID');
    const amountInput = screen.getByLabelText('Amount (ckTestBTC)');
    const sendButton = screen.getByRole('button', { name: /send ckTestBTC/i });

    fireEvent.change(recipientInput, { target: { value: 'rdmx6-jaaaa-aaaah-qcaiq-cai' } });
    fireEvent.change(amountInput, { target: { value: '0.000001' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Minimum send amount is 0.00001 ckTestBTC')).toBeInTheDocument();
    });
    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('validates minimum amount for ICP', async () => {
    render(<SendModal {...defaultProps} />);

    // Switch to ICP
    const icpButton = screen.getByRole('button', { name: /ICP 1\.00000000/ });
    fireEvent.click(icpButton);

    const recipientInput = screen.getByLabelText('Recipient Principal ID');
    const amountInput = screen.getByLabelText('Amount (ICP)');
    const sendButton = screen.getByRole('button', { name: /send ICP/i });

    fireEvent.change(recipientInput, { target: { value: 'rdmx6-jaaaa-aaaah-qcaiq-cai' } });
    fireEvent.change(amountInput, { target: { value: '0.00001' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Minimum send amount is 0.0001 ICP')).toBeInTheDocument();
    });
    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('validates amount exceeds balance', async () => {
    render(<SendModal {...defaultProps} />);

    const recipientInput = screen.getByLabelText('Recipient Principal ID');
    const amountInput = screen.getByLabelText('Amount (ckTestBTC)');
    const sendButton = screen.getByRole('button', { name: /send ckTestBTC/i });

    fireEvent.change(recipientInput, { target: { value: 'rdmx6-jaaaa-aaaah-qcaiq-cai' } });
    fireEvent.change(amountInput, { target: { value: '5.0' } }); // More than 2 ckTestBTC balance
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Amount exceeds available balance')).toBeInTheDocument();
    });
    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('calls onSend with valid ckTestBTC inputs', async () => {
    mockOnSend.mockResolvedValueOnce();

    render(<SendModal {...defaultProps} />);

    const recipientInput = screen.getByLabelText('Recipient Principal ID');
    const amountInput = screen.getByLabelText('Amount (ckTestBTC)');
    const sendButton = screen.getByRole('button', { name: /send ckTestBTC/i });

    fireEvent.change(recipientInput, { target: { value: 'rdmx6-jaaaa-aaaah-qcaiq-cai' } });
    fireEvent.change(amountInput, { target: { value: '1.0' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockOnSend).toHaveBeenCalledWith('ckTestBTC', 'rdmx6-jaaaa-aaaah-qcaiq-cai', '100000000');
    });
  });

  it('calls onSend with valid ICP inputs', async () => {
    mockOnSend.mockResolvedValueOnce();

    render(<SendModal {...defaultProps} />);

    // Switch to ICP
    const icpButton = screen.getByRole('button', { name: /ICP 1\.00000000/ });
    fireEvent.click(icpButton);

    const recipientInput = screen.getByLabelText('Recipient Principal ID');
    const amountInput = screen.getByLabelText('Amount (ICP)');
    const sendButton = screen.getByRole('button', { name: /send ICP/i });

    fireEvent.change(recipientInput, { target: { value: 'rdmx6-jaaaa-aaaah-qcaiq-cai' } });
    fireEvent.change(amountInput, { target: { value: '0.5' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockOnSend).toHaveBeenCalledWith('ICP', 'rdmx6-jaaaa-aaaah-qcaiq-cai', '50000000');
    });
  });

  it('handles Max button click for ckTestBTC', () => {
    render(<SendModal {...defaultProps} />);

    const maxButton = screen.getByRole('button', { name: /max/i });
    const amountInput = screen.getByLabelText('Amount (ckTestBTC)');

    fireEvent.click(maxButton);

    // Should set to balance minus fee reserve (2.0 - 0.00001)
    expect(amountInput.value).toBe('1.99999000');
  });

  it('handles Max button click for ICP', () => {
    render(<SendModal {...defaultProps} />);

    // Switch to ICP
    const icpButton = screen.getByRole('button', { name: /ICP 1\.00000000/ });
    fireEvent.click(icpButton);

    const maxButton = screen.getByRole('button', { name: /max/i });
    const amountInput = screen.getByLabelText('Amount (ICP)');

    fireEvent.click(maxButton);

    // Should set to balance minus fee reserve (1.0 - 0.0001)
    expect(amountInput.value).toBe('0.99990000');
  });

  it('shows loading state', () => {
    render(<SendModal {...defaultProps} loading={true} />);

    expect(screen.getByText('Sending...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled();
  });

  it('closes modal and resets state', () => {
    render(<SendModal {...defaultProps} />);

    const recipientInput = screen.getByLabelText('Recipient Principal ID');
    const amountInput = screen.getByLabelText('Amount (ckTestBTC)');
    const cancelButton = screen.getByRole('button', { name: /cancel/i });

    // Fill in some data
    fireEvent.change(recipientInput, { target: { value: 'rdmx6-jaaaa-aaaah-qcaiq-cai' } });
    fireEvent.change(amountInput, { target: { value: '0.1' } });

    fireEvent.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('handles send error', async () => {
    const error = new Error('Network error');
    mockOnSend.mockRejectedValueOnce(error);

    render(<SendModal {...defaultProps} />);

    const recipientInput = screen.getByLabelText('Recipient Principal ID');
    const amountInput = screen.getByLabelText('Amount (ckTestBTC)');
    const sendButton = screen.getByRole('button', { name: /send ckTestBTC/i });

    fireEvent.change(recipientInput, { target: { value: 'rdmx6-jaaaa-aaaah-qcaiq-cai' } });
    fireEvent.change(amountInput, { target: { value: '0.1' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('accepts valid canister principal format', async () => {
    mockOnSend.mockResolvedValueOnce();

    render(<SendModal {...defaultProps} />);

    const recipientInput = screen.getByLabelText('Recipient Principal ID');
    const amountInput = screen.getByLabelText('Amount (ckTestBTC)');
    const sendButton = screen.getByRole('button', { name: /send ckTestBTC/i });

    // Long canister format
    fireEvent.change(recipientInput, { target: { value: 'g4xu7-jiaaa-aaaan-aaaaq-cai' } });
    fireEvent.change(amountInput, { target: { value: '0.1' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockOnSend).toHaveBeenCalledWith('ckTestBTC', 'g4xu7-jiaaa-aaaan-aaaaq-cai', '10000000');
    });
  });

  it('shows different descriptions for different tokens', () => {
    render(<SendModal {...defaultProps} />);

    // Initially ckTestBTC
    expect(screen.getByText('Send ckTestBTC tokens to another Principal ID on the Internet Computer.')).toBeInTheDocument();

    // Switch to ICP
    const icpButton = screen.getByRole('button', { name: /ICP 1\.00000000/ });
    fireEvent.click(icpButton);

    expect(screen.getByText('Send ICP tokens to another Principal ID on the Internet Computer.')).toBeInTheDocument();
  });

  it('shows token-specific help text', () => {
    render(<SendModal {...defaultProps} />);

    // Check ckTestBTC help text
    expect(screen.getByText('• ckTestBTC is an ICRC-2 token representing Bitcoin testnet')).toBeInTheDocument();

    // Switch to ICP
    const icpButton = screen.getByRole('button', { name: /ICP 1\.00000000/ });
    fireEvent.click(icpButton);

    // ckTestBTC help text should not be visible for ICP
    expect(screen.queryByText('• ckTestBTC is an ICRC-2 token representing Bitcoin testnet')).not.toBeInTheDocument();
  });
});