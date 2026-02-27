import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ProtectedAdminRoute } from '@/components/auth/ProtectedAdminRoute';
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
  LandingPage,
  ExpensesPage,
  GroupsPage,
  SettlementsPage,
  SettingsPage,
  UsersPage,
  TermsPage,
  PrivacyPolicyPage,
  CookiePolicyPage,
} from '@/pages';
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { TenantsPage as AdminTenantsPage } from '@/pages/admin/TenantsPage';
import { RevenuePage as AdminRevenuePage } from '@/pages/admin/RevenuePage';
import { PlatformSettingsPage } from '@/pages/admin/PlatformSettingsPage';

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
  React.useEffect(() => {
    // Bootstrap CSRF token on app load if not present
    if (typeof document !== 'undefined' && !document.cookie.includes('_csrf=')) {
      // Use standard fetch to avoid axios interceptor side-effects on bootstrap
      fetch('/api/auth/me').catch(() => { });
    }
  }, []);

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
            <Route
              path="/dashboard/expenses"
              element={
                <ProtectedRoute>
                  <ExpensesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/groups"
              element={
                <ProtectedRoute>
                  <GroupsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/settlements"
              element={
                <ProtectedRoute>
                  <SettlementsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/users"
              element={
                <ProtectedRoute>
                  <UsersPage />
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

            {/* Platform Admin routes */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboardPage /></ProtectedAdminRoute>} />
            <Route path="/admin/tenants" element={<ProtectedAdminRoute><AdminTenantsPage /></ProtectedAdminRoute>} />
            <Route path="/admin/revenue" element={<ProtectedAdminRoute><AdminRevenuePage /></ProtectedAdminRoute>} />
            <Route path="/admin/settings" element={<ProtectedAdminRoute><PlatformSettingsPage /></ProtectedAdminRoute>} />

            {/* Public Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Legal Pages */}
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/cookies" element={<CookiePolicyPage />} />

            {/* 404 - Redirect to dashboard if authenticated, otherwise login */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
