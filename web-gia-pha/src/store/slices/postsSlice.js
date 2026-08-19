import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { postService } from '../../services/postService';

export const fetchPosts = createAsyncThunk(
  'posts/fetchAll',
  async ({ options, legacyPage, legacyPageSize }, { rejectWithValue }) => {
    try {
      const data = await postService.getPosts(options, legacyPage, legacyPageSize);
      return data; // { items, total, totalPages, page }
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || 'Failed to fetch posts');
    }
  }
);

export const fetchPostById = createAsyncThunk(
  'posts/fetchById',
  async ({ id, actor }, { rejectWithValue }) => {
    try {
      const data = await postService.getPostById(id, actor);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || 'Failed to fetch post');
    }
  }
);

export const createPost = createAsyncThunk(
  'posts/create',
  async ({ payload, actor }, { rejectWithValue }) => {
    try {
      const data = await postService.createPost(payload, actor);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || 'Failed to create post');
    }
  }
);

export const updatePost = createAsyncThunk(
  'posts/update',
  async ({ id, payload, actor }, { rejectWithValue }) => {
    try {
      const data = await postService.updatePost(id, payload, actor);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || 'Failed to update post');
    }
  }
);

export const deletePost = createAsyncThunk(
  'posts/delete',
  async ({ id, actor }, { rejectWithValue }) => {
    try {
      await postService.deletePost(id, actor);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || 'Failed to delete post');
    }
  }
);

export const publishPost = createAsyncThunk(
  'posts/publish',
  async ({ id, actor }, { rejectWithValue }) => {
    try {
      const data = await postService.publishPost(id, actor);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || 'Failed to publish post');
    }
  }
);

export const hidePost = createAsyncThunk(
  'posts/hide',
  async ({ id, actor }, { rejectWithValue }) => {
    try {
      const data = await postService.hidePost(id, actor);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || 'Failed to hide post');
    }
  }
);

const postsSlice = createSlice({
  name: 'posts',
  initialState: {
    list: [],
    total: 0,
    totalPages: 1,
    page: 1,
    loading: false,
    error: null,
    currentPost: null,
    currentPostLoading: false,
  },
  reducers: {
    clearCurrentPost: (state) => {
      state.currentPost = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.items;
        state.total = action.payload.total;
        state.totalPages = action.payload.totalPages;
        state.page = action.payload.page;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch by ID
      .addCase(fetchPostById.pending, (state) => {
        state.currentPostLoading = true;
      })
      .addCase(fetchPostById.fulfilled, (state, action) => {
        state.currentPostLoading = false;
        state.currentPost = action.payload;
      })
      .addCase(fetchPostById.rejected, (state) => {
        state.currentPostLoading = false;
      })

      // Create
      .addCase(createPost.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
        state.total += 1;
      })

      // Update
      .addCase(updatePost.fulfilled, (state, action) => {
        const index = state.list.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
        if (state.currentPost?.id === action.payload.id) {
          state.currentPost = action.payload;
        }
      })

      // Delete
      .addCase(deletePost.fulfilled, (state, action) => {
        state.list = state.list.filter(p => p.id !== action.payload);
        state.total = Math.max(0, state.total - 1);
        if (state.currentPost?.id === action.payload) {
          state.currentPost = null;
        }
      })

      // Publish
      .addCase(publishPost.fulfilled, (state, action) => {
        const index = state.list.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
        if (state.currentPost?.id === action.payload.id) {
          state.currentPost = action.payload;
        }
      })

      // Hide
      .addCase(hidePost.fulfilled, (state, action) => {
        const index = state.list.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
        if (state.currentPost?.id === action.payload.id) {
          state.currentPost = action.payload;
        }
      });
  }
});

export const { clearCurrentPost } = postsSlice.actions;
export default postsSlice.reducer;
