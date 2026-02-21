import React from 'react';
import { GhostButton } from '@/components';

export interface UsageWarningBannerProps {
  percentage: number;
  metricName: string;
  onDismiss: () => void;
}

/**
 * UsageWarningBanner - Shows warning or critical alert when usage exceeds thresholds
 */
export function UsageWarningBanner({ percentage, metricName, onDismiss }: UsageWarningBannerProps) {
  const isCritical = percentage >= 95;

  return (
    <div
      className={`flex items-start gap-3 rounded-lg px-4 py-3 ${
        isCritical
          ? 'bg-danger-50 text-danger-700'
          : 'bg-warning-50 text-warning-700'
      }`}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">
        {isCritical ? <CriticalIcon /> : <WarningIcon />}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">
          {isCritical
            ? `Critical: ${metricName} usage is at ${Math.round(percentage)}%`
            : `Warning: ${metricName} usage is at ${Math.round(percentage)}%`}
        </p>
        <p className="text-sm mt-0.5">
          {isCritical
            ? 'You are approaching your limit. Upgrade your plan to avoid service interruption.'
            : 'You are approaching your limit. Consider upgrading your plan.'}
        </p>
      </div>
      <GhostButton
        size="sm"
        onClick={onDismiss}
        aria-label="Dismiss warning"
        className="flex-shrink-0"
      >
        <CloseIcon />
      </GhostButton>
    </div>
  );
}

function WarningIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

function CriticalIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default UsageWarningBanner;
