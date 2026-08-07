import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../utils/apiClient';

// Lấy auth từ localStorage (nếu có)
const loadAuthState = () => {
  try {
    const serializedState = localStorage.getItem('auth');
    if (serializedState === null) {
      return { user: null, token: null, isAuthenticated: false };
    }
    return JSON.parse(serializedState);
  } catch {
    return { user: null, token: null, isAuthenticated: false };
  }
};

const initialState = {
  ...loadAuthState(),
  loading: false,
  error: null,
};

const DEFAULT_FAMILY_ID = String(import.meta.env.VITE_DEFAULT_FAMILY_ID || '1');

const inferRole = (user) => {
  const identity = String(user.username || user.email || user.name || '').toLowerCase();
  
  // Ưu tiên email admin@test.com hoặc username admin để test
  if (identity === 'admin' || identity.startsWith('admin@') || identity.includes('trưởng')) {
    return 'ADMIN';
  }

  const backendRole = String(user.role || '').toLowerCase();
  if (backendRole === 'admin') return 'ADMIN';
  if (backendRole === 'user') return 'MEMBER';
  
  if (user.role) return String(user.role).toUpperCase();
  return 'MEMBER';
};

const normalizeAuthPayload = (payload) => {
  const user = payload?.user || payload;
  const token = payload?.accessToken || payload?.token || null;

  if (!user) {
    return { user: null, token };
  }

  const role = inferRole(user);
  const familyId = user.familyId ?? DEFAULT_FAMILY_ID;

  return {
    token,
    user: {
      ...user,
      id: String(user.id),
      name: user.name || user.username || user.email || 'Nguoi dung',
      role,
      familyId: String(familyId),
      memberId: user.memberId ?? null,
      canCreatePost: user.canCreatePost ?? (role === 'FAMILY_HEAD' || role === 'ADMIN'),
      canManagePosts: user.canManagePosts ?? (role === 'FAMILY_HEAD' || role === 'ADMIN'),
    },
  };
};

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      return response.data; // { accessToken, user }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Registration failed');
    }
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action) => {
      const { user, token } = normalizeAuthPayload(action.payload);

      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      localStorage.setItem('auth', JSON.stringify({
        user: state.user,
        token: state.token,
        isAuthenticated: true
      }));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('auth');
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        const { user, token } = normalizeAuthPayload(action.payload);

        state.loading = false;
        state.user = user;
        state.token = token;
        state.isAuthenticated = true;
        // Save to localStorage
        localStorage.setItem('auth', JSON.stringify({
          user: state.user,
          token: state.token,
          isAuthenticated: true
        }));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        // After register, user might need to login, or we can auto-login if backend returns token.
        // Assuming backend returns { accessToken, user } similar to login.
        if (action.payload.accessToken || action.payload.token) {
          const { user, token } = normalizeAuthPayload(action.payload);

          state.user = user;
          state.token = token;
          state.isAuthenticated = true;
          localStorage.setItem('auth', JSON.stringify({
            user: state.user,
            token: state.token,
            isAuthenticated: true
          }));
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError, login } = authSlice.actions;

export default authSlice.reducer;
