import React, { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * NavItem props
 */
export interface NavItemProps {
  /** Navigation label */
  label: string;
  /** Navigation icon */
  icon?: React.ReactNode;
  /** Navigation href */
  href?: string;
  /** Click handler */
  onClick?: () => void;
  /** Active state */
  active?: boolean;
  /** Badge count */
  badge?: number;
  /** Sub items */
  children?: NavItemProps[];
}

/**
 * SidebarNav props
 */
export interface SidebarNavProps extends HTMLAttributes<HTMLElement> {
  /** Navigation items */
  items: NavItemProps[];
  /** Collapsed state */
  collapsed?: boolean;
  /** On collapsed change */
  onCollapsedChange?: (collapsed: boolean) => void;
}

/**
 * TopBar props
 */
export interface TopBarProps extends HTMLAttributes<HTMLElement> {
  /** Left section content */
  left?: React.ReactNode;
  /** Center section content */
  center?: React.ReactNode;
  /** Right section content */
  right?: React.ReactNode;
}

/**
 * AppShell props
 */
export interface AppShellProps extends HTMLAttributes<HTMLDivElement> {
  /** Sidebar content */
  sidebar?: React.ReactNode;
  /** Top bar content */
  topBar?: React.ReactNode;
  /** Main content */
  children: React.ReactNode;
  /** Sidebar collapsed state */
  sidebarCollapsed?: boolean;
}

/**
 * NavItem - Single navigation link with icon
 */
export function NavItem({
  label,
  icon,
  href,
  onClick,
  active = false,
  badge,
  collapsed = false,
}: NavItemProps & { collapsed?: boolean }) {
  const Component = href ? 'a' : 'button';
  const linkProps = href ? { href } : { onClick, type: 'button' as const };

  return (
    <Component
      {...linkProps}
      className={cn(
        'flex items-center gap-3 w-full rounded-lg transition-all duration-normal',
        'text-sm font-medium',
        active
          ? 'bg-primary-50 text-primary-700'
          : 'text-text-secondary hover:bg-secondary-100 hover:text-text-primary',
        collapsed ? 'justify-center px-3 py-2' : 'px-3 py-2',
      )}
      aria-current={active ? 'page' : undefined}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {!collapsed && (
        <>
          <span className="flex-1 text-left">{label}</span>
          {badge !== undefined && badge > 0 && (
            <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-primary-600 text-white rounded-full">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </>
      )}
      {collapsed && badge !== undefined && badge > 0 && (
        <span className="absolute top-1 right-1 w-2 h-2 bg-primary-600 rounded-full" />
      )}
    </Component>
  );
}

/**
 * SidebarNav - Vertical navigation container
 */
export function SidebarNav({
  items,
  collapsed = false,
  onCollapsedChange,
  className,
  ...props
}: SidebarNavProps) {
  return (
    <nav
      className={cn(
        'flex flex-col h-full bg-white border-r border-border-default',
        collapsed ? 'w-16' : 'w-64',
        'transition-all duration-300',
        className,
      )}
      aria-label="Main navigation"
      {...props}
    >
      {/* Navigation items */}
      <div className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {items.map((item, index) => (
            <li key={index} className="relative">
              <NavItem {...item} collapsed={collapsed} />
            </li>
          ))}
        </ul>
      </div>

      {/* Collapse toggle */}
      {onCollapsedChange && (
        <div className="border-t border-border-default p-3">
          <button
            type="button"
            onClick={() => onCollapsedChange(!collapsed)}
            className={cn(
              'flex items-center gap-3 w-full rounded-lg text-sm font-medium',
              'text-text-secondary hover:bg-secondary-100 hover:text-text-primary',
              'transition-all duration-normal',
              collapsed ? 'justify-center px-3 py-2' : 'px-3 py-2',
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              className={cn('w-5 h-5 transition-transform', collapsed && 'rotate-180')}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      )}
    </nav>
  );
}

/**
 * TopBar - Horizontal header bar
 */
export function TopBar({ left, center, right, className, ...props }: TopBarProps) {
  return (
    <header
      className={cn(
        'flex items-center h-16 bg-white border-b border-border-default px-4',
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-4 flex-shrink-0">{left}</div>
      <div className="flex-1 flex items-center justify-center">{center}</div>
      <div className="flex items-center gap-4 flex-shrink-0">{right}</div>
    </header>
  );
}

/**
 * AppShell - Layout wrapper with sidebar and top bar
 */
export function AppShell({
  sidebar,
  topBar,
  children,
  sidebarCollapsed: _sidebarCollapsed = false,
  className,
  ...props
}: AppShellProps) {
  return (
    <div className={cn('flex h-screen bg-background-subtle', className)} {...props}>
      {sidebar}
      <div className="flex-1 flex flex-col overflow-hidden">
        {topBar}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}

/**
 * Breadcrumb props
 */
export interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
  /** Breadcrumb items */
  items: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
  }>;
  /** Separator */
  separator?: React.ReactNode;
}

/**
 * Breadcrumb - Breadcrumb navigation
 */
export function Breadcrumb({
  items,
  separator = '/',
  className,
  ...props
}: BreadcrumbProps) {
  return (
    <nav className={cn('flex items-center text-sm', className)} aria-label="Breadcrumb" {...props}>
      <ol className="flex items-center gap-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {index > 0 && (
              <span className="text-text-muted" aria-hidden="true">
                {separator}
              </span>
            )}
            {item.href ? (
              <a
                href={item.href}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                {item.label}
              </a>
            ) : item.onClick ? (
              <button
                type="button"
                onClick={item.onClick}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                {item.label}
              </button>
            ) : (
              <span className="text-text-primary font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default AppShell;
