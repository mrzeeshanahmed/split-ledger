import axios from 'axios';
import { useAdminAuthStore } from '@/stores/adminAuthStore';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const adminApi = axios.create({
    baseURL: `${API_BASE}/admin`,
    headers: { 'Content-Type': 'application/json' },
});

// Attach platform admin token and CSRF token to every request
adminApi.interceptors.request.use((config) => {
    const token = useAdminAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // CSRF: double-submit cookie pattern
    const csrfToken = document.cookie
        .split('; ')
        .find((c) => c.startsWith('_csrf='))
        ?.split('=')[1];
    if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
    }

    return config;
});

// Handle 401 responses by logging out
adminApi.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            useAdminAuthStore.getState().logout();
            window.location.href = '/admin/login';
        }
        return Promise.reject(error);
    }
);

// Auth
export const adminLogin = (email: string, password: string) =>
    adminApi.post('/auth/login', { email, password });

export const adminSetup = (email: string, password: string, name: string) =>
    adminApi.post('/auth/setup', { email, password, name });

export const adminGetMe = () =>
    adminApi.get('/auth/me');

// Tenants
export const getAdminTenants = (params?: { page?: number; limit?: number; search?: string }) =>
    adminApi.get('/tenants', { params });

export const getAdminTenant = (tenantId: string) =>
    adminApi.get(`/tenants/${tenantId}`);

export const updateTenantStatus = (tenantId: string, status: string) =>
    adminApi.patch(`/tenants/${tenantId}/status`, { status });

export const getTenantUsers = (tenantId: string) =>
    adminApi.get(`/tenants/${tenantId}/users`);

// Settings
export const getAdminSettings = () =>
    adminApi.get('/settings');

export const updateAdminSettings = (settings: Record<string, string>) =>
    adminApi.patch('/settings', { settings });

export const testSmtpSettings = (recipientEmail: string) =>
    adminApi.post('/settings/smtp/test', { recipientEmail });

// Revenue
export const getRevenueSummary = () =>
    adminApi.get('/revenue/summary');

export const getRevenueByTenant = () =>
    adminApi.get('/revenue/by-tenant');

export const getRevenueTrends = () =>
    adminApi.get('/revenue/trends');
