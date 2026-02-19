import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Button variants
 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

/**
 * Button sizes
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Button props
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Size of the button */
  size?: ButtonSize;
  /** Loading state */
  loading?: boolean;
  /** Icon to display before the label */
  leftIcon?: React.ReactNode;
  /** Icon to display after the label */
  rightIcon?: React.ReactNode;
  /** Full width button */
  fullWidth?: boolean;
  /** Accessible label for screen readers */
  'aria-label'?: string;
}

/**
 * Variant styles mapping
 */
const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-primary-600 text-white',
    'hover:bg-primary-700',
    'active:bg-primary-800',
    'focus-visible:ring-primary-500',
    'disabled:hover:bg-primary-600',
  ].join(' '),
  secondary: [
    'bg-white text-text-primary border border-border-default',
    'hover:bg-secondary-50 hover:border-border-strong',
    'active:bg-secondary-100',
    'focus-visible:ring-primary-500',
    'disabled:hover:bg-white disabled:hover:border-border-default',
  ].join(' '),
  danger: [
    'bg-danger-600 text-white',
    'hover:bg-danger-700',
    'active:bg-danger-800',
    'focus-visible:ring-danger-500',
    'disabled:hover:bg-danger-600',
  ].join(' '),
  ghost: [
    'bg-transparent text-text-secondary',
    'hover:bg-secondary-100 hover:text-text-primary',
    'active:bg-secondary-200',
    'focus-visible:ring-primary-500',
    'disabled:hover:bg-transparent disabled:hover:text-text-secondary',
  ].join(' '),
};

/**
 * Size styles mapping
 */
const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-md gap-1.5',
  md: 'px-4 py-2 text-sm rounded-lg gap-2',
  lg: 'px-5 py-2.5 text-base rounded-lg gap-2',
};

/**
 * Loading spinner component
 */
function LoadingSpinner({ size }: { size: ButtonSize }) {
  const spinnerSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  return (
    <svg
      className={cn(spinnerSize, 'animate-spin')}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * PrimaryButton - Solid indigo background, used for main actions
 */
export function PrimaryButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-normal',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <LoadingSpinner size={size} />
          {children}
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}

/**
 * SecondaryButton - Outline with slate border, used for secondary actions
 */
export function SecondaryButton(props: ButtonProps) {
  return <PrimaryButton variant="secondary" {...props} />;
}

/**
 * DangerButton - Solid red background, used for destructive actions
 */
export function DangerButton(props: ButtonProps) {
  return <PrimaryButton variant="danger" {...props} />;
}

/**
 * GhostButton - Transparent with hover state, used for tertiary actions
 */
export function GhostButton(props: ButtonProps) {
  return <PrimaryButton variant="ghost" {...props} />;
}

/**
 * Default export for primary usage
 */
const Button = PrimaryButton;
export { Button };
export default Button;
