import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  data: [
    { id: 1, title: 'Nguồn gốc và lịch sử thăng trầm của họ Nguyễn', date: '12/07/2026' },
    { id: 2, title: 'Danh sách các cháu nhận thưởng quỹ Khuyến học 2026', date: '05/07/2026' },
    { id: 3, title: 'Kế hoạch trùng tu khu lăng mộ tổ - Giai đoạn 2', date: '28/06/2026' },
    { id: 4, title: 'Gương sáng dòng họ: Doanh nhân Nguyễn Văn C', date: '15/06/2026' }
  ],
};

export const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    setPosts: (state, action) => {
      state.data = action.payload;
    }
  },
});

export const { setPosts } = postsSlice.actions;
export default postsSlice.reducer;
