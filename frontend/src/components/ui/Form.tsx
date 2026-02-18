import React, { HTMLAttributes, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

/**
 * Form context for field registration
 */
interface FormContextType {
  errors?: Record<string, string>;
  disabled?: boolean;
}

const FormContext = createContext<FormContextType>({});

/**
 * FormSection props
 */
export interface FormSectionProps extends HTMLAttributes<HTMLDivElement> {
  /** Section title */
  title?: string;
  /** Section description */
  description?: string;
  /** Section error */
  error?: string;
}

/**
 * FieldGroup props
 */
export interface FieldGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Field label */
  label: string;
  /** Field name (for error lookup) */
  name?: string;
  /** Required field */
  required?: boolean;
  /** Helper text */
  helperText?: string;
  /** Error message */
  error?: string;
  /** Full width */
  fullWidth?: boolean;
}

/**
 * FormDivider props
 */
export interface FormDividerProps extends HTMLAttributes<HTMLDivElement> {
  /** Show label */
  label?: string;
}

/**
 * FormActions props
 */
export interface FormActionsProps extends HTMLAttributes<HTMLDivElement> {
  /** Align actions */
  align?: 'left' | 'center' | 'right' | 'between';
}

/**
 * FormRow props
 */
export interface FormRowProps extends HTMLAttributes<HTMLDivElement> {
  /** Number of columns */
  columns?: 2 | 3 | 4;
  /** Gap size */
  gap?: 'sm' | 'md' | 'lg';
}

/**
 * Gap styles
 */
const gapStyles = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
};

/**
 * FormSection - Grouped form fields with title
 */
export function FormSection({
  title,
  description,
  error,
  children,
  className,
  ...props
}: FormSectionProps) {
  return (
    <div className={cn('space-y-4', className)} {...props}>
      {(title || description) && (
        <div className="pb-4 border-b border-border-default">
          {title && <h3 className="text-base font-semibold text-text-primary">{title}</h3>}
          {description && <p className="text-sm text-text-secondary mt-1">{description}</p>}
          {error && <p className="text-sm text-danger-600 mt-2">{error}</p>}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

/**
 * FieldGroup - Label + input + error wrapper
 */
export function FieldGroup({
  label,
  name,
  required,
  helperText,
  error,
  fullWidth = true,
  children,
  className,
  ...props
}: FieldGroupProps) {
  const formContext = useContext(FormContext);
  const fieldError = error || (name ? formContext.errors?.[name] : undefined);
  const fieldDisabled = formContext.disabled;
  const fieldId = `field-${name || Math.random().toString(36).slice(2, 11)}`;

  return (
    <div className={cn(fullWidth ? 'w-full' : 'inline-block', 'space-y-1.5', className)} {...props}>
      <label htmlFor={fieldId} className="block text-sm font-medium text-text-primary">
        {label}
        {required && <span className="text-danger-500 ml-1">*</span>}
      </label>
      {fieldDisabled
        ? React.cloneElement(children as React.ReactElement, { disabled: true, id: fieldId })
        : React.cloneElement(children as React.ReactElement, { id: fieldId })}
      {fieldError && <p className="text-xs text-danger-600">{fieldError}</p>}
      {!fieldError && helperText && <p className="text-xs text-text-secondary">{helperText}</p>}
    </div>
  );
}

/**
 * FormDivider - Visual separator between form sections
 */
export function FormDivider({ label, className, ...props }: FormDividerProps) {
  return (
    <div className={cn('relative', className)} {...props}>
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-border-default" />
      </div>
      {label && (
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-sm text-text-secondary">{label}</span>
        </div>
      )}
    </div>
  );
}

/**
 * FormActions - Container for form buttons
 */
export function FormActions({ align = 'right', children, className, ...props }: FormActionsProps) {
  const alignStyles = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div
      className={cn('flex items-center gap-3 pt-4', alignStyles[align], className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * FormRow - Multi-column form layout
 */
export function FormRow({ columns = 2, gap = 'md', children, className, ...props }: FormRowProps) {
  return (
    <div
      className={cn('grid', gapStyles[gap], className)}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Form - Form wrapper with context
 */
export interface FormProps extends HTMLAttributes<HTMLFormElement> {
  /** Form errors */
  errors?: Record<string, string>;
  /** Disable all fields */
  disabled?: boolean;
}

export function Form({ errors, disabled, children, className, ...props }: FormProps) {
  return (
    <FormContext.Provider value={{ errors, disabled }}>
      <form className={cn('space-y-6', className)} {...props}>
        {children}
      </form>
    </FormContext.Provider>
  );
}

/**
 * useFormContext - Hook to access form context
 */
export function useFormContext() {
  return useContext(FormContext);
}

export default Form;
