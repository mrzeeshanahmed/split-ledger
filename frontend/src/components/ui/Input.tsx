import React, { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * Input sizes
 */
export type InputSize = 'sm' | 'md' | 'lg';

/**
 * Base field props shared across input types
 */
export interface BaseFieldProps {
  /** Label text */
  label?: string;
  /** Helper text displayed below input */
  helperText?: string;
  /** Error message */
  error?: string;
  /** Required field indicator */
  required?: boolean;
  /** Size variant */
  size?: InputSize;
  /** Full width */
  fullWidth?: boolean;
}

/**
 * InputField props
 */
export interface InputFieldProps
  extends BaseFieldProps,
  Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Left icon or element */
  leftElement?: React.ReactNode;
  /** Right icon or element */
  rightElement?: React.ReactNode;
}

/**
 * TextAreaField props
 */
export interface TextAreaFieldProps
  extends BaseFieldProps,
  TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Number of rows */
  rows?: number;
}

/**
 * SelectField props
 */
export interface SelectFieldProps
  extends BaseFieldProps,
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Select options */
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  /** Placeholder text */
  placeholder?: string;
}

/**
 * Size styles for inputs
 */
const sizeStyles: Record<InputSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-2.5 text-base',
};

/**
 * Label component
 */
function FieldLabel({
  label,
  required,
  id,
}: {
  label: string;
  required?: boolean;
  id?: string;
}) {
  return (
    <label htmlFor={id} className="block text-sm font-medium text-text-primary mb-1.5">
      {label}
      {required && <span className="text-danger-500 ml-1">*</span>}
    </label>
  );
}

/**
 * Helper text component
 */
function HelperText({ text, error }: { text?: string; error?: string }) {
  if (error) {
    return <p className="text-xs text-danger-600 mt-1">{error}</p>;
  }
  if (text) {
    return <p className="text-xs text-text-secondary mt-1">{text}</p>;
  }
  return null;
}

/**
 * InputField - Text input with label and error state
 */
export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      label,
      helperText,
      error,
      required,
      size = 'md',
      fullWidth = true,
      leftElement,
      rightElement,
      className,
      id,
      disabled,
      ...props
    },
    ref,
  ) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 11)}`;

    return (
      <div className={cn(fullWidth ? 'w-full' : 'inline-block')}>
        {label && <FieldLabel label={label} required={required} id={inputId} />}
        <div className="relative">
          {leftElement && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
              {leftElement}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(
              'w-full border rounded-lg bg-white/5 text-white transition-all duration-300',
              'placeholder:text-zinc-500',
              'focus:outline-none focus:ring-2 focus:border-violet-500 focus:ring-violet-500/50 focus:bg-white/10',
              'disabled:bg-white/5 disabled:cursor-not-allowed disabled:text-zinc-600 disabled:opacity-50',
              error
                ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
                : 'border-white/10 hover:border-white/20',
              sizeStyles[size],
              leftElement && 'pl-10',
              rightElement && 'pr-10',
              className,
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />
          {rightElement && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-text-muted">
              {rightElement}
            </div>
          )}
        </div>
        <HelperText text={helperText} error={error} />
      </div>
    );
  },
);

InputField.displayName = 'InputField';

/**
 * TextAreaField - Multi-line text input
 */
export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  (
    {
      label,
      helperText,
      error,
      required,
      size = 'md',
      fullWidth = true,
      rows = 4,
      className,
      id,
      disabled,
      ...props
    },
    ref,
  ) => {
    const inputId = id || `textarea-${Math.random().toString(36).slice(2, 11)}`;

    return (
      <div className={cn(fullWidth ? 'w-full' : 'inline-block')}>
        {label && <FieldLabel label={label} required={required} id={inputId} />}
        <textarea
          ref={ref}
          id={inputId}
          disabled={disabled}
          rows={rows}
          className={cn(
            'w-full border rounded-lg bg-white/5 text-white transition-all duration-300',
            'placeholder:text-zinc-500',
            'focus:outline-none focus:ring-2 focus:border-violet-500 focus:ring-violet-500/50 focus:bg-white/10',
            'disabled:bg-white/5 disabled:cursor-not-allowed disabled:text-zinc-600 disabled:opacity-50',
            'resize-y',
            error
              ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
              : 'border-white/10 hover:border-white/20',
            sizeStyles[size],
            className,
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        <HelperText text={helperText} error={error} />
      </div>
    );
  },
);

TextAreaField.displayName = 'TextAreaField';

/**
 * SelectField - Dropdown select input
 */
export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  (
    {
      label,
      helperText,
      error,
      required,
      size = 'md',
      fullWidth = true,
      options,
      placeholder,
      className,
      id,
      disabled,
      ...props
    },
    ref,
  ) => {
    const inputId = id || `select-${Math.random().toString(36).slice(2, 11)}`;

    return (
      <div className={cn(fullWidth ? 'w-full' : 'inline-block')}>
        {label && <FieldLabel label={label} required={required} id={inputId} />}
        <select
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={cn(
            'w-full border rounded-lg bg-white/5 text-white transition-all duration-300',
            'focus:outline-none focus:ring-2 focus:border-violet-500 focus:ring-violet-500/50 focus:bg-white/10',
            'disabled:bg-white/5 disabled:cursor-not-allowed disabled:text-zinc-600 disabled:opacity-50',
            'appearance-none cursor-pointer',
            'bg-no-repeat bg-right',
            error
              ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
              : 'border-white/10 hover:border-white/20',
            sizeStyles[size],
            'pr-10',
            className,
          )}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
            backgroundPosition: 'right 0.5rem center',
            backgroundSize: '1.5em 1.5em',
          }}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <HelperText text={helperText} error={error} />
      </div>
    );
  },
);

SelectField.displayName = 'SelectField';

/**
 * SearchField - Search input with icon
 */
export const SearchField = forwardRef<HTMLInputElement, Omit<InputFieldProps, 'leftElement'>>(
  (props, ref) => {
    return (
      <InputField
        ref={ref}
        leftElement={
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        }
        type="search"
        {...props}
      />
    );
  },
);

SearchField.displayName = 'SearchField';

export default InputField;
