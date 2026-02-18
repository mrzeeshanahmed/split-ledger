import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  StatCard,
  ActionCard,
} from '../Card';

describe('Card', () => {
  describe('Card', () => {
    it('renders children correctly', () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('applies padding classes correctly', () => {
      const { rerender } = render(<Card padding="none">Content</Card>);
      expect(screen.getByText('Content')).not.toHaveClass('p-3');
      expect(screen.getByText('Content')).not.toHaveClass('p-4');
      expect(screen.getByText('Content')).not.toHaveClass('p-6');

      rerender(<Card padding="sm">Content</Card>);
      expect(screen.getByText('Content')).toHaveClass('p-3');

      rerender(<Card padding="md">Content</Card>);
      expect(screen.getByText('Content')).toHaveClass('p-4');

      rerender(<Card padding="lg">Content</Card>);
      expect(screen.getByText('Content')).toHaveClass('p-6');
    });

    it('applies shadow classes correctly', () => {
      const { rerender } = render(<Card shadow="none">Content</Card>);
      expect(screen.getByText('Content')).toHaveClass('shadow-none');

      rerender(<Card shadow="sm">Content</Card>);
      expect(screen.getByText('Content')).toHaveClass('shadow-sm');

      rerender(<Card shadow="md">Content</Card>);
      expect(screen.getByText('Content')).toHaveClass('shadow-md');

      rerender(<Card shadow="lg">Content</Card>);
      expect(screen.getByText('Content')).toHaveClass('shadow-lg');
    });

    it('applies hover class when hover is true', () => {
      render(<Card hover>Content</Card>);
      expect(screen.getByText('Content')).toHaveClass('hover:shadow-md');
    });

    it('accepts custom className', () => {
      render(<Card className="custom-card">Content</Card>);
      expect(screen.getByText('Content')).toHaveClass('custom-card');
    });
  });

  describe('CardHeader', () => {
    it('renders children correctly', () => {
      render(<CardHeader>Header content</CardHeader>);
      expect(screen.getByText('Header content')).toBeInTheDocument();
    });
  });

  describe('CardTitle', () => {
    it('renders as h3 with correct styles', () => {
      render(<CardTitle>Card Title</CardTitle>);
      const title = screen.getByRole('heading', { name: 'Card Title' });
      expect(title).toHaveClass('text-lg');
      expect(title).toHaveClass('font-semibold');
    });
  });

  describe('CardDescription', () => {
    it('renders with correct styles', () => {
      render(<CardDescription>Card description</CardDescription>);
      expect(screen.getByText('Card description')).toHaveClass('text-sm');
      expect(screen.getByText('Card description')).toHaveClass('text-text-secondary');
    });
  });

  describe('CardContent', () => {
    it('renders children correctly', () => {
      render(<CardContent>Content body</CardContent>);
      expect(screen.getByText('Content body')).toBeInTheDocument();
    });
  });

  describe('CardFooter', () => {
    it('renders with border and padding', () => {
      render(<CardFooter>Footer</CardFooter>);
      expect(screen.getByText('Footer')).toHaveClass('mt-4');
      expect(screen.getByText('Footer')).toHaveClass('pt-4');
      expect(screen.getByText('Footer')).toHaveClass('border-t');
    });
  });

  describe('StatCard', () => {
    it('renders label and value', () => {
      render(<StatCard label="Total Users" value={1234} />);
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('1234')).toBeInTheDocument();
    });

    it('renders string value', () => {
      render(<StatCard label="Revenue" value="$1,234.56" />);
      expect(screen.getByText('$1,234.56')).toBeInTheDocument();
    });

    it('renders increase change', () => {
      render(
        <StatCard
          label="Users"
          value={100}
          change={{ value: 20, type: 'increase' }}
        />,
      );
      expect(screen.getByText('20%')).toBeInTheDocument();
      expect(screen.getByText('20%')).toHaveClass('text-accent-600');
    });

    it('renders decrease change', () => {
      render(
        <StatCard
          label="Users"
          value={100}
          change={{ value: 10, type: 'decrease' }}
        />,
      );
      expect(screen.getByText('10%')).toBeInTheDocument();
      expect(screen.getByText('10%')).toHaveClass('text-danger-600');
    });

    it('renders icon', () => {
      render(
        <StatCard
          label="Users"
          value={100}
          icon={<span data-testid="stat-icon">👤</span>}
        />,
      );
      expect(screen.getByTestId('stat-icon')).toBeInTheDocument();
    });
  });

  describe('ActionCard', () => {
    it('renders title and description', () => {
      render(
        <ActionCard
          title="Create Group"
          description="Start a new expense group"
        />,
      );
      expect(screen.getByText('Create Group')).toBeInTheDocument();
      expect(screen.getByText('Start a new expense group')).toBeInTheDocument();
    });

    it('handles click', () => {
      const handleClick = vi.fn();
      render(<ActionCard title="Create Group" onClick={handleClick} />);
      fireEvent.click(screen.getByText('Create Group'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles keyboard interaction', () => {
      const handleClick = vi.fn();
      render(<ActionCard title="Create Group" onClick={handleClick} />);
      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders icon', () => {
      render(
        <ActionCard
          title="Create Group"
          icon={<span data-testid="action-icon">+</span>}
        />,
      );
      expect(screen.getByTestId('action-icon')).toBeInTheDocument();
    });

    it('hides arrow when showArrow is false', () => {
      render(<ActionCard title="Create Group" onClick={() => {}} showArrow={false} />);
      const card = screen.getByRole('button');
      const arrow = card.querySelector('svg');
      expect(arrow).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('ActionCard has role="button" when clickable', () => {
      render(<ActionCard title="Click me" onClick={() => {}} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('ActionCard has tabindex when clickable', () => {
      render(<ActionCard title="Click me" onClick={() => {}} />);
      expect(screen.getByRole('button')).toHaveAttribute('tabindex', '0');
    });
  });
});
