import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuthStore } from '@/stores/adminAuthStore';

interface ProtectedAdminRouteProps {
    children: React.ReactNode;
}

export function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
    const isAuthenticated = useAdminAuthStore((state) => state.isAuthenticated);

    if (!isAuthenticated) {
        return <Navigate to="/admin/login" replace />;
    }

    return <>{children}</>;
}
