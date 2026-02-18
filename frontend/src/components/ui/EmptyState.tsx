import React, { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { PrimaryButton, SecondaryButton } from './Button';

/**
 * EmptyState props
 */
export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  /** Icon to display */
  icon?: React.ReactNode;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Primary action */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Secondary action */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * ErrorState props
 */
export interface ErrorStateProps extends HTMLAttributes<HTMLDivElement> {
  /** Title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Retry action */
  onRetry?: () => void;
  /** Retry button text */
  retryText?: string;
  /** Error code */
  errorCode?: string | number;
}

/**
 * NoPermissionState props
 */
export interface NoPermissionStateProps extends HTMLAttributes<HTMLDivElement> {
  /** Title text */
  title?: string;
  /** Description text */
  description?: string;
}

/**
 * Size styles
 */
const sizeStyles = {
  sm: {
    container: 'py-8 px-4',
    icon: 'w-12 h-12 mb-3',
    title: 'text-base',
    description: 'text-sm',
  },
  md: {
    container: 'py-12 px-6',
    icon: 'w-16 h-16 mb-4',
    title: 'text-lg',
    description: 'text-sm',
  },
  lg: {
    container: 'py-16 px-8',
    icon: 'w-20 h-20 mb-5',
    title: 'text-xl',
    description: 'text-base',
  },
};

/**
 * EmptyState - No data display with icon, message, and action
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
  className,
  ...props
}: EmptyStateProps) {
  const styles = sizeStyles[size];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        styles.container,
        className,
      )}
      {...props}
    >
      {icon && (
        <div className={cn('text-text-muted', styles.icon)}>
          {icon}
        </div>
      )}
      <h3 className={cn('font-semibold text-text-primary mb-1', styles.title)}>
        {title}
      </h3>
      {description && (
        <p className={cn('text-text-secondary max-w-sm mb-4', styles.description)}>
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {secondaryAction && (
            <SecondaryButton onClick={secondaryAction.onClick} size="sm">
              {secondaryAction.label}
            </SecondaryButton>
          )}
          {action && (
            <PrimaryButton onClick={action.onClick} size="sm">
              {action.label}
            </PrimaryButton>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * ErrorState - Error display with retry action
 */
export function ErrorState({
  title = 'Something went wrong',
  description = 'An error occurred while loading the data. Please try again.',
  onRetry,
  retryText = 'Try again',
  errorCode,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-6',
        className,
      )}
      {...props}
    >
      <div className="w-16 h-16 mb-4 text-danger-500">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-1">{title}</h3>
      <p className="text-sm text-text-secondary max-w-sm mb-4">{description}</p>
      {errorCode && (
        <p className="text-xs text-text-muted mb-4">Error code: {errorCode}</p>
      )}
      {onRetry && (
        <PrimaryButton onClick={onRetry} size="sm">
          {retryText}
        </PrimaryButton>
      )}
    </div>
  );
}

/**
 * NoPermissionState - No permission display
 */
export function NoPermissionState({
  title = 'Access denied',
  description = "You don't have permission to view this content. Please contact your administrator if you believe this is an error.",
  className,
  ...props
}: NoPermissionStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-6',
        className,
      )}
      {...props}
    >
      <div className="w-16 h-16 mb-4 text-warning-500">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-1">{title}</h3>
      <p className="text-sm text-text-secondary max-w-sm">{description}</p>
    </div>
  );
}

/**
 * NoDataState - No data found display
 */
export function NoDataState({
  title = 'No data found',
  description = 'No data has been added yet.',
  action,
  className,
  ...props
}: Omit<EmptyStateProps, 'icon' | 'size'>) {
  return (
    <EmptyState
      title={title}
      description={description}
      action={action}
      className={className}
      icon={
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      }
      {...props}
    />
  );
}

/**
 * NoSearchResultsState - No search results display
 */
export function NoSearchResultsState({
  query,
  onClear,
  className,
  ...props
}: Omit<EmptyStateProps, 'icon' | 'size' | 'title' | 'action'> & { query?: string; onClear?: () => void }) {
  return (
    <EmptyState
      title={query ? `No results for "${query}"` : 'No results found'}
      description="Try adjusting your search terms or filters to find what you're looking for."
      action={onClear ? { label: 'Clear filters', onClick: onClear } : undefined}
      className={className}
      icon={
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      }
      {...props}
    />
  );
}

export default EmptyState;
