import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface SessionState {
  // Session flags
  hasSession: boolean;
  accessTokenExpiry: number | null;
  csrfToken: string | null;

  // UI state
  isRefreshing: boolean;
  showLoginModal: boolean;
  redirectAfterLogin: string | null;

  // Actions
  setSession: (hasSession: boolean, expiry?: number) => void;
  clearSession: () => void;
  setCSRFToken: (token: string) => void;
  setRefreshing: (isRefreshing: boolean) => void;
  setShowLoginModal: (show: boolean) => void;
  setRedirectAfterLogin: (path: string | null) => void;
  shouldRefreshToken: () => boolean;
}

/**
 * Zustand store for client-side session and UI state
 * Uses localStorage for persistence (only safe, minimal data)
 */
export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      // Initial state
      hasSession: false,
      accessTokenExpiry: null,
      csrfToken: null,
      isRefreshing: false,
      showLoginModal: false,
      redirectAfterLogin: null,

      // Set session
      setSession: (hasSession: boolean, expiry?: number) => {
        set({
          hasSession,
          accessTokenExpiry: expiry || null,
        });
      },

      // Clear session
      clearSession: () => {
        set({
          hasSession: false,
          accessTokenExpiry: null,
          csrfToken: null,
          isRefreshing: false,
        });
      },

      // Set CSRF token
      setCSRFToken: (token: string) => {
        set({ csrfToken: token });
      },

      // Set refreshing state
      setRefreshing: (isRefreshing: boolean) => {
        set({ isRefreshing });
      },

      // Set login modal visibility
      setShowLoginModal: (show: boolean) => {
        set({ showLoginModal: show });
      },

      // Set redirect after login
      setRedirectAfterLogin: (path: string | null) => {
        set({ redirectAfterLogin: path });
      },

      // Check if token should be refreshed
      // Refresh if token expires in less than 5 minutes
      shouldRefreshToken: () => {
        const { accessTokenExpiry } = get();
        if (!accessTokenExpiry) return false;

        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        return accessTokenExpiry - now < fiveMinutes;
      },
    }),
    {
      name: 'assetguard-session',
      storage: createJSONStorage(() => localStorage),
      // Only persist minimal, safe data
      partialize: (state) => ({
        hasSession: state.hasSession,
        accessTokenExpiry: state.accessTokenExpiry,
        redirectAfterLogin: state.redirectAfterLogin,
      }),
    }
  )
);

/**
 * Hook to check if user should be prompted to login
 */
export function useRequireAuth() {
  const { hasSession, showLoginModal, setShowLoginModal, setRedirectAfterLogin } =
    useSessionStore();

  const requireAuth = (redirectPath?: string) => {
    if (!hasSession) {
      if (redirectPath) {
        setRedirectAfterLogin(redirectPath);
      }
      setShowLoginModal(true);
      return false;
    }
    return true;
  };

  return { requireAuth, showLoginModal, setShowLoginModal };
}
