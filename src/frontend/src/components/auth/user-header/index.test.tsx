import { render, screen } from '@testing-library/react';
import UserHeader from './index';
import { describe, it, expect, vi } from 'vitest';

describe('UserHeader', () => {
  const mockProps = {
    principal: 'rdmx6-jaaaa-aaaah-qcaaq-cai',
    onLogout: vi.fn(),
  };

  it('renders UserHeader component', () => {
    render(<UserHeader {...mockProps} />);
    expect(screen.getByText('ckTestBTC Wallet')).toBeInTheDocument();
    expect(screen.getByText('Principal:')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('displays truncated principal', () => {
    render(<UserHeader {...mockProps} />);
    expect(screen.getByText('rdmx6-ja...')).toBeInTheDocument();
  });
});