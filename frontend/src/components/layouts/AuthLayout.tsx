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
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-600/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Logo */}
      <div className="mb-8 relative z-10 text-center">
        <img src="/logo.png" alt="Split-Ledger Logo" className="h-12 w-auto mx-auto drop-shadow-lg" />
      </div>

      {/* Card */}
      <div
        className={cn(
          'w-full max-w-md relative z-10 bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-6 sm:p-8 overflow-hidden',
          className,
        )}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {subtitle && <p className="text-zinc-400 mt-1">{subtitle}</p>}
        </div>

        {/* Content */}
        {children}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center relative z-10">
        <p className="text-sm text-zinc-500">
          &copy; {new Date().getFullYear()} Split-Ledger. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default AuthLayout;
