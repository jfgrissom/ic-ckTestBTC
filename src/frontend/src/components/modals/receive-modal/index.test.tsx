import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReceiveModal from './index';

// Mock the QRCode component
jest.mock('../../shared/qr-code', () => {
  return function MockQRCode({ value }: { value: string }) {
    return <div data-testid="qr-code">QR Code for: {value}</div>;
  };
});

describe('ReceiveModal Component', () => {
  const mockOnOpenChange = jest.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    userPrincipal: 'rdmx6-jaaaa-aaaah-qcaiq-cai',
    btcAddress: 'tb1qtest123address456789',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders when open', () => {
    render(<ReceiveModal {...defaultProps} />);
    expect(screen.getByText('Receive ckTestBTC')).toBeInTheDocument();
    expect(screen.getByLabelText('Select Token to Receive')).toBeInTheDocument();
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

  it('switches to ICP and shows Principal ID', () => {
    render(<ReceiveModal {...defaultProps} />);

    const icpButton = screen.getByRole('button', { name: /ICP Internet Computer/i });
    fireEvent.click(icpButton);

    expect(screen.getByText('Receive ICP')).toBeInTheDocument();
    expect(screen.getByText('Your Principal ID:')).toBeInTheDocument();
    expect(screen.getByText('rdmx6-jaaaa-aaaah-qcaiq-cai')).toBeInTheDocument();
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

  it('does not show alternative info for ICP', () => {
    render(<ReceiveModal {...defaultProps} />);

    const icpButton = screen.getByRole('button', { name: /ICP Internet Computer/i });
    fireEvent.click(icpButton);

    expect(screen.queryByText(/Alternative:/)).not.toBeInTheDocument();
  });

  it('shows different instructions for ckTestBTC vs ICP', () => {
    render(<ReceiveModal {...defaultProps} />);

    // ckTestBTC instructions
    expect(screen.getByText('For Bitcoin testnet: Send TestBTC to the Bitcoin address above')).toBeInTheDocument();
    expect(screen.getByText('Only send TestBTC (not mainnet Bitcoin) to the Bitcoin address')).toBeInTheDocument();

    // Switch to ICP
    const icpButton = screen.getByRole('button', { name: /ICP Internet Computer/i });
    fireEvent.click(icpButton);

    // ICP instructions
    expect(screen.getByText('Share your Principal ID with the sender')).toBeInTheDocument();
    expect(screen.getByText('They can send ICP tokens directly to this Principal ID')).toBeInTheDocument();
    expect(screen.queryByText('For Bitcoin testnet: Send TestBTC to the Bitcoin address above')).not.toBeInTheDocument();
  });

  it('shows appropriate warnings for each token type', () => {
    render(<ReceiveModal {...defaultProps} />);

    // ckTestBTC warnings
    expect(screen.getByText('Minimum Bitcoin deposit: 0.00001 TestBTC')).toBeInTheDocument();
    expect(screen.getByText('Bitcoin deposits may take several confirmations to appear')).toBeInTheDocument();

    // Switch to ICP
    const icpButton = screen.getByRole('button', { name: /ICP Internet Computer/i });
    fireEvent.click(icpButton);

    // ICP warnings
    expect(screen.getByText('Make sure the sender is using the Internet Computer network')).toBeInTheDocument();
    expect(screen.queryByText('Minimum Bitcoin deposit: 0.00001 TestBTC')).not.toBeInTheDocument();
  });

  it('handles missing addresses gracefully', () => {
    render(<ReceiveModal {...defaultProps} userPrincipal="" btcAddress="" />);

    expect(screen.getByText('Address not available')).toBeInTheDocument();
    expect(screen.getByText('Please ensure you are logged in to view your receive address')).toBeInTheDocument();
  });

  it('handles missing Principal ID for ICP', () => {
    render(<ReceiveModal {...defaultProps} userPrincipal="" />);

    const icpButton = screen.getByRole('button', { name: /ICP Internet Computer/i });
    fireEvent.click(icpButton);

    expect(screen.getByText('Principal ID not available')).toBeInTheDocument();
  });

  it('closes modal and resets state', () => {
    render(<ReceiveModal {...defaultProps} />);

    // Switch to ICP first
    const icpButton = screen.getByRole('button', { name: /ICP Internet Computer/i });
    fireEvent.click(icpButton);

    expect(screen.getByText('Receive ICP')).toBeInTheDocument();

    // Close modal (simulate clicking outside or escape)
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows QR code with correct address value', () => {
    render(<ReceiveModal {...defaultProps} />);

    expect(screen.getByTestId('qr-code')).toHaveTextContent('QR Code for: tb1qtest123address456789');

    // Switch to ICP
    const icpButton = screen.getByRole('button', { name: /ICP Internet Computer/i });
    fireEvent.click(icpButton);

    expect(screen.getByTestId('qr-code')).toHaveTextContent('QR Code for: rdmx6-jaaaa-aaaah-qcaiq-cai');
  });

  it('handles copy button when no address available', async () => {
    render(<ReceiveModal {...defaultProps} userPrincipal="" btcAddress="" />);

    expect(screen.queryByRole('button', { name: '' })).not.toBeInTheDocument(); // Copy button should not exist
  });

  it('resets copied state when switching tokens', async () => {
    render(<ReceiveModal {...defaultProps} />);

    // Copy address
    const copyButton = screen.getByRole('button', { name: '' });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(screen.getByTestId('CheckCircle')).toBeInTheDocument();
    });

    // Switch to ICP
    const icpButton = screen.getByRole('button', { name: /ICP Internet Computer/i });
    fireEvent.click(icpButton);

    // Copy state should reset - checkmark should not be visible
    await waitFor(() => {
      expect(screen.queryByTestId('CheckCircle')).not.toBeInTheDocument();
    });
  });

  it('shows different descriptions for different token configurations', () => {
    // With Bitcoin address
    render(<ReceiveModal {...defaultProps} />);
    expect(screen.getByText(/You can receive ckTestBTC in two ways/)).toBeInTheDocument();

    // Without Bitcoin address
    render(<ReceiveModal {...defaultProps} btcAddress="" />);
    expect(screen.getByText(/Share your Principal ID to receive ckTestBTC tokens/)).toBeInTheDocument();

    // ICP
    render(<ReceiveModal {...defaultProps} />);
    const icpButton = screen.getByRole('button', { name: /ICP Internet Computer/i });
    fireEvent.click(icpButton);
    expect(screen.getByText(/Share your Principal ID to receive ICP tokens/)).toBeInTheDocument();
  });
});