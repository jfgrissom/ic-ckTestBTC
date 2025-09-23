import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SendModal from './index';

describe('SendModal Component', () => {
  const mockOnSend = vi.fn();
  const mockOnOpenChange = vi.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    onSend: mockOnSend,
    ckTestBTCBalance: '200000000', // 2 ckTestBTC
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when open', () => {
    render(<SendModal {...defaultProps} />);
    expect(screen.getByText('Send ckTestBTC')).toBeInTheDocument();
    expect(screen.getByLabelText('Recipient Principal ID')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount (ckTestBTC)')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<SendModal {...defaultProps} open={false} />);
    expect(screen.queryByText('Send ckTestBTC')).not.toBeInTheDocument();
  });

  it('displays correct balances for ckTestBTC', () => {
    render(<SendModal {...defaultProps} />);

    // Should show ckTestBTC balance initially (default selected)
    expect(screen.getByText('Balance: 2.00000000 ckTestBTC')).toBeInTheDocument();
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

  it('handles Max button click for ckTestBTC', () => {
    render(<SendModal {...defaultProps} />);

    const maxButton = screen.getByRole('button', { name: /max/i });
    const amountInput = screen.getByLabelText('Amount (ckTestBTC)');

    fireEvent.click(maxButton);

    // Should set to balance minus fee reserve (2.0 - 0.00001)
    expect(amountInput.value).toBe('1.99999000');
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
});