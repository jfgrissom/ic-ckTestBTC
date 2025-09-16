import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ActionButton from './index';

describe('ActionButton Component', () => {
  it('renders children correctly', () => {
    render(<ActionButton onClick={() => {}}>Click me</ActionButton>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const mockOnClick = jest.fn();
    render(<ActionButton onClick={mockOnClick}>Click me</ActionButton>);

    fireEvent.click(screen.getByRole('button'));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<ActionButton onClick={() => {}} loading={true}>Click me</ActionButton>);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('is disabled when loading', () => {
    render(<ActionButton onClick={() => {}} loading={true}>Click me</ActionButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders icon when provided', () => {
    const icon = <span data-testid="test-icon">🚀</span>;
    render(<ActionButton onClick={() => {}} icon={icon}>Click me</ActionButton>);
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });
});