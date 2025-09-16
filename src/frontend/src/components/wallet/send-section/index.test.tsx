import { render, screen } from '@testing-library/react';
import SendSection from './index';
import { describe, it, expect, vi } from 'vitest';

describe('SendSection', () => {
  const mockProps = {
    sendAmount: '',
    sendTo: '',
    loading: false,
    onSendAmountChange: vi.fn(),
    onSendToChange: vi.fn(),
    onSend: vi.fn(),
  };

  it('renders SendSection component', () => {
    render(<SendSection {...mockProps} />);
    expect(screen.getByText('Send ckTestBTC')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter recipient\'s Principal ID')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0.00000000')).toBeInTheDocument();
  });

  it('disables send button when form is invalid', () => {
    render(<SendSection {...mockProps} />);
    const sendButton = screen.getByRole('button', { name: /Send Transaction/i });
    expect(sendButton).toBeDisabled();
  });
});