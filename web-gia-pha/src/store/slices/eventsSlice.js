import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  data: [
    { id: 1, title: 'Lễ Tế Tổ Mùa Xuân', date: '15', month: 'Tháng 2', type: 'Âm lịch', desc: 'Tại Từ đường chính' },
    { id: 2, title: 'Giỗ tổ mẫu', date: '08', month: 'Tháng 3', type: 'Âm lịch', desc: 'Chi 1 phụ trách' },
    { id: 3, title: 'Họp mặt thanh niên họ Nguyễn', date: '20', month: 'Tháng 4', type: 'Dương lịch', desc: 'Tại Nhà văn hóa' }
  ],
};

export const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    setEvents: (state, action) => {
      state.data = action.payload;
    }
  },
});

export const { setEvents } = eventsSlice.actions;
export default eventsSlice.reducer;
