import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Modal,
  PrimaryButton,
  SecondaryButton,
  InputField,
  Badge,
  Form,
  FormSection,
  FormRow,
  FormActions,
} from '@/components';
import { cn } from '@/lib/utils';
import type { ApiKeyScope, CreateApiKeyInput } from '@/types/apiKeys';

/**
 * Form validation schema
 */
const createApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  scopes: z.array(z.enum(['read', 'write', 'admin'])).min(1, 'At least one scope is required'),
  rateLimitPerMinute: z.number().min(1).max(10000),
  rateLimitPerDay: z.number().min(1).max(1000000),
  expiresAt: z.string().optional(),
});

type CreateApiKeyFormData = z.infer<typeof createApiKeySchema>;

/**
 * Props for CreateApiKeyModal component
 */
export interface CreateApiKeyModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Handler to close the modal */
  onClose: () => void;
  /** Handler when API key is created */
  onSubmit: (data: CreateApiKeyInput) => Promise<void>;
  /** Loading state */
  loading?: boolean;
}

/**
 * Scope option configuration
 */
const scopeOptions: { value: ApiKeyScope; label: string; description: string; color: 'default' | 'info' | 'warning' | 'error' }[] = [
  {
    value: 'read',
    label: 'Read',
    description: 'View data and resources',
    color: 'default',
  },
  {
    value: 'write',
    label: 'Write',
    description: 'Create and update data',
    color: 'info',
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Full access including deletion',
    color: 'error',
  },
];

/**
 * CreateApiKeyModal - Modal for creating new API keys
 */
export function CreateApiKeyModal({ isOpen, onClose, onSubmit, loading }: CreateApiKeyModalProps) {
  const [selectedScopes, setSelectedScopes] = useState<ApiKeyScope[]>(['read']);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CreateApiKeyFormData>({
    resolver: zodResolver(createApiKeySchema),
    defaultValues: {
      name: '',
      scopes: ['read'],
      rateLimitPerMinute: 60,
      rateLimitPerDay: 10000,
      expiresAt: '',
    },
  });

  // Toggle scope selection
  const toggleScope = (scope: ApiKeyScope) => {
    setSelectedScopes((prev) => {
      const newScopes = prev.includes(scope)
        ? prev.filter((s) => s !== scope)
        : [...prev, scope];
      setValue('scopes', newScopes, { shouldValidate: true });
      return newScopes;
    });
  };

  // Handle form submission
  const handleFormSubmit = async (data: CreateApiKeyFormData) => {
    await onSubmit({
      name: data.name,
      scopes: data.scopes,
      rateLimitPerMinute: data.rateLimitPerMinute,
      rateLimitPerDay: data.rateLimitPerDay,
      expiresAt: data.expiresAt || undefined,
    });
    reset();
    setSelectedScopes(['read']);
  };

  // Handle close
  const handleClose = () => {
    reset();
    setSelectedScopes(['read']);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New API Key"
      description="Create a new API key for accessing the API programmatically."
      size="lg"
      footer={
        <FormActions>
          <SecondaryButton onClick={handleClose} disabled={loading}>
            Cancel
          </SecondaryButton>
          <PrimaryButton onClick={handleSubmit(handleFormSubmit)} loading={loading}>
            Create API Key
          </PrimaryButton>
        </FormActions>
      }
    >
      <Form onSubmit={handleSubmit(handleFormSubmit)}>
        <FormSection title="Key Details">
          <InputField
            {...register('name')}
            label="Name"
            placeholder="e.g., Production Server"
            helperText="A descriptive name to identify this key"
            error={errors.name?.message}
            required
          />
        </FormSection>

        <FormSection title="Scopes" description="Select the permissions for this API key">
          <div className="space-y-3">
            {scopeOptions.map((scope) => (
              <button
                key={scope.value}
                type="button"
                onClick={() => toggleScope(scope.value)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-normal text-left',
                  selectedScopes.includes(scope.value)
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-border-default hover:border-primary-300'
                )}
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                    selectedScopes.includes(scope.value)
                      ? 'bg-primary-600 border-primary-600'
                      : 'border-border-default'
                  )}
                >
                  {selectedScopes.includes(scope.value) && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary">{scope.label}</span>
                    <Badge variant={scope.color} size="sm">
                      {scope.value}
                    </Badge>
                  </div>
                  <p className="text-sm text-text-secondary mt-0.5">{scope.description}</p>
                </div>
              </button>
            ))}
          </div>
          {errors.scopes && <p className="text-sm text-danger-600 mt-2">{errors.scopes.message}</p>}
        </FormSection>

        <FormSection title="Rate Limits" description="Configure request rate limits for this key">
          <FormRow columns={2}>
            <InputField
              {...register('rateLimitPerMinute', { valueAsNumber: true })}
              type="number"
              label="Requests per minute"
              helperText="Max: 10,000"
              error={errors.rateLimitPerMinute?.message}
              min={1}
              max={10000}
            />
            <InputField
              {...register('rateLimitPerDay', { valueAsNumber: true })}
              type="number"
              label="Requests per day"
              helperText="Max: 1,000,000"
              error={errors.rateLimitPerDay?.message}
              min={1}
              max={1000000}
            />
          </FormRow>
        </FormSection>

        <FormSection title="Expiration (Optional)">
          <InputField
            {...register('expiresAt')}
            type="datetime-local"
            label="Expires at"
            helperText="Leave blank for no expiration"
            error={errors.expiresAt?.message}
          />
        </FormSection>
      </Form>
    </Modal>
  );
}

export default CreateApiKeyModal;
