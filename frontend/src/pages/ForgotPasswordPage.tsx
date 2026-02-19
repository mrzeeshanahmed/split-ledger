import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AuthLayout,
  InputField,
  PrimaryButton,
  GhostButton,
  Form,
  FormActions,
} from '@/components';
import { forgotPassword } from '@/api/auth';

/**
 * Forgot password form validation schema
 */
const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

/**
 * Forgot password form data type
 */
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/**
 * ForgotPasswordPage - Request password reset
 */
export function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);

    try {
      await forgotPassword({ email: data.email });
      setIsSuccess(true);
    } catch {
      // Show success even on error to prevent email enumeration
      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state - show confirmation message
  if (isSuccess) {
    return (
      <AuthLayout title="Check your email" subtitle="">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-100 mb-4">
            <svg className="h-6 w-6 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-text-secondary mb-6">
            If an account exists with that email address, we&apos;ve sent instructions to reset your password.
          </p>
          <div className="space-y-3">
            <PrimaryButton onClick={() => setIsSuccess(false)} fullWidth>
              Try another email
            </PrimaryButton>
            <Link to="/login">
              <GhostButton fullWidth>Back to sign in</GhostButton>
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot your password?" subtitle="Enter your email and we'll send you reset instructions">
      <Form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <InputField
            label="Email address"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        <FormActions align="stack" className="mt-6">
          <PrimaryButton type="submit" fullWidth loading={isSubmitting}>
            Send reset instructions
          </PrimaryButton>

          <Link to="/login">
            <GhostButton fullWidth>Back to sign in</GhostButton>
          </Link>
        </FormActions>
      </Form>
    </AuthLayout>
  );
}

export default ForgotPasswordPage;
