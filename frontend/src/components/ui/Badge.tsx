import React, { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * Badge variants
 */
export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline';

/**
 * Badge sizes
 */
export type BadgeSize = 'sm' | 'md' | 'lg';

/**
 * Badge props
 */
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Visual style variant */
  variant?: BadgeVariant;
  /** Size */
  size?: BadgeSize;
  /** Icon before text */
  leftIcon?: React.ReactNode;
  /** Icon after text */
  rightIcon?: React.ReactNode;
}

/**
 * DotIndicator props
 */
export interface DotIndicatorProps extends HTMLAttributes<HTMLSpanElement> {
  /** Dot color variant */
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  /** Pulsing animation */
  pulse?: boolean;
}

/**
 * ProgressBar props
 */
export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  /** Current progress (0-100) */
  value: number;
  /** Maximum value */
  max?: number;
  /** Color variant */
  variant?: 'primary' | 'success' | 'warning' | 'error';
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  /** Show percentage label */
  showLabel?: boolean;
  /** Animated progress */
  animated?: boolean;
}

/**
 * Badge variant styles
 */
const badgeVariantStyles: Record<BadgeVariant, string> = {
  default: 'bg-secondary-500/10 text-secondary-400 border border-secondary-500/20',
  success: 'bg-accent-500/10 text-accent-400 border border-accent-500/20',
  warning: 'bg-warning-500/10 text-warning-400 border border-warning-500/20',
  error: 'bg-danger-500/10 text-danger-400 border border-danger-500/20',
  info: 'bg-info-500/10 text-info-400 border border-info-500/20',
  outline: 'bg-transparent text-text-primary border border-border-default',
};

/**
 * Badge size styles
 */
const badgeSizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1 text-sm',
};

/**
 * Dot indicator variant type
 */
type DotVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

/**
 * Progress bar variant type
 */
type ProgressVariant = 'primary' | 'success' | 'warning' | 'error';

/**
 * Progress bar size type
 */
type ProgressSize = 'sm' | 'md' | 'lg';

/**
 * Dot indicator variant styles
 */
const dotVariantStyles: Record<DotVariant, string> = {
  success: 'bg-accent-500',
  warning: 'bg-warning-500',
  error: 'bg-danger-500',
  info: 'bg-info-500',
  neutral: 'bg-secondary-400',
};

/**
 * Progress bar variant styles
 */
const progressVariantStyles: Record<ProgressVariant, string> = {
  primary: 'bg-primary-600',
  success: 'bg-accent-500',
  warning: 'bg-warning-500',
  error: 'bg-danger-500',
};

/**
 * Progress bar size styles
 */
const progressSizeStyles: Record<ProgressSize, string> = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

/**
 * Badge - Status indicator with optional icons
 */
export function Badge({
  children,
  variant = 'default',
  size = 'md',
  leftIcon,
  rightIcon,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full',
        badgeVariantStyles[variant],
        badgeSizeStyles[size],
        className,
      )}
      {...props}
    >
      {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </span>
  );
}

/**
 * DotIndicator - Small status indicator dot
 */
export function DotIndicator({
  variant = 'neutral',
  pulse = false,
  className,
  ...props
}: DotIndicatorProps) {
  return (
    <span
      className={cn(
        'relative flex h-2.5 w-2.5',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'absolute inline-flex h-full w-full rounded-full opacity-75',
          dotVariantStyles[variant],
          pulse && 'animate-ping',
        )}
      />
      <span
        className={cn(
          'relative inline-flex rounded-full h-2.5 w-2.5',
          dotVariantStyles[variant],
        )}
      />
    </span>
  );
}

/**
 * ProgressBar - Progress visualization
 */
export function ProgressBar({
  value,
  max = 100,
  variant = 'primary',
  size = 'md',
  showLabel = false,
  animated = true,
  className,
  ...props
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn('w-full', className)} {...props}>
      {showLabel && (
        <div className="flex justify-between text-xs text-text-secondary mb-1">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        className={cn(
          'w-full bg-secondary-100 rounded-full overflow-hidden',
          progressSizeStyles[size],
        )}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all',
            progressVariantStyles[variant],
            animated && 'transition-all duration-500 ease-out',
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * StatusBadge - Predefined badge for common status values
 */
export function StatusBadge({
  status,
  size = 'md',
}: {
  status: 'active' | 'inactive' | 'pending' | 'error';
  size?: BadgeSize;
}) {
  const statusConfig = {
    active: {
      variant: 'success' as BadgeVariant,
      label: 'Active',
    },
    inactive: {
      variant: 'default' as BadgeVariant,
      label: 'Inactive',
    },
    pending: {
      variant: 'warning' as BadgeVariant,
      label: 'Pending',
    },
    error: {
      variant: 'error' as BadgeVariant,
      label: 'Error',
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} size={size}>
      {config.label}
    </Badge>
  );
}

export default Badge;
