import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Dữ liệu mẫu (mock data), có thể đổi null thành object { name: 'Người dùng A' } để test
  user: null,
  isAuthenticated: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { login, logout } = authSlice.actions;

export default authSlice.reducer;
