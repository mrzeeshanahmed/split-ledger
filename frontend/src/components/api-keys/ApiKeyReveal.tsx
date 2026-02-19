import React, { useState, useCallback } from 'react';
import { Modal, PrimaryButton, SecondaryButton } from '@/components';
import { cn } from '@/lib/utils';

/**
 * Props for ApiKeyReveal component
 */
export interface ApiKeyRevealProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Handler to close the modal */
  onClose: () => void;
  /** The raw API key to display */
  apiKey: string;
  /** The name of the API key */
  keyName: string;
}

/**
 * ApiKeyReveal - One-time key reveal modal
 *
 * Displays the API key exactly once with copy functionality.
 * User must explicitly confirm they've saved the key before closing.
 */
export function ApiKeyReveal({ isOpen, onClose, apiKey, keyName }: ApiKeyRevealProps) {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Handle copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the text
      const element = document.getElementById('api-key-value');
      if (element) {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(element);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  }, [apiKey]);

  // Handle confirmation checkbox
  const handleConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmed(e.target.checked);
  };

  // Prevent closing without confirmation
  const handleCloseAttempt = () => {
    if (!confirmed) {
      return;
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCloseAttempt}
      title="Save Your API Key"
      description={`This is the only time you'll see the full key for "${keyName}". Copy it now and store it securely.`}
      size="lg"
      closeOnBackdrop={false}
      closeOnEscape={false}
      showCloseButton={false}
      footer={
        <div className="flex items-center justify-between w-full">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={handleConfirmChange}
              className="w-4 h-4 rounded border-border-default text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-text-secondary">I have copied and saved this key</span>
          </label>
          <PrimaryButton onClick={handleCloseAttempt} disabled={!confirmed}>
            I&apos;ve Saved My Key
          </PrimaryButton>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Warning Banner */}
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 flex gap-3">
          <div className="flex-shrink-0 text-warning-500">
            <WarningIcon />
          </div>
          <div>
            <p className="text-sm font-medium text-warning-800">Important</p>
            <p className="text-sm text-warning-700">
              This key will only be shown once. If you lose it, you&apos;ll need to revoke it and
              create a new one.
            </p>
          </div>
        </div>

        {/* API Key Display */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-text-primary">Your API Key</label>
          <div className="relative">
            <div
              id="api-key-value"
              className={cn(
                'w-full p-4 pr-24 bg-secondary-900 rounded-lg',
                'font-mono text-sm text-secondary-100',
                'break-all select-all',
                'border border-secondary-700'
              )}
            >
              {apiKey}
            </div>
            <button
              onClick={handleCopy}
              className={cn(
                'absolute right-2 top-1/2 -translate-y-1/2',
                'px-3 py-1.5 rounded-md text-sm font-medium',
                'transition-colors duration-normal',
                copied
                  ? 'bg-accent-500 text-white'
                  : 'bg-secondary-700 text-secondary-100 hover:bg-secondary-600'
              )}
            >
              {copied ? (
                <span className="flex items-center gap-1">
                  <CheckIcon className="w-4 h-4" />
                  Copied
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <CopyIcon className="w-4 h-4" />
                  Copy
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Security Tips */}
        <div className="bg-info-50 border border-info-200 rounded-lg p-4">
          <p className="text-sm font-medium text-info-800 mb-2">Security Tips</p>
          <ul className="text-sm text-info-700 space-y-1 list-disc list-inside">
            <li>Store this key in a secure environment variable</li>
            <li>Never commit API keys to version control</li>
            <li>Rotate keys regularly for better security</li>
            <li>Revoke immediately if you suspect it&apos;s been compromised</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Warning icon component
 */
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

/**
 * Copy icon component
 */
function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

/**
 * Check icon component
 */
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default ApiKeyReveal;
