import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { galleryService } from '../../services/galleryService';

export const fetchAlbums = createAsyncThunk(
  'albums/fetchAll',
  async ({ actor, filters }, { rejectWithValue }) => {
    try {
      const data = await galleryService.getAlbums({ actor, filters });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || 'Failed to fetch albums');
    }
  }
);

export const fetchAlbumById = createAsyncThunk(
  'albums/fetchById',
  async ({ id, actor }, { rejectWithValue }) => {
    try {
      const data = await galleryService.getAlbumById(id, actor);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || 'Failed to fetch album');
    }
  }
);

export const createAlbum = createAsyncThunk(
  'albums/create',
  async ({ payload, actor }, { rejectWithValue }) => {
    try {
      const data = await galleryService.createAlbum(payload, actor);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || 'Failed to create album');
    }
  }
);

export const updateAlbum = createAsyncThunk(
  'albums/update',
  async ({ id, payload, actor }, { rejectWithValue }) => {
    try {
      const data = await galleryService.updateAlbum(id, payload, actor);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || 'Failed to update album');
    }
  }
);

export const deleteAlbum = createAsyncThunk(
  'albums/delete',
  async ({ id, actor }, { rejectWithValue }) => {
    try {
      await galleryService.deleteAlbum(id, actor);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || 'Failed to delete album');
    }
  }
);

export const toggleAlbumStatus = createAsyncThunk(
  'albums/toggleStatus',
  async ({ id, actor }, { rejectWithValue }) => {
    try {
      const data = await galleryService.toggleAlbumStatus(id, actor);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || 'Failed to toggle status');
    }
  }
);

export const uploadMedia = createAsyncThunk(
  'albums/uploadMedia',
  async ({ albumId, files, actor, descriptions }, { rejectWithValue }) => {
    try {
      const data = await galleryService.uploadMedia(albumId, files, actor, descriptions);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || 'Failed to upload media');
    }
  }
);

export const updateMedia = createAsyncThunk(
  'albums/updateMedia',
  async ({ albumId, mediaId, payload, actor }, { rejectWithValue }) => {
    try {
      const data = await galleryService.updateMedia(albumId, mediaId, payload, actor);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || 'Failed to update media');
    }
  }
);

export const deleteMedia = createAsyncThunk(
  'albums/deleteMedia',
  async ({ albumId, mediaId, actor }, { rejectWithValue }) => {
    try {
      const data = await galleryService.deleteMedia(albumId, mediaId, actor);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || 'Failed to delete media');
    }
  }
);

const albumsSlice = createSlice({
  name: 'albums',
  initialState: {
    list: [],
    loading: false,
    error: null,
    currentAlbum: null,
    currentAlbumLoading: false,
  },
  reducers: {
    clearCurrentAlbum: (state) => {
      state.currentAlbum = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchAlbums.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAlbums.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchAlbums.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch by ID
      .addCase(fetchAlbumById.pending, (state) => {
        state.currentAlbumLoading = true;
      })
      .addCase(fetchAlbumById.fulfilled, (state, action) => {
        state.currentAlbumLoading = false;
        state.currentAlbum = action.payload;
        // Update in list if exists
        const index = state.list.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })
      .addCase(fetchAlbumById.rejected, (state) => {
        state.currentAlbumLoading = false;
      })

      // Create
      .addCase(createAlbum.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })

      // Update
      .addCase(updateAlbum.fulfilled, (state, action) => {
        const index = state.list.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
        if (state.currentAlbum?.id === action.payload.id) {
          state.currentAlbum = action.payload;
        }
      })

      // Delete
      .addCase(deleteAlbum.fulfilled, (state, action) => {
        state.list = state.list.filter(a => a.id !== action.payload);
        if (state.currentAlbum?.id === action.payload) {
          state.currentAlbum = null;
        }
      })

      // Toggle status
      .addCase(toggleAlbumStatus.fulfilled, (state, action) => {
        const index = state.list.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
        if (state.currentAlbum?.id === action.payload.id) {
          state.currentAlbum = action.payload;
        }
      })

      // Upload Media
      .addCase(uploadMedia.fulfilled, (state, action) => {
        const index = state.list.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
        if (state.currentAlbum?.id === action.payload.id) {
          state.currentAlbum = action.payload;
        }
      })

      // Update Media
      .addCase(updateMedia.fulfilled, (state, action) => {
        const index = state.list.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
        if (state.currentAlbum?.id === action.payload.id) {
          state.currentAlbum = action.payload;
        }
      })

      // Delete Media
      .addCase(deleteMedia.fulfilled, (state, action) => {
        const index = state.list.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
        if (state.currentAlbum?.id === action.payload.id) {
          state.currentAlbum = action.payload;
        }
      });
  }
});

export const { clearCurrentAlbum } = albumsSlice.actions;
export default albumsSlice.reducer;
