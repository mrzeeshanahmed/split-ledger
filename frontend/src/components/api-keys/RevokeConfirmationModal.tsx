import React from 'react';
import { ConfirmationModal } from '@/components';

/**
 * Props for RevokeConfirmationModal component
 */
export interface RevokeConfirmationModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Handler to close the modal */
  onClose: () => void;
  /** Handler to confirm revocation */
  onConfirm: () => Promise<void>;
  /** Name of the API key being revoked */
  keyName: string;
  /** Loading state */
  loading?: boolean;
}

/**
 * RevokeConfirmationModal - Confirmation dialog for revoking API keys
 *
 * Warns the user that revocation cannot be undone.
 */
export function RevokeConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  keyName,
  loading,
}: RevokeConfirmationModalProps) {
  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Revoke API Key"
      description={`Are you sure you want to revoke the API key "${keyName}"? This action cannot be undone. Any applications using this key will immediately lose access.`}
      confirmText="Revoke Key"
      cancelText="Cancel"
      confirmVariant="danger"
      loading={loading}
    />
  );
}

export default RevokeConfirmationModal;
