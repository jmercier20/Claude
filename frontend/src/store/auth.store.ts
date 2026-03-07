import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department?: string;
  avatar?: string;
  employeeId: string;
  mustChangePassword: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      userId: null,
      isAuthenticated: false,

      setUser: (user) => set({ user }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      login: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          userId: user.id,
          isAuthenticated: true,
        }),

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          userId: null,
          isAuthenticated: false,
        });
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
      },

      updateUser: (updates) =>
        set({ user: get().user ? { ...get().user!, ...updates } : null }),
    }),
    {
      name: 'lisa-crm-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        userId: state.userId,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
