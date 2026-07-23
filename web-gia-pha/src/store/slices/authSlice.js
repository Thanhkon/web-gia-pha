import { createSlice } from '@reduxjs/toolkit';
import { mockAuthState } from '../../data/mockAuth';

const initialState = {
  user: mockAuthState.user,
  isAuthenticated: mockAuthState.isAuthenticated,
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
