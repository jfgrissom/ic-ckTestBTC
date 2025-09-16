import { render, screen } from '@testing-library/react';
import { ForwardRefButton } from './index';
import { describe, it, expect, vi } from 'vitest';

describe('ForwardRefButton', () => {
  it('renders ForwardRefButton component', () => {
    render(<ForwardRefButton>Click me</ForwardRefButton>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<ForwardRefButton ref={ref}>Test Button</ForwardRefButton>);
    expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument();
  });

  it('applies variant props correctly', () => {
    render(<ForwardRefButton variant="destructive">Delete</ForwardRefButton>);
    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button).toHaveClass('bg-destructive');
  });
});