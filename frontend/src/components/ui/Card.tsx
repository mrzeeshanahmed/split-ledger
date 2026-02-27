import React, { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * Card props
 */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Padding variant */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Shadow variant */
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  /** Hover effect */
  hover?: boolean;
}

/**
 * StatCard props
 */
export interface StatCardProps extends Omit<CardProps, 'children'> {
  /** Stat label */
  label: string;
  /** Stat value */
  value: string | number;
  /** Optional change indicator */
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  /** Optional icon */
  icon?: React.ReactNode;
}

/**
 * ActionCard props
 */
export interface ActionCardProps extends Omit<CardProps, 'hover'> {
  /** Click handler */
  onClick?: () => void;
  /** Card title */
  title: string;
  /** Card description */
  description?: string;
  /** Optional icon */
  icon?: React.ReactNode;
  /** Right arrow indicator */
  showArrow?: boolean;
}

/**
 * Padding styles
 */
const paddingStyles = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

/**
 * Shadow styles
 */
const shadowStyles = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
};

/**
 * Card - Base card component with padding, border, and shadow
 */
export function Card({
  children,
  className,
  padding = 'md',
  shadow = 'sm',
  hover = false,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'relative bg-secondary-900/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden',
        paddingStyles[padding],
        shadowStyles[shadow],
        hover && 'hover:border-white/20 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer',
        className,
      )}
      {...props}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/**
 * CardHeader - Card header section
 */
export function CardHeader({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  );
}

/**
 * CardTitle - Card title
 */
export function CardTitle({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-lg font-semibold text-text-primary', className)} {...props}>
      {children}
    </h3>
  );
}

/**
 * CardDescription - Card description text
 */
export function CardDescription({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-text-secondary mt-1', className)} {...props}>
      {children}
    </p>
  );
}

/**
 * CardContent - Card content section
 */
export function CardContent({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
}

/**
 * CardFooter - Card footer section
 */
export function CardFooter({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mt-4 pt-4 border-t border-border-default', className)} {...props}>
      {children}
    </div>
  );
}

/**
 * StatCard - Card for displaying metrics with optional icon
 */
export function StatCard({
  label,
  value,
  change,
  icon,
  className,
  padding = 'md',
  shadow = 'sm',
  ...props
}: StatCardProps) {
  return (
    <Card padding={padding} shadow={shadow} className={cn('', className)} {...props}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-text-secondary">{label}</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{value}</p>
          {change && (
            <p
              className={cn(
                'text-sm font-medium mt-2 flex items-center gap-1',
                change.type === 'increase' ? 'text-accent-600' : 'text-danger-600',
              )}
            >
              {change.type === 'increase' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              {Math.abs(change.value)}%
            </p>
          )}
        </div>
        {icon && (
          <div className="p-2 bg-primary-500/10 text-primary-500 rounded-lg">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * ActionCard - Clickable card with hover effect
 */
export function ActionCard({
  onClick,
  title,
  description,
  icon,
  showArrow = true,
  className,
  ...props
}: ActionCardProps) {
  return (
    <Card
      padding="md"
      shadow="sm"
      hover
      onClick={onClick}
      className={cn('group', className)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      {...props}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex-shrink-0 p-2 bg-secondary-100 text-secondary-600 rounded-lg group-hover:bg-primary-500/10 group-hover:text-primary-500 transition-colors duration-normal">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0 z-10">
          <h4 className="text-sm font-medium text-text-primary">{title}</h4>
          {description && (
            <p className="text-sm text-text-secondary mt-1 truncate-2">{description}</p>
          )}
        </div>
        {showArrow && onClick && (
          <div className="flex-shrink-0 text-text-muted group-hover:text-primary-500 transition-colors duration-normal z-10">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>
    </Card>
  );
}

export default Card;
