import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
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
  useToast,
  ErrorState,
  SkeletonCard,
} from '@/components';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { resetPassword } from '@/api/auth';
import { getErrorMessage } from '@/lib/axios';

/**
 * Reset password form validation schema
 */
const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

/**
 * Reset password form data type
 */
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

/**
 * ResetPasswordPage - Reset password with token
 */
export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(true);
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);

  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const password = watch('password', '');

  // Validate token on mount
  useEffect(() => {
    // Simulate token validation - in production, you might want to validate
    // the token with the backend before showing the form
    const validateToken = async () => {
      setIsValidating(true);

      // Check if token exists and has valid format
      if (!token || token.length < 10) {
        setIsValidToken(false);
      }

      setIsValidating(false);
    };

    validateToken();
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;

    setIsSubmitting(true);

    try {
      await resetPassword({
        token,
        password: data.password,
      });

      setIsSuccess(true);
      addToast({
        message: 'Password reset successfully!',
        variant: 'success',
        duration: 3000,
      });
    } catch (error) {
      addToast({
        message: getErrorMessage(error),
        variant: 'error',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <SkeletonCard showHeader contentLines={3} />
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!isValidToken) {
    return (
      <AuthLayout title="Invalid or expired link" subtitle="">
        <ErrorState
          title="Link expired or invalid"
          description="This password reset link has expired or is invalid. Please request a new one."
          onRetry={() => navigate('/forgot-password')}
          retryText="Request new link"
        />
      </AuthLayout>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <AuthLayout title="Password reset!" subtitle="">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-100 mb-4">
            <svg className="h-6 w-6 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-text-secondary mb-6">
            Your password has been successfully reset. You can now sign in with your new password.
          </p>
          <Link to="/login">
            <PrimaryButton fullWidth>Sign in</PrimaryButton>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset your password" subtitle="Create a new secure password for your account">
      <Form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <div>
            <InputField
              label="New password"
              type="password"
              placeholder="Create a strong password"
              autoComplete="new-password"
              error={errors.password?.message}
              onFocus={() => setShowPasswordStrength(true)}
              {...register('password')}
            />
            {showPasswordStrength && <PasswordStrengthIndicator password={password} />}
          </div>

          <InputField
            label="Confirm new password"
            type="password"
            placeholder="Confirm your password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        </div>

        <FormActions align="stack" className="mt-6">
          <PrimaryButton type="submit" fullWidth loading={isSubmitting}>
            Reset password
          </PrimaryButton>

          <Link to="/login">
            <GhostButton fullWidth>Back to sign in</GhostButton>
          </Link>
        </FormActions>
      </Form>
    </AuthLayout>
  );
}

export default ResetPasswordPage;
