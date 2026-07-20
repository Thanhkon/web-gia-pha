import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  data: [
    { id: 1, title: 'Lễ Thanh Minh 2026', img: '' },
    { id: 2, title: 'Khánh thành Từ đường', img: '' },
    { id: 3, title: 'Họp mặt đầu xuân', img: '' },
    { id: 4, title: 'Trao thưởng Khuyến học', img: '' }
  ],
};

export const albumsSlice = createSlice({
  name: 'albums',
  initialState,
  reducers: {
    setAlbums: (state, action) => {
      state.data = action.payload;
    }
  },
});

export const { setAlbums } = albumsSlice.actions;
export default albumsSlice.reducer;
