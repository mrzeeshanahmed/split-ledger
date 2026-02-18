import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PrimaryButton, SecondaryButton, DangerButton, GhostButton } from '../Button';

describe('Button', () => {
  describe('PrimaryButton', () => {
    it('renders children correctly', () => {
      render(<PrimaryButton>Click me</PrimaryButton>);
      expect(screen.getByRole('button')).toHaveTextContent('Click me');
    });

    it('handles click events', () => {
      const handleClick = vi.fn();
      render(<PrimaryButton onClick={handleClick}>Click me</PrimaryButton>);
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('is disabled when disabled prop is true', () => {
      render(<PrimaryButton disabled>Click me</PrimaryButton>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('is disabled when loading', () => {
      render(<PrimaryButton loading>Click me</PrimaryButton>);
      expect(screen.getByRole('button')).toBeDisabled();
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    it('shows loading spinner when loading', () => {
      render(<PrimaryButton loading>Click me</PrimaryButton>);
      const spinner = screen.getByRole('button').querySelector('svg');
      expect(spinner).toBeInTheDocument();
    });

    it('renders with left icon', () => {
      render(
        <PrimaryButton leftIcon={<span data-testid="left-icon">L</span>}>
          Click me
        </PrimaryButton>,
      );
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('renders with right icon', () => {
      render(
        <PrimaryButton rightIcon={<span data-testid="right-icon">R</span>}>
          Click me
        </PrimaryButton>,
      );
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('applies full width class', () => {
      render(<PrimaryButton fullWidth>Click me</PrimaryButton>);
      expect(screen.getByRole('button')).toHaveClass('w-full');
    });

    it('applies size classes correctly', () => {
      const { rerender } = render(<PrimaryButton size="sm">Small</PrimaryButton>);
      expect(screen.getByRole('button')).toHaveClass('px-3', 'py-1.5');

      rerender(<PrimaryButton size="md">Medium</PrimaryButton>);
      expect(screen.getByRole('button')).toHaveClass('px-4', 'py-2');

      rerender(<PrimaryButton size="lg">Large</PrimaryButton>);
      expect(screen.getByRole('button')).toHaveClass('px-5', 'py-2.5');
    });

    it('accepts custom className', () => {
      render(<PrimaryButton className="custom-class">Click me</PrimaryButton>);
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });
  });

  describe('SecondaryButton', () => {
    it('renders with secondary styles', () => {
      render(<SecondaryButton>Secondary</SecondaryButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-white');
      expect(button).toHaveClass('border');
    });
  });

  describe('DangerButton', () => {
    it('renders with danger styles', () => {
      render(<DangerButton>Delete</DangerButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-danger-600');
      expect(button).toHaveClass('text-white');
    });
  });

  describe('GhostButton', () => {
    it('renders with ghost styles', () => {
      render(<GhostButton>Ghost</GhostButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-transparent');
    });
  });

  describe('Accessibility', () => {
    it('accepts aria-label', () => {
      render(<PrimaryButton aria-label="Submit form">Submit</PrimaryButton>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Submit form');
    });

    it('has focus-visible ring styles', () => {
      render(<PrimaryButton>Click me</PrimaryButton>);
      expect(screen.getByRole('button')).toHaveClass('focus-visible:ring-2');
    });
  });
});
