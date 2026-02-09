'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/redux/store';
import { setUser, clearUser, fetchUserProfile } from '@/store/redux/userSlice';
import { useSessionStore } from '@/store/zustand/useSessionStore';

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  name?: string;
  role?: string;
}

/**
 * useAuth Hook
 * Provides authentication functionality and state
 * Integrates Redux (user data) and Zustand (session state)
 */
export function useAuth() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Redux state
  const user = useAppSelector((state) => state.user.user);
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const loading = useAppSelector((state) => state.user.loading);

  // Zustand session state
  const { setSession, clearSession, setCSRFToken, shouldRefreshToken, setRefreshing, hasSession } =
    useSessionStore();

  // Refresh timer ref
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  /**
   * Clean up auto-refresh timer
   */
  const cleanupAutoRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  /**
   * Initialize auth on mount
   */
  useEffect(() => {
    isMountedRef.current = true;
    
    // Fetch user profile if not already loaded
    if (!user && !loading) {
      dispatch(fetchUserProfile());
    }

    return () => {
      isMountedRef.current = false;
      cleanupAutoRefresh();
    };
  }, [user, loading, dispatch, cleanupAutoRefresh]);

  /**
   * Set up auto-refresh timer when session exists
   */
  useEffect(() => {
    if (!hasSession) {
      cleanupAutoRefresh();
      return;
    }

    // Check every minute if token needs refresh
    refreshTimerRef.current = setInterval(async () => {
      if (shouldRefreshToken() && isMountedRef.current) {
        try {
          await performRefresh();
        } catch (error) {
          console.error('Auto-refresh failed:', error);
        }
      }
    }, 60 * 1000);

    return () => {
      cleanupAutoRefresh();
    };
  }, [hasSession, shouldRefreshToken, cleanupAutoRefresh]);

  /**
   * Internal refresh function to avoid circular dependency
   */
  const performRefresh = async (): Promise<boolean> => {
    try {
      setRefreshing(true);

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      const result = await response.json();

      if (!result.success) {
        dispatch(clearUser());
        clearSession();
        return false;
      }

      dispatch(setUser(result.data.user));
      const expiryTime = new Date(result.data.accessTokenExpiresAt).getTime();
      setSession(true, expiryTime);

      return true;
    } catch (error) {
      console.error('Refresh error:', error);
      dispatch(clearUser());
      clearSession();
      return false;
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Set up auto-refresh - now simplified
   */
  const setupAutoRefresh = useCallback(() => {
    // Auto-refresh is now handled by the useEffect above
    // This function is kept for compatibility with login flow
  }, []);

  /**
   * Register new user
   */
  const register = useCallback(
    async (data: RegisterData) => {
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            email: data.email.toLowerCase().trim(),
          }),
          credentials: 'include',
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || 'Registration failed');
        }

        return result;
      } catch (error) {
        throw error;
      }
    },
    []
  );

  /**
   * Login user
   */
  const login = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...credentials,
            email: credentials.email.toLowerCase().trim(),
          }),
          credentials: 'include',
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || 'Login failed');
        }

        // Update Redux user state
        dispatch(setUser(result.data.user));

        // Update Zustand session state
        const expiryTime = new Date(result.data.accessTokenExpiresAt).getTime();
        setSession(true, expiryTime);

        // Store CSRF token
        if (result.data.csrfToken) {
          setCSRFToken(result.data.csrfToken);
        }

        // Set up auto-refresh
        setupAutoRefresh();

        return result;
      } catch (error) {
        throw error;
      }
    },
    [dispatch, setSession, setCSRFToken, setupAutoRefresh]
  );

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      // Call logout endpoint
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear state regardless of API success
      dispatch(clearUser());
      clearSession();
      cleanupAutoRefresh();
      router.push('/login');
    }
  }, [dispatch, clearSession, cleanupAutoRefresh, router]);

  /**
   * Refresh access token
   */
  const refreshSession = useCallback(async () => {
    try {
      setRefreshing(true);

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      const result = await response.json();

      if (!result.success) {
        // If refresh fails, log out user
        dispatch(clearUser());
        clearSession();
        cleanupAutoRefresh();
        router.push('/login');
        return false;
      }

      // Update user state
      dispatch(setUser(result.data.user));

      // Update session expiry
      const expiryTime = new Date(result.data.accessTokenExpiresAt).getTime();
      setSession(true, expiryTime);

      return true;
    } catch (error) {
      console.error('Refresh error:', error);
      // On error, log out
      dispatch(clearUser());
      clearSession();
      cleanupAutoRefresh();
      router.push('/login');
      return false;
    } finally {
      setRefreshing(false);
    }
  }, [
    setRefreshing,
    dispatch,
    clearSession,
    setSession,
    cleanupAutoRefresh,
    router,
  ]);

  /**
   * Send password reset email
   */
  const forgotPassword = useCallback(async (email: string) => {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.toLowerCase().trim() }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to send reset email');
    }

    return result;
  }, []);

  /**
   * Reset password
   */
  const resetPassword = useCallback(
    async (token: string, newPassword: string) => {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to reset password');
      }

      return result;
    },
    []
  );

  /**
   * Verify email
   */
  const verifyEmail = useCallback(async (token: string) => {
    const response = await fetch(`/api/auth/verify-email?token=${token}`, {
      method: 'GET',
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to verify email');
    }

    // Refresh user profile to update emailVerified status
    dispatch(fetchUserProfile());

    return result;
  }, [dispatch]);

  /**
   * Check if user has a specific role
   */
  const hasRole = useCallback(
    (role: string): boolean => {
      return user?.roles.includes(role) || false;
    },
    [user]
  );

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = useCallback(
    (roles: string[]): boolean => {
      return roles.some((role) => user?.roles.includes(role)) || false;
    },
    [user]
  );

  return {
    // State
    user,
    isAuthenticated,
    loading,

    // Actions
    register,
    login,
    logout,
    refreshSession,
    forgotPassword,
    resetPassword,
    verifyEmail,

    // Helpers
    hasRole,
    hasAnyRole,
  };
}

/**
 * Hook to protect components
 * Redirects to login if not authenticated
 */
export function useRequireAuth(requiredRoles?: string[]) {
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (requiredRoles && user) {
        const hasRequiredRole = requiredRoles.some((role) =>
          user.roles.includes(role)
        );
        if (!hasRequiredRole) {
          router.push('/dashboard');
        }
      }
    }
  }, [isAuthenticated, user, loading, requiredRoles, router]);

  return { isAuthenticated, user, loading };
}
