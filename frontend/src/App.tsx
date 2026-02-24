import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  DashboardPage,
  ApiKeysPage,
  ApiKeyUsagePage,
  BillingPage,
  AnalyticsPage,
  PlanUpgradePage,
  InvoicesPage,
  StripeConnectPage,
  WebhooksListPage,
  WebhookDetailPage,
} from '@/pages';

/**
 * Create React Query client
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

/**
 * App component with routing and providers
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/api-keys"
              element={
                <ProtectedRoute>
                  <ApiKeysPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/analytics"
              element={
                <ProtectedRoute>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/api-keys/:id/usage"
              element={
                <ProtectedRoute>
                  <ApiKeyUsagePage />
                </ProtectedRoute>
              }
            />

            {/* Webhook routes */}
            <Route
              path="/dashboard/webhooks"
              element={
                <ProtectedRoute>
                  <WebhooksListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/webhooks/:id"
              element={
                <ProtectedRoute>
                  <WebhookDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Billing routes */}
            <Route
              path="/dashboard/billing"
              element={
                <ProtectedRoute>
                  <BillingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/billing/upgrade"
              element={
                <ProtectedRoute>
                  <PlanUpgradePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/billing/invoices"
              element={
                <ProtectedRoute>
                  <InvoicesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/billing/connect"
              element={
                <ProtectedRoute>
                  <StripeConnectPage />
                </ProtectedRoute>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* 404 - Redirect to dashboard if authenticated, otherwise login */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
