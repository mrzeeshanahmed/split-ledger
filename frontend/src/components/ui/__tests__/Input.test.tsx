import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InputField, TextAreaField, SelectField, SearchField } from '../Input';

describe('Input', () => {
  describe('InputField', () => {
    it('renders with label', () => {
      render(<InputField label="Email" />);
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      render(<InputField placeholder="Enter email" />);
      expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
    });

    it('shows required indicator', () => {
      render(<InputField label="Email" required />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('shows helper text', () => {
      render(<InputField label="Email" helperText="Enter your email address" />);
      expect(screen.getByText('Enter your email address')).toBeInTheDocument();
    });

    it('shows error message', () => {
      render(<InputField label="Email" error="Invalid email" />);
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });

    it('applies error styles when error is present', () => {
      render(<InputField label="Email" error="Invalid email" />);
      const input = screen.getByLabelText('Email');
      expect(input).toHaveClass('border-danger-500');
    });

    it('is disabled when disabled prop is true', () => {
      render(<InputField label="Email" disabled />);
      expect(screen.getByLabelText('Email')).toBeDisabled();
    });

    it('handles value changes', () => {
      const handleChange = vi.fn();
      render(<InputField label="Email" onChange={handleChange} />);
      const input = screen.getByLabelText('Email');
      fireEvent.change(input, { target: { value: 'test@example.com' } });
      expect(handleChange).toHaveBeenCalled();
    });

    it('renders with left element', () => {
      render(
        <InputField
          label="Email"
          leftElement={<span data-testid="left-icon">@</span>}
        />,
      );
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('renders with right element', () => {
      render(
        <InputField
          label="Email"
          rightElement={<span data-testid="right-icon">✓</span>}
        />,
      );
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('applies size classes correctly', () => {
      const { rerender } = render(<InputField label="Email" size="sm" />);
      expect(screen.getByLabelText('Email')).toHaveClass('py-1.5');

      rerender(<InputField label="Email" size="md" />);
      expect(screen.getByLabelText('Email')).toHaveClass('py-2');

      rerender(<InputField label="Email" size="lg" />);
      expect(screen.getByLabelText('Email')).toHaveClass('py-2.5');
    });

    it('sets aria-invalid when error is present', () => {
      render(<InputField label="Email" error="Invalid email" />);
      expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('TextAreaField', () => {
    it('renders with label', () => {
      render(<TextAreaField label="Description" />);
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
    });

    it('renders with correct number of rows', () => {
      render(<TextAreaField label="Description" rows={6} />);
      const textarea = screen.getByLabelText('Description');
      expect(textarea).toHaveAttribute('rows', '6');
    });

    it('shows error message', () => {
      render(<TextAreaField label="Description" error="Too short" />);
      expect(screen.getByText('Too short')).toBeInTheDocument();
    });

    it('is resizable', () => {
      render(<TextAreaField label="Description" />);
      expect(screen.getByLabelText('Description')).toHaveClass('resize-y');
    });
  });

  describe('SelectField', () => {
    const options = [
      { value: 'us', label: 'United States' },
      { value: 'uk', label: 'United Kingdom' },
      { value: 'ca', label: 'Canada' },
    ];

    it('renders with label', () => {
      render(<SelectField label="Country" options={options} />);
      expect(screen.getByLabelText('Country')).toBeInTheDocument();
    });

    it('renders all options', () => {
      render(<SelectField label="Country" options={options} />);
      expect(screen.getByText('United States')).toBeInTheDocument();
      expect(screen.getByText('United Kingdom')).toBeInTheDocument();
      expect(screen.getByText('Canada')).toBeInTheDocument();
    });

    it('renders placeholder', () => {
      render(
        <SelectField label="Country" options={options} placeholder="Select country" />,
      );
      expect(screen.getByText('Select country')).toBeInTheDocument();
    });

    it('shows error message', () => {
      render(<SelectField label="Country" options={options} error="Required" />);
      expect(screen.getByText('Required')).toBeInTheDocument();
    });

    it('handles selection change', () => {
      const handleChange = vi.fn();
      render(<SelectField label="Country" options={options} onChange={handleChange} />);
      const select = screen.getByLabelText('Country');
      fireEvent.change(select, { target: { value: 'uk' } });
      expect(handleChange).toHaveBeenCalled();
    });

    it('supports disabled options', () => {
      const optionsWithDisabled = [
        { value: 'us', label: 'United States', disabled: true },
        { value: 'uk', label: 'United Kingdom' },
      ];
      render(<SelectField label="Country" options={optionsWithDisabled} />);
      const disabledOption = screen.getByText('United States').closest('option');
      expect(disabledOption).toBeDisabled();
    });
  });

  describe('SearchField', () => {
    it('renders with search icon', () => {
      render(<SearchField label="Search" />);
      const icon = screen.getByLabelText('Search').parentElement?.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('has search input type', () => {
      render(<SearchField label="Search" />);
      expect(screen.getByLabelText('Search')).toHaveAttribute('type', 'search');
    });

    it('handles search input', () => {
      const handleChange = vi.fn();
      render(<SearchField label="Search" onChange={handleChange} />);
      const input = screen.getByLabelText('Search');
      fireEvent.change(input, { target: { value: 'query' } });
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('associates error with input via aria-describedby', () => {
      render(<InputField label="Email" error="Invalid email" id="email-input" />);
      const input = screen.getByLabelText('Email');
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
    });

    it('associates helper text with input via aria-describedby', () => {
      render(<InputField label="Email" helperText="Enter your email" id="email-input" />);
      const input = screen.getByLabelText('Email');
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
    });
  });
});
