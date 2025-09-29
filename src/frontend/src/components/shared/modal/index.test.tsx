import { render, screen, fireEvent } from '@testing-library/react';
import { Modal, ModalFooterActions } from './index';

describe('Modal Component', () => {
  const mockOnOpenChange = jest.fn();

  beforeEach(() => {
    mockOnOpenChange.mockClear();
  });

  it('renders modal with title and description', () => {
    render(
      <Modal
        open={true}
        onOpenChange={mockOnOpenChange}
        title="Test Modal"
        description="Test description"
      >
        <div>Modal content</div>
      </Modal>
    );

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('renders modal without description', () => {
    render(
      <Modal open={true} onOpenChange={mockOnOpenChange} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.queryByText('Test description')).not.toBeInTheDocument();
  });

  it('renders footer when provided', () => {
    render(
      <Modal
        open={true}
        onOpenChange={mockOnOpenChange}
        title="Test Modal"
        footer={<button>Footer Button</button>}
      >
        <div>Modal content</div>
      </Modal>
    );

    expect(screen.getByText('Footer Button')).toBeInTheDocument();
  });

  it('does not render footer when not provided', () => {
    const { container } = render(
      <Modal open={true} onOpenChange={mockOnOpenChange} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );

    expect(container.querySelector('[role="dialog"] footer')).not.toBeInTheDocument();
  });

  it('applies correct size classes', () => {
    const { rerender, container } = render(
      <Modal open={true} onOpenChange={mockOnOpenChange} title="Test" size="sm">
        <div>Content</div>
      </Modal>
    );

    let dialogContent = container.querySelector('[role="dialog"]');
    expect(dialogContent?.className).toContain('sm:max-w-md');

    rerender(
      <Modal open={true} onOpenChange={mockOnOpenChange} title="Test" size="md">
        <div>Content</div>
      </Modal>
    );
    dialogContent = container.querySelector('[role="dialog"]');
    expect(dialogContent?.className).toContain('sm:max-w-lg');

    rerender(
      <Modal open={true} onOpenChange={mockOnOpenChange} title="Test" size="lg">
        <div>Content</div>
      </Modal>
    );
    dialogContent = container.querySelector('[role="dialog"]');
    expect(dialogContent?.className).toContain('sm:max-w-2xl');
  });

  it('applies scrollability classes', () => {
    const { container } = render(
      <Modal open={true} onOpenChange={mockOnOpenChange} title="Test">
        <div>Content</div>
      </Modal>
    );

    const dialogContent = container.querySelector('[role="dialog"]');
    expect(dialogContent?.className).toContain('max-h-[90vh]');
    expect(dialogContent?.className).toContain('overflow-y-auto');
  });

  it('applies custom className', () => {
    const { container } = render(
      <Modal
        open={true}
        onOpenChange={mockOnOpenChange}
        title="Test"
        className="custom-class"
      >
        <div>Content</div>
      </Modal>
    );

    const dialogContent = container.querySelector('[role="dialog"]');
    expect(dialogContent?.className).toContain('custom-class');
  });
});

describe('ModalFooterActions Component', () => {
  const mockOnCancel = jest.fn();
  const mockOnConfirm = jest.fn();

  beforeEach(() => {
    mockOnCancel.mockClear();
    mockOnConfirm.mockClear();
  });

  it('renders cancel and confirm buttons with default text', () => {
    render(
      <ModalFooterActions onCancel={mockOnCancel} onConfirm={mockOnConfirm} />
    );

    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('renders custom button text', () => {
    render(
      <ModalFooterActions
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
        cancelText="Go Back"
        confirmText="Submit"
      />
    );

    expect(screen.getByText('Go Back')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <ModalFooterActions onCancel={mockOnCancel} onConfirm={mockOnConfirm} />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when confirm button is clicked', () => {
    render(
      <ModalFooterActions onCancel={mockOnCancel} onConfirm={mockOnConfirm} />
    );

    fireEvent.click(screen.getByText('Confirm'));
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('disables buttons when loading', () => {
    render(
      <ModalFooterActions
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
        loading={true}
      />
    );

    expect(screen.getByText('Cancel')).toBeDisabled();
    expect(screen.getByText('Processing...')).toBeDisabled();
  });

  it('disables buttons when disabled prop is true', () => {
    render(
      <ModalFooterActions
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
        disabled={true}
      />
    );

    expect(screen.getByText('Cancel')).toBeDisabled();
    expect(screen.getByText('Confirm')).toBeDisabled();
  });

  it('disables only confirm button when confirmDisabled is true', () => {
    render(
      <ModalFooterActions
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
        confirmDisabled={true}
      />
    );

    expect(screen.getByText('Cancel')).not.toBeDisabled();
    expect(screen.getByText('Confirm')).toBeDisabled();
  });

  it('shows loading text when loading', () => {
    render(
      <ModalFooterActions
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
        confirmText="Submit"
        loading={true}
      />
    );

    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(screen.queryByText('Submit')).not.toBeInTheDocument();
  });
});