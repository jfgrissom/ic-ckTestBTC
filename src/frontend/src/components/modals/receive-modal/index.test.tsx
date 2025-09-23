import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReceiveModal from './index';

// Mock the QRCode component
vi.mock('../../shared/qr-code', () => {
  return function MockQRCode({ value }: { value: string }) {
    return <div data-testid="qr-code">QR Code for: {value}</div>;
  };
});

describe('ReceiveModal Component', () => {
  const mockOnOpenChange = vi.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    userPrincipal: 'rdmx6-jaaaa-aaaah-qcaiq-cai',
    btcAddress: 'tb1qtest123address456789',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders when open', () => {
    render(<ReceiveModal {...defaultProps} />);
    expect(screen.getByText('Receive ckTestBTC')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ReceiveModal {...defaultProps} open={false} />);
    expect(screen.queryByText('Receive ckTestBTC')).not.toBeInTheDocument();
  });

  it('displays ckTestBTC by default with Bitcoin address', () => {
    render(<ReceiveModal {...defaultProps} />);

    expect(screen.getByText('Receive ckTestBTC')).toBeInTheDocument();
    expect(screen.getByText('Bitcoin Testnet Address:')).toBeInTheDocument();
    expect(screen.getByText('tb1qtest123address456789')).toBeInTheDocument();
    expect(screen.getByTestId('qr-code')).toBeInTheDocument();
  });

  it('shows Principal ID for ckTestBTC when no Bitcoin address provided', () => {
    render(<ReceiveModal {...defaultProps} btcAddress="" />);

    expect(screen.getByText('Your Principal ID:')).toBeInTheDocument();
    expect(screen.getByText('rdmx6-jaaaa-aaaah-qcaiq-cai')).toBeInTheDocument();
    expect(screen.queryByText('Bitcoin Testnet Address:')).not.toBeInTheDocument();
  });

  it('copies address to clipboard', async () => {
    render(<ReceiveModal {...defaultProps} />);

    const copyButton = screen.getByRole('button', { name: '' }); // Copy button has no text
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('tb1qtest123address456789');
    });

    // Check that the icon changes to checkmark briefly
    expect(screen.getByTestId('CheckCircle')).toBeInTheDocument();
  });

  it('shows alternative Principal ID info for ckTestBTC with Bitcoin address', () => {
    render(<ReceiveModal {...defaultProps} />);

    expect(screen.getByText(/Alternative:/)).toBeInTheDocument();
    expect(screen.getByText('rdmx6-jaaaa-aaaah-qcaiq-cai')).toBeInTheDocument();
    expect(screen.getByText(/for direct ICRC ckTestBTC transfers/)).toBeInTheDocument();
  });

  it('handles missing addresses gracefully', () => {
    render(<ReceiveModal {...defaultProps} userPrincipal="" btcAddress="" />);

    expect(screen.getByText('Address not available')).toBeInTheDocument();
    expect(screen.getByText('Please ensure you are logged in to view your receive address')).toBeInTheDocument();
  });

  it('closes modal and resets state', () => {
    render(<ReceiveModal {...defaultProps} />);

    // Close modal (simulate clicking outside or escape)
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows QR code with correct address value', () => {
    render(<ReceiveModal {...defaultProps} />);

    expect(screen.getByTestId('qr-code')).toHaveTextContent('QR Code for: tb1qtest123address456789');
  });

  it('handles copy button when no address available', async () => {
    render(<ReceiveModal {...defaultProps} userPrincipal="" btcAddress="" />);

    expect(screen.queryByRole('button', { name: '' })).not.toBeInTheDocument(); // Copy button should not exist
  });

  it('shows different descriptions for different token configurations', () => {
    // With Bitcoin address
    render(<ReceiveModal {...defaultProps} />);
    expect(screen.getByText(/You can receive ckTestBTC in two ways/)).toBeInTheDocument();

    // Without Bitcoin address
    render(<ReceiveModal {...defaultProps} btcAddress="" />);
    expect(screen.getByText(/Share your Principal ID to receive ckTestBTC tokens/)).toBeInTheDocument();
  });
});