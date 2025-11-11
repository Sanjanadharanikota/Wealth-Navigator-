import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  hasWebAuthn?: boolean;
  hasBankConnected?: boolean;
  onboardingComplete?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isUnlocked: boolean;
  onboardingStatus: {
    complete: boolean;
    hasBankConnected: boolean;
    nextStep: 'set_pin' | 'bank_connection' | 'complete';
  };
  // Actions
  setAuth: (user: User, token: string, refreshToken?: string) => void;
  setUnlocked: (unlocked: boolean) => void;
  setUser: (user: Partial<User>) => void;
  setOnboardingStatus: (status: Partial<AuthState['onboardingStatus']>) => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isUnlocked: false,
      onboardingStatus: {
        complete: false,
        hasBankConnected: false,
        nextStep: 'set_pin',
      },
      setAuth: (user, token, refreshToken) =>
        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
          isUnlocked: true, // After successful auth, user is unlocked
          onboardingStatus: {
            complete: user.onboardingComplete || false,
            hasBankConnected: user.hasBankConnected || false,
            nextStep: user.hasBankConnected ? 'complete' : 'bank_connection'
          }
        }),
      setUnlocked: (unlocked) => set({ isUnlocked: unlocked }),
      setUser: (user) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...user } : null,
        })),
      setOnboardingStatus: (status) =>
        set((state) => ({
          onboardingStatus: { ...state.onboardingStatus, ...status },
        })),
      logout: () => {
        // Clear everything except onboarding status
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isUnlocked: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist these fields
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        onboardingStatus: state.onboardingStatus,
      }),
    }
  )
);

export { useAuthStore };