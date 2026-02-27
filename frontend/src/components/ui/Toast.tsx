import React, { createContext, useContext, useState, useCallback, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * Toast variant
 */
export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast position
 */
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

/**
 * Toast data
 */
export interface ToastData {
  /** Unique ID */
  id: string;
  /** Toast message */
  message: string;
  /** Variant */
  variant: ToastVariant;
  /** Duration in ms (0 for persistent) */
  duration?: number;
  /** Dismiss handler */
  onDismiss?: () => void;
}

/**
 * Toast props
 */
export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  /** Toast data */
  toast: ToastData;
  /** Dismiss handler */
  onDismiss: (id: string) => void;
}

/**
 * ToastContainer props
 */
export interface ToastContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** Toasts to display */
  toasts: ToastData[];
  /** Position */
  position?: ToastPosition;
  /** Dismiss handler */
  onDismiss: (id: string) => void;
}

/**
 * Toast context type
 */
interface ToastContextType {
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, 'id'>) => string;
  dismissToast: (id: string) => void;
  dismissAll: () => void;
}

/**
 * Toast context
 */
const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Variant styles
 */
const variantStyles: Record<ToastVariant, { bg: string; icon: string; iconColor: string }> = {
  success: {
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    icon: 'M5 13l4 4L19 7',
    iconColor: 'text-emerald-400',
  },
  error: {
    bg: 'bg-red-500/10 border-red-500/20',
    icon: 'M6 18L18 6M6 6l12 12',
    iconColor: 'text-red-400',
  },
  warning: {
    bg: 'bg-amber-500/10 border-amber-500/20',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    iconColor: 'text-amber-400',
  },
  info: {
    bg: 'bg-blue-500/10 border-blue-500/20',
    icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    iconColor: 'text-blue-400',
  },
};

/**
 * Position styles
 */
const positionStyles: Record<ToastPosition, string> = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
};

/**
 * Toast - Single notification component
 */
export function Toast({ toast, onDismiss, className, ...props }: ToastProps) {
  const { icon, iconColor } = variantStyles[toast.variant];

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md',
        variantStyles[toast.variant].bg,
        'animate-slideIn',
        'max-w-sm w-full',
        className,
      )}
      {...props}
    >
      <div className={cn('flex-shrink-0 mt-0.5', iconColor)}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
      </div>
      <p className="flex-1 text-sm text-text-primary">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 p-1 text-text-muted hover:text-text-primary hover:bg-secondary-100 rounded transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

/**
 * ToastContainer - Container for stacking toasts
 */
export function ToastContainer({
  toasts,
  position = 'top-right',
  onDismiss,
  className,
  ...props
}: ToastContainerProps) {
  return (
    <div
      className={cn(
        'fixed z-tooltip flex flex-col gap-2',
        positionStyles[position],
        className,
      )}
      aria-label="Notifications"
      {...props}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

/**
 * ToastProvider - Provider for toast state management
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 11);
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, dismissToast, dismissAll }}>
      {children}
      <ToastContainer toasts={toasts} position="top-right" onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

/**
 * useToast - Hook for toast management
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

/**
 * ToastButton - Helper component to show toast on click
 */
export interface ToastButtonProps extends HTMLAttributes<HTMLButtonElement> {
  /** Toast message */
  message: string;
  /** Toast variant */
  variant: ToastVariant;
  /** Toast duration */
  duration?: number;
  /** Button children */
  children: React.ReactNode;
}

export function ToastButton({
  message,
  variant,
  duration = 5000,
  children,
  onClick,
  ...props
}: ToastButtonProps) {
  const { addToast } = useToast();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    addToast({ message, variant, duration });
    onClick?.(e);
  };

  return (
    <button type="button" onClick={handleClick} {...props}>
      {children}
    </button>
  );
}

export default Toast;
