import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { UserPublic } from '@/db/drizzle/models';

export interface UserState {
  user: UserPublic | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  /** Set after the first fetchUserProfile completes (success or failure). Prevents re-fetches. Reset on clearUser. */
  _initialFetchDone: boolean;
}

const initialState: UserState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  _initialFetchDone: false,
};

/**
 * Fetch current user profile from /api/auth/me
 */
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          return null; // Not authenticated
        }
        throw new Error('Failed to fetch user profile');
      }

      const data = await response.json();
      return data.data.user;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  },
  {
    // Prevent duplicate in-flight requests AND re-fetches after initial load
    condition: (_, { getState }) => {
      const { user } = getState() as { user: UserState };
      if (user.loading) return false;          // Already in-flight
      if (user._initialFetchDone) return false; // Already fetched once
      return true;
    },
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserPublic>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.error = null;
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state._initialFetchDone = false; // Allow re-fetch after logout
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    updateUserRoles: (state, action: PayloadAction<string[]>) => {
      if (state.user) {
        state.user.roles = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state._initialFetchDone = true;
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
        } else {
          state.user = null;
          state.isAuthenticated = false;
        }
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state._initialFetchDone = true;
        state.error = action.payload as string;
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { setUser, clearUser, setLoading, setError, updateUserRoles } =
  userSlice.actions;

export default userSlice.reducer;

// Selectors
export const selectUser = (state: { user: UserState }) => state.user.user;
export const selectIsAuthenticated = (state: { user: UserState }) =>
  state.user.isAuthenticated;
export const selectUserLoading = (state: { user: UserState }) =>
  state.user.loading;
export const selectUserError = (state: { user: UserState }) => state.user.error;
export const selectUserRoles = (state: { user: UserState }) =>
  state.user.user?.roles || [];
export const selectHasRole = (state: { user: UserState }, role: string) =>
  state.user.user?.roles.includes(role) || false;
