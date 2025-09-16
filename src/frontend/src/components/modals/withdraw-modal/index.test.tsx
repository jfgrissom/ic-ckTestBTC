import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import WithdrawModal from './index';

describe('WithdrawModal Component', () => {
  const mockOnWithdraw = jest.fn();
  const mockOnOpenChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when open', () => {
    render(
      <WithdrawModal
        open={true}
        onOpenChange={mockOnOpenChange}
        balance="100000000"
      />
    );
    expect(screen.getByText('Withdraw to TestBTC')).toBeInTheDocument();
    expect(screen.getByLabelText('TestBTC Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount (ckTestBTC)')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <WithdrawModal
        open={false}
        onOpenChange={mockOnOpenChange}
      />
    );
    expect(screen.queryByText('Withdraw to TestBTC')).not.toBeInTheDocument();
  });

  it('displays correct balance', () => {
    render(
      <WithdrawModal
        open={true}
        onOpenChange={mockOnOpenChange}
        balance="100000000" // 1 ckTestBTC in satoshis
      />
    );
    expect(screen.getByText('Balance: 1.00000000 ckTestBTC')).toBeInTheDocument();
  });

  it('validates empty address', async () => {
    render(
      <WithdrawModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onWithdraw={mockOnWithdraw}
        balance="100000000"
      />
    );

    const withdrawButton = screen.getByRole('button', { name: /withdraw/i });
    fireEvent.click(withdrawButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a TestBTC address')).toBeInTheDocument();
    });
    expect(mockOnWithdraw).not.toHaveBeenCalled();
  });

  it('validates invalid address format', async () => {
    render(
      <WithdrawModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onWithdraw={mockOnWithdraw}
        balance="100000000"
      />
    );

    const addressInput = screen.getByLabelText('TestBTC Address');
    const withdrawButton = screen.getByRole('button', { name: /withdraw/i });

    fireEvent.change(addressInput, { target: { value: 'invalid-address' } });
    fireEvent.click(withdrawButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid TestBTC address format')).toBeInTheDocument();
    });
    expect(mockOnWithdraw).not.toHaveBeenCalled();
  });

  it('validates empty amount', async () => {
    render(
      <WithdrawModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onWithdraw={mockOnWithdraw}
        balance="100000000"
      />
    );

    const addressInput = screen.getByLabelText('TestBTC Address');
    const withdrawButton = screen.getByRole('button', { name: /withdraw/i });

    fireEvent.change(addressInput, { target: { value: 'tb1qtest123address456789' } });
    fireEvent.click(withdrawButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter an amount')).toBeInTheDocument();
    });
    expect(mockOnWithdraw).not.toHaveBeenCalled();
  });

  it('validates minimum amount', async () => {
    render(
      <WithdrawModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onWithdraw={mockOnWithdraw}
        balance="100000000"
      />
    );

    const addressInput = screen.getByLabelText('TestBTC Address');
    const amountInput = screen.getByLabelText('Amount (ckTestBTC)');
    const withdrawButton = screen.getByRole('button', { name: /withdraw/i });

    fireEvent.change(addressInput, { target: { value: 'tb1qtest123address456789' } });
    fireEvent.change(amountInput, { target: { value: '0.000001' } });
    fireEvent.click(withdrawButton);

    await waitFor(() => {
      expect(screen.getByText('Minimum withdrawal amount is 0.00001 TestBTC')).toBeInTheDocument();
    });
    expect(mockOnWithdraw).not.toHaveBeenCalled();
  });

  it('validates amount exceeds balance', async () => {
    render(
      <WithdrawModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onWithdraw={mockOnWithdraw}
        balance="100000000" // 1 ckTestBTC
      />
    );

    const addressInput = screen.getByLabelText('TestBTC Address');
    const amountInput = screen.getByLabelText('Amount (ckTestBTC)');
    const withdrawButton = screen.getByRole('button', { name: /withdraw/i });

    fireEvent.change(addressInput, { target: { value: 'tb1qtest123address456789' } });
    fireEvent.change(amountInput, { target: { value: '2.0' } });
    fireEvent.click(withdrawButton);

    await waitFor(() => {
      expect(screen.getByText('Amount exceeds available balance')).toBeInTheDocument();
    });
    expect(mockOnWithdraw).not.toHaveBeenCalled();
  });

  it('calls onWithdraw with valid inputs', async () => {
    mockOnWithdraw.mockResolvedValueOnce();

    render(
      <WithdrawModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onWithdraw={mockOnWithdraw}
        balance="100000000"
      />
    );

    const addressInput = screen.getByLabelText('TestBTC Address');
    const amountInput = screen.getByLabelText('Amount (ckTestBTC)');
    const withdrawButton = screen.getByRole('button', { name: /withdraw/i });

    fireEvent.change(addressInput, { target: { value: 'tb1qtest123address456789' } });
    fireEvent.change(amountInput, { target: { value: '0.5' } });
    fireEvent.click(withdrawButton);

    await waitFor(() => {
      expect(mockOnWithdraw).toHaveBeenCalledWith('tb1qtest123address456789', '50000000');
    });
  });

  it('handles Max button click', () => {
    render(
      <WithdrawModal
        open={true}
        onOpenChange={mockOnOpenChange}
        balance="100000000" // 1 ckTestBTC
      />
    );

    const maxButton = screen.getByRole('button', { name: /max/i });
    const amountInput = screen.getByLabelText('Amount (ckTestBTC)');

    fireEvent.click(maxButton);

    // Should set to balance minus fee reserve
    expect(amountInput.value).toBe('0.99999000');
  });

  it('shows loading state', () => {
    render(
      <WithdrawModal
        open={true}
        onOpenChange={mockOnOpenChange}
        loading={true}
        balance="100000000"
      />
    );

    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /processing/i })).toBeDisabled();
  });

  it('closes modal and resets state', () => {
    render(
      <WithdrawModal
        open={true}
        onOpenChange={mockOnOpenChange}
        balance="100000000"
      />
    );

    const addressInput = screen.getByLabelText('TestBTC Address');
    const amountInput = screen.getByLabelText('Amount (ckTestBTC)');
    const cancelButton = screen.getByRole('button', { name: /cancel/i });

    // Fill in some data
    fireEvent.change(addressInput, { target: { value: 'tb1qtest123' } });
    fireEvent.change(amountInput, { target: { value: '0.1' } });

    fireEvent.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('handles withdraw error', async () => {
    const error = new Error('Network error');
    mockOnWithdraw.mockRejectedValueOnce(error);

    render(
      <WithdrawModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onWithdraw={mockOnWithdraw}
        balance="100000000"
      />
    );

    const addressInput = screen.getByLabelText('TestBTC Address');
    const amountInput = screen.getByLabelText('Amount (ckTestBTC)');
    const withdrawButton = screen.getByRole('button', { name: /withdraw/i });

    fireEvent.change(addressInput, { target: { value: 'tb1qtest123address456789' } });
    fireEvent.change(amountInput, { target: { value: '0.1' } });
    fireEvent.click(withdrawButton);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });
});