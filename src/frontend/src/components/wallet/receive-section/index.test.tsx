import { render, screen } from '@testing-library/react';
import ReceiveSection from './index';
import { describe, it, expect, vi } from 'vitest';

describe('ReceiveSection', () => {
  const mockProps = {
    btcAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
    principal: 'rdmx6-jaaaa-aaaah-qcaaq-cai',
    onCopyBtcAddress: vi.fn(),
    onCopyPrincipal: vi.fn(),
  };

  it('renders ReceiveSection component', () => {
    render(<ReceiveSection {...mockProps} />);
    expect(screen.getByText('Receive ckTestBTC')).toBeInTheDocument();
    expect(screen.getByText('Bitcoin Testnet Address')).toBeInTheDocument();
    expect(screen.getByText('IC Principal ID')).toBeInTheDocument();
  });

  it('displays addresses', () => {
    render(<ReceiveSection {...mockProps} />);
    expect(screen.getByText(mockProps.btcAddress)).toBeInTheDocument();
    expect(screen.getByText(mockProps.principal)).toBeInTheDocument();
  });
});