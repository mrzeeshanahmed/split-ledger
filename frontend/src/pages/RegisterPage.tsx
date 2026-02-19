import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AuthLayout,
  InputField,
  PrimaryButton,
  Form,
  FormActions,
  FormRow,
  useToast,
} from '@/components';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { register } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import { getErrorMessage } from '@/lib/axios';

/**
 * Registration form validation schema
 */
const registerSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

/**
 * Registration form data type
 */
type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * RegisterPage - User registration form
 */
export function RegisterPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const setUser = useAuthStore((state) => state.setUser);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);

  const {
    register: registerField,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password', '');

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);

    try {
      const response = await register({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });

      if (response.success && response.user) {
        setUser(response.user);
        addToast({
          message: 'Account created successfully!',
          variant: 'success',
          duration: 3000,
        });
        navigate('/dashboard', { replace: true });
      }
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

  return (
    <AuthLayout title="Create an account" subtitle="Start managing your expenses today">
      <Form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <FormRow columns={2} gap="md">
            <InputField
              label="First name"
              placeholder="John"
              autoComplete="given-name"
              error={errors.firstName?.message}
              {...registerField('firstName')}
            />
            <InputField
              label="Last name"
              placeholder="Doe"
              autoComplete="family-name"
              error={errors.lastName?.message}
              {...registerField('lastName')}
            />
          </FormRow>

          <InputField
            label="Email address"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email?.message}
            {...registerField('email')}
          />

          <div>
            <InputField
              label="Password"
              type="password"
              placeholder="Create a strong password"
              autoComplete="new-password"
              error={errors.password?.message}
              onFocus={() => setShowPasswordStrength(true)}
              {...registerField('password')}
            />
            {showPasswordStrength && <PasswordStrengthIndicator password={password} />}
          </div>

          <InputField
            label="Confirm password"
            type="password"
            placeholder="Confirm your password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...registerField('confirmPassword')}
          />

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="terms"
                type="checkbox"
                className="h-4 w-4 rounded border-border-default text-primary-600 focus:ring-primary-500"
                {...registerField('acceptTerms')}
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="terms" className="text-text-secondary">
                I agree to the{' '}
                <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                  Privacy Policy
                </a>
              </label>
              {errors.acceptTerms && (
                <p className="text-xs text-danger-600 mt-1">{errors.acceptTerms.message}</p>
              )}
            </div>
          </div>
        </div>

        <FormActions align="stack" className="mt-6">
          <PrimaryButton type="submit" fullWidth loading={isSubmitting}>
            Create account
          </PrimaryButton>

          <p className="text-center text-sm text-text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
              Sign in
            </Link>
          </p>
        </FormActions>
      </Form>
    </AuthLayout>
  );
}

export default RegisterPage;
