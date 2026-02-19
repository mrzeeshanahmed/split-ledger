import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { getCurrentUser } from '@/api/auth';
import { SkeletonCard } from '@/components';

/**
 * Props for ProtectedRoute
 */
export interface ProtectedRouteProps {
  /** Child components to render if authenticated */
  children: React.ReactNode;
  /** Required role for access */
  requiredRole?: 'admin' | 'user';
}

/**
 * ProtectedRoute - Guards routes that require authentication
 *
 * Usage:
 * ```tsx
 * <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
 * ```
 */
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, isLoading, isInitialized, setUser, setIsAuthenticated, setIsLoading, setIsInitialized } =
    useAuthStore();

  // Check authentication on mount
  useEffect(() => {
    if (isInitialized) return;

    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const user = await getCurrentUser();

        if (user) {
          setUser(user);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch {
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    checkAuth();
  }, [isInitialized, setUser, setIsAuthenticated, setIsLoading, setIsInitialized]);

  // Show skeleton while checking auth
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <SkeletonCard showHeader contentLines={4} />
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role requirement
  const user = useAuthStore.getState().user;
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-warning-500">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Access Denied</h2>
          <p className="text-text-secondary">You don&apos;t have permission to view this page.</p>
        </div>
      </div>
    );
  }

  // Render protected content
  return <>{children}</>;
}

export default ProtectedRoute;
