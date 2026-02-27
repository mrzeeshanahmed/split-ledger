import { create } from 'zustand';

export interface PlatformAdmin {
    id: string;
    email: string;
    name: string;
}

interface AdminAuthState {
    admin: PlatformAdmin | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (admin: PlatformAdmin, token: string) => void;
    logout: () => void;
    setAdmin: (admin: PlatformAdmin) => void;
}

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
    admin: JSON.parse(sessionStorage.getItem('platformAdmin') || 'null'),
    token: sessionStorage.getItem('platformAdminToken'),
    isAuthenticated: !!sessionStorage.getItem('platformAdminToken'),
    login: (admin, token) => {
        sessionStorage.setItem('platformAdmin', JSON.stringify(admin));
        sessionStorage.setItem('platformAdminToken', token);
        set({ admin, token, isAuthenticated: true });
    },
    logout: () => {
        sessionStorage.removeItem('platformAdmin');
        sessionStorage.removeItem('platformAdminToken');
        set({ admin: null, token: null, isAuthenticated: false });
    },
    setAdmin: (admin) => {
        sessionStorage.setItem('platformAdmin', JSON.stringify(admin));
        set({ admin });
    },
}));
