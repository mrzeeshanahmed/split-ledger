import React, { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * Skeleton base props
 */
export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Width */
  width?: string | number;
  /** Height */
  height?: string | number;
  /** Rounded corners */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  /** Animated */
  animated?: boolean;
}

/**
 * SkeletonText props
 */
export interface SkeletonTextProps extends HTMLAttributes<HTMLDivElement> {
  /** Number of lines */
  lines?: number;
  /** Last line width percentage */
  lastLineWidth?: string;
  /** Text size */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * SkeletonCard props
 */
export interface SkeletonCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Show header */
  showHeader?: boolean;
  /** Number of content lines */
  contentLines?: number;
  /** Show footer */
  showFooter?: boolean;
}

/**
 * SkeletonTable props
 */
export interface SkeletonTableProps extends HTMLAttributes<HTMLDivElement> {
  /** Number of rows */
  rows?: number;
  /** Number of columns */
  columns?: number;
  /** Show header */
  showHeader?: boolean;
}

/**
 * SkeletonStat props
 */
export interface SkeletonStatProps extends HTMLAttributes<HTMLDivElement> {
  /** Show icon */
  showIcon?: boolean;
  /** Show change indicator */
  showChange?: boolean;
}

/**
 * Rounded styles
 */
const roundedStyles = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
};

/**
 * Text size styles
 */
const textSizeStyles = {
  sm: 'h-3',
  md: 'h-4',
  lg: 'h-5',
};

/**
 * Skeleton - Base skeleton component
 */
export function Skeleton({
  width,
  height,
  rounded = 'md',
  animated = true,
  className,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-secondary-100',
        roundedStyles[rounded],
        animated && 'animate-pulse',
        className,
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
      aria-hidden="true"
      {...props}
    />
  );
}

/**
 * SkeletonText - Animated text placeholder
 */
export function SkeletonText({
  lines = 1,
  lastLineWidth = '60%',
  size = 'md',
  className,
  ...props
}: SkeletonTextProps) {
  return (
    <div className={cn('space-y-2', className)} aria-hidden="true" {...props}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          rounded="sm"
          className={textSizeStyles[size]}
        />
      ))}
    </div>
  );
}

/**
 * SkeletonCard - Card-shaped skeleton
 */
export function SkeletonCard({
  showHeader = true,
  contentLines = 3,
  showFooter = false,
  className,
  ...props
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'bg-white border border-border-default rounded-lg p-4',
        className,
      )}
      aria-hidden="true"
      {...props}
    >
      {showHeader && (
        <div className="mb-4">
          <Skeleton width="40%" height={20} rounded="sm" />
        </div>
      )}
      <SkeletonText lines={contentLines} />
      {showFooter && (
        <div className="mt-4 pt-4 border-t border-border-default flex gap-2">
          <Skeleton width={80} height={32} rounded="lg" />
          <Skeleton width={80} height={32} rounded="lg" />
        </div>
      )}
    </div>
  );
}

/**
 * SkeletonTable - Table skeleton with rows
 */
export function SkeletonTable({
  rows = 5,
  columns = 4,
  showHeader = true,
  className,
  ...props
}: SkeletonTableProps) {
  return (
    <div
      className={cn('bg-white border border-border-default rounded-lg overflow-hidden', className)}
      aria-hidden="true"
      {...props}
    >
      {showHeader && (
        <div className="bg-secondary-50 px-4 py-3 border-b border-border-default">
          <div className="flex gap-4">
            {Array.from({ length: columns }).map((_, index) => (
              <Skeleton key={index} width={index === 0 ? '40%' : '100%'} height={16} rounded="sm" />
            ))}
          </div>
        </div>
      )}
      <div className="divide-y divide-border-default">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-4 py-3">
            <div className="flex gap-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton
                  key={colIndex}
                  width={colIndex === 0 ? '60%' : colIndex === columns - 1 ? '40%' : '80%'}
                  height={16}
                  rounded="sm"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * SkeletonStat - Stat card skeleton
 */
export function SkeletonStat({
  showIcon = true,
  showChange = false,
  className,
  ...props
}: SkeletonStatProps) {
  return (
    <div
      className={cn('bg-white border border-border-default rounded-lg p-4', className)}
      aria-hidden="true"
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton width="50%" height={14} rounded="sm" className="mb-2" />
          <Skeleton width="70%" height={28} rounded="sm" />
          {showChange && (
            <Skeleton width="30%" height={16} rounded="sm" className="mt-2" />
          )}
        </div>
        {showIcon && (
          <Skeleton width={40} height={40} rounded="lg" />
        )}
      </div>
    </div>
  );
}

/**
 * Spinner - Loading spinner
 */
export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  /** Size */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Color variant */
  variant?: 'primary' | 'white' | 'current';
}

const spinnerSizeStyles = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const spinnerColorStyles = {
  primary: 'text-violet-500',
  white: 'text-white',
  current: 'text-current',
};

export function Spinner({ size = 'md', variant = 'primary', className, ...props }: SpinnerProps) {
  return (
    <div className={cn('animate-spin', spinnerSizeStyles[size], spinnerColorStyles[variant], className)} {...props}>
      <svg fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}

/**
 * LoadingOverlay - Full page loading overlay
 */
export interface LoadingOverlayProps extends HTMLAttributes<HTMLDivElement> {
  /** Loading message */
  message?: string;
}

export function LoadingOverlay({ message = 'Loading...', className, ...props }: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-modal flex items-center justify-center bg-white/80 backdrop-blur-sm',
        className,
      )}
      role="alert"
      aria-busy="true"
      aria-live="polite"
      {...props}
    >
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-sm text-text-secondary">{message}</p>
      </div>
    </div>
  );
}

export default Skeleton;
