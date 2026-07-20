import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  data: [
    { label: 'Tổng thành viên', value: '1,248', iconName: 'Users', color: '#2b6cb0' },
    { label: 'Số đời (Thế hệ)', value: '15', iconName: 'GitMerge', color: '#9b2c2c' },
    { label: 'Số chi / nhánh', value: '8', iconName: 'GitMerge', color: '#d69e2e' },
    { label: 'Tài khoản liên kết', value: '450', iconName: 'Award', color: '#38a169' }
  ],
};

export const statsSlice = createSlice({
  name: 'stats',
  initialState,
  reducers: {
    setStats: (state, action) => {
      state.data = action.payload;
    }
  },
});

export const { setStats } = statsSlice.actions;
export default statsSlice.reducer;
