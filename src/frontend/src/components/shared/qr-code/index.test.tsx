import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import QRCode from './index';

describe('QRCode Component', () => {
  it('renders QR code with provided value', () => {
    render(<QRCode value="test-value" />);
    // QR code canvas should be rendered
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <QRCode value="test" className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});