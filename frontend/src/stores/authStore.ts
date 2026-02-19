import { create } from 'zustand';
import type { User } from '@/types/auth';

/**
 * Auth store state
 */
interface AuthState {
  /** Current authenticated user */
  user: User | null;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Loading state for auth check */
  isLoading: boolean;
  /** Whether auth has been initialized */
  isInitialized: boolean;
}

/**
 * Auth store actions
 */
interface AuthActions {
  /** Set the current user */
  setUser: (user: User | null) => void;
  /** Set authentication status */
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  /** Set loading state */
  setIsLoading: (isLoading: boolean) => void;
  /** Set initialized state */
  setIsInitialized: (isInitialized: boolean) => void;
  /** Logout user */
  logout: () => void;
}

/**
 * Auth store type
 */
type AuthStore = AuthState & AuthActions;

/**
 * Create auth store
 */
export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

  setIsLoading: (isLoading) => set({ isLoading }),

  setIsInitialized: (isInitialized) => set({ isInitialized }),

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    }),
}));

/**
 * Hook to check if user has required role
 */
export function useHasRole(role: 'admin' | 'user') {
  const user = useAuthStore((state) => state.user);
  return user?.role === role;
}

/**
 * Hook to get current user
 */
export function useCurrentUser() {
  return useAuthStore((state) => state.user);
}
