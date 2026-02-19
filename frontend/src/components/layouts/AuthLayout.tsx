import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Props for AuthLayout
 */
export interface AuthLayoutProps {
  /** Child content */
  children: React.ReactNode;
  /** Optional className */
  className?: string;
  /** Page title */
  title: string;
  /** Page subtitle */
  subtitle?: string;
}

/**
 * AuthLayout - Centered layout for authentication pages
 *
 * Provides a consistent centered card layout for login, register,
 * forgot password, and reset password pages.
 */
export function AuthLayout({ children, className, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-subtle p-4 sm:p-6 lg:p-8">
      {/* Logo */}
      <div className="mb-8">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-600 text-white">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>
      </div>

      {/* Card */}
      <div
        className={cn(
          'w-full max-w-md bg-white border border-border-default rounded-xl shadow-lg p-6 sm:p-8',
          className,
        )}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
          {subtitle && <p className="text-text-secondary mt-1">{subtitle}</p>}
        </div>

        {/* Content */}
        {children}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-sm text-text-muted">
          &copy; {new Date().getFullYear()} Split-Ledger. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default AuthLayout;
