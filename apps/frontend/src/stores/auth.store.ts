import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles: string[];
  campusId?: string;
  collegeId?: string;
  departmentId?: string;
  campusName?: string;
  collegeName?: string;
  mfaEnabled: boolean;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string, mfaCode?: string) => Promise<{ mfaRequired?: boolean }>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  studentId?: string;
  employeeId?: string;
  campusId?: string;
  collegeId?: string;
  departmentId?: string;
  role?: string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password, mfaCode) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', { email, password, mfaCode });
          const { data } = response.data;

          if (data.mfaRequired) {
            set({ isLoading: false });
            return { mfaRequired: true };
          }

          set({
            user: data.user,
            tokens: data.tokens,
            isAuthenticated: true,
            isLoading: false,
          });

          // Set authorization header
          api.defaults.headers.common['Authorization'] = `Bearer ${data.tokens.accessToken}`;

          return {};
        } catch (error: any) {
          set({
            error: error.response?.data?.error?.message || 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          await api.post('/auth/register', data);
          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.response?.data?.error?.message || 'Registration failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
        });
        delete api.defaults.headers.common['Authorization'];
      },

      refreshToken: async () => {
        const { tokens } = get();
        if (!tokens?.refreshToken) return;

        try {
          const response = await api.post('/auth/refresh', {
            refreshToken: tokens.refreshToken,
          });
          const { data } = response.data;

          set({ tokens: data.tokens });
          api.defaults.headers.common['Authorization'] = `Bearer ${data.tokens.accessToken}`;
        } catch {
          // Refresh failed, logout
          get().logout();
        }
      },

      clearError: () => set({ error: null }),
      
      setUser: (user) => set({ user }),
    }),
    {
      name: 'bbd-auth',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

