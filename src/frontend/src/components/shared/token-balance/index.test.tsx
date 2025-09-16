import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TokenBalance from './index';

describe('TokenBalance Component', () => {
  it('displays ICP balance correctly', () => {
    render(<TokenBalance token="ICP" balance="100000000" />);
    expect(screen.getByText('1.00000000')).toBeInTheDocument();
    expect(screen.getByText('ICP')).toBeInTheDocument();
  });

  it('displays ckTestBTC balance correctly', () => {
    render(<TokenBalance token="ckTestBTC" balance="50000000" />);
    expect(screen.getByText('0.50000000')).toBeInTheDocument();
    expect(screen.getByText('ckTestBTC')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<TokenBalance token="ICP" balance="0" loading={true} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('handles zero balance', () => {
    render(<TokenBalance token="ICP" balance="0" />);
    expect(screen.getByText('0.00000000')).toBeInTheDocument();
  });
});