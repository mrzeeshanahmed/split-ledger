import React from 'react';
import { cn } from '@/lib/utils';
import type { PasswordCriteria, PasswordStrength } from '@/types/auth';

/**
 * Props for PasswordStrengthIndicator
 */
export interface PasswordStrengthIndicatorProps {
  /** Current password value */
  password: string;
  /** Whether to show the criteria checklist */
  showCriteria?: boolean;
}

/**
 * Check password criteria
 */
function checkPasswordCriteria(password: string): PasswordCriteria {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };
}

/**
 * Calculate password strength
 */
function calculateStrength(criteria: PasswordCriteria): PasswordStrength {
  const metCriteria = Object.values(criteria).filter(Boolean).length;

  if (metCriteria <= 2) return 'weak';
  if (metCriteria <= 3) return 'fair';
  if (metCriteria <= 4) return 'good';
  return 'strong';
}

/**
 * Get strength color class
 */
function getStrengthColor(strength: PasswordStrength): string {
  switch (strength) {
    case 'weak':
      return 'bg-danger-500';
    case 'fair':
      return 'bg-warning-500';
    case 'good':
      return 'bg-info-500';
    case 'strong':
      return 'bg-accent-500';
  }
}

/**
 * Get strength label
 */
function getStrengthLabel(strength: PasswordStrength): string {
  switch (strength) {
    case 'weak':
      return 'Weak';
    case 'fair':
      return 'Fair';
    case 'good':
      return 'Good';
    case 'strong':
      return 'Strong';
  }
}

/**
 * Criteria item component
 */
function CriteriaItem({ met, label }: { met: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <span
        className={cn(
          'flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center',
          met ? 'bg-accent-100 text-accent-600' : 'bg-secondary-100 text-text-muted',
        )}
      >
        {met ? (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
        )}
      </span>
      <span className={cn(met ? 'text-text-primary' : 'text-text-muted')}>{label}</span>
    </li>
  );
}

/**
 * PasswordStrengthIndicator - Shows password strength bar and criteria
 */
export function PasswordStrengthIndicator({ password, showCriteria = true }: PasswordStrengthIndicatorProps) {
  const criteria = checkPasswordCriteria(password);
  const strength = calculateStrength(criteria);
  const strengthColor = getStrengthColor(strength);
  const strengthLabel = getStrengthLabel(strength);

  if (!password) {
    return (
      <div className="space-y-2">
        <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-secondary-100">
          <div className="w-0 transition-all duration-300" />
        </div>
        {showCriteria && (
          <ul className="space-y-1">
            <CriteriaItem met={false} label="At least 8 characters" />
            <CriteriaItem met={false} label="One uppercase letter" />
            <CriteriaItem met={false} label="One lowercase letter" />
            <CriteriaItem met={false} label="One number" />
            <CriteriaItem met={false} label="One special character" />
          </ul>
        )}
      </div>
    );
  }

  const strengthPercentage = {
    weak: 25,
    fair: 50,
    good: 75,
    strong: 100,
  }[strength];

  return (
    <div className="space-y-2">
      {/* Strength bar */}
      <div className="flex items-center gap-3">
        <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-secondary-100">
          <div
            className={cn('transition-all duration-300', strengthColor)}
            style={{ width: `${strengthPercentage}%` }}
          />
        </div>
        <span className="text-xs font-medium text-text-secondary min-w-0">{strengthLabel}</span>
      </div>

      {/* Criteria checklist */}
      {showCriteria && (
        <ul className="space-y-1">
          <CriteriaItem met={criteria.minLength} label="At least 8 characters" />
          <CriteriaItem met={criteria.hasUppercase} label="One uppercase letter" />
          <CriteriaItem met={criteria.hasLowercase} label="One lowercase letter" />
          <CriteriaItem met={criteria.hasNumber} label="One number" />
          <CriteriaItem met={criteria.hasSpecial} label="One special character" />
        </ul>
      )}
    </div>
  );
}

export default PasswordStrengthIndicator;
