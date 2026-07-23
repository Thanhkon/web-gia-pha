import { createSlice } from '@reduxjs/toolkit';
import { mockGalleryAlbums } from '../../data/mockGallery';
import { ALBUM_STATUS } from '../../types/gallery';

const initialState = {
  data: mockGalleryAlbums
    .filter((album) => album.status === ALBUM_STATUS.VISIBLE)
    .slice(0, 4)
    .map((album) => ({
      id: album.id,
      title: album.title,
      img: album.coverImage,
    })),
};

export const albumsSlice = createSlice({
  name: 'albums',
  initialState,
  reducers: {
    setAlbums: (state, action) => {
      state.data = action.payload;
    },
  },
});

export const { setAlbums } = albumsSlice.actions;
export default albumsSlice.reducer;
