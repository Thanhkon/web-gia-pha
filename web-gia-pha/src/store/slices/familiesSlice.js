import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../utils/apiClient';
import defaultBg from '../../assets/default-bg.jpg';

// 1. GET: Lấy danh sách gia phả của user
export const fetchFamilies = createAsyncThunk(
  'families/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/families');
      return response.data;
    } catch (error) {
      console.warn('API /families failed.', error);
      return rejectWithValue(
        error?.response?.data || error.message || 'Failed to fetch families'
      );
    }
  },
  {
    condition: (_, { getState }) => {
      const { families } = getState();
      if (families.loading) {
        return false;
      }
    }
  }
);

// 2. GET: Tìm kiếm gia phả theo mã familyCode
export const findFamilyByCode = createAsyncThunk(
  'families/findByCode',
  async (code, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/families/code/${code}`);
      return response.data;
    } catch (error) {
      console.warn(`API GET /families/code/${code} failed.`, error);
      const message =
        error?.response?.status === 404
          ? 'Không tìm thấy gia phả với mã đã nhập.'
          : error?.response?.data || error.message || `Failed to find family by code ${code}`;
      return rejectWithValue(message);
    }
  }
);

// 3. POST: Tạo gia phả mới
export const createFamily = createAsyncThunk(
  'families/create',
  async (familyData, { rejectWithValue }) => {
    try {
      const isFormData = familyData instanceof FormData;
      const response = await apiClient.post('/families', familyData, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
      });

      const coverImageUrl = response.data.coverImageUrl || response.data.coverImg;

      const newFamily = {
        ...response.data,
        membersCount: response.data.membersCount ?? 1,
        generations: response.data.generations ?? 1,
        role: response.data.role ?? 'admin',
        coverImg: coverImageUrl || defaultBg,
      };
      return newFamily;
    } catch (error) {
      console.warn('API POST /families failed.', error);
      return rejectWithValue(
        error?.response?.data || error.message || 'Failed to create family'
      );
    }
  }
);

export const updateFamily = createAsyncThunk(
  'families/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/families/${id}`, data);
      return response.data;
    } catch (error) {
      console.warn(`API PATCH /families/${id} failed.`, error);
      return rejectWithValue(error.response?.data || error.message || 'Failed to update family');
    }
  }
);

export const uploadFamilyCoverImage = createAsyncThunk(
  'families/uploadCover',
  async ({ familyId, file }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await apiClient.post(`/families/${familyId}/cover-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data; // This is the updated family object with coverImageUrl
    } catch (error) {
      console.error('Failed to upload family cover:', error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteFamily = createAsyncThunk(
  'families/delete',
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/families/${id}`);
      return id;
    } catch (error) {
      console.warn(`API DELETE /families/${id} failed.`, error);
      return rejectWithValue(error.response?.data || error.message || 'Failed to delete family');
    }
  }
);

const familiesSlice = createSlice({
  name: 'families',
  initialState: {
    list: [],
    loading: false,
    error: null,
    searchResult: null,
    searchLoading: false,
    searchError: null,
  },
  reducers: {
    clearSearch: (state) => {
      state.searchResult = null;
      state.searchError = null;
      state.searchLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Families
      .addCase(fetchFamilies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFamilies.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchFamilies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Family
      .addCase(createFamily.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })

      // Find by Code
      .addCase(findFamilyByCode.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
        state.searchResult = null;
      })
      .addCase(findFamilyByCode.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResult = action.payload;
        state.searchError = null;
      })
      .addCase(findFamilyByCode.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchResult = null;
        state.searchError = action.payload || action.error?.message;
      })
      // Update Family
      .addCase(updateFamily.fulfilled, (state, action) => {
        const index = state.list.findIndex(f => f.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })
      // Delete Family
      .addCase(deleteFamily.fulfilled, (state, action) => {
        state.list = state.list.filter(f => f.id !== action.payload);
      })
      // Upload Cover Image
      .addCase(uploadFamilyCoverImage.fulfilled, (state, action) => {
        const updatedFamily = action.payload;
        const index = state.list.findIndex(f => f.id === updatedFamily.id);
        if (index !== -1) {
          state.list[index].coverImageUrl = updatedFamily.coverImageUrl;
        }
      });
  },
});

export const { clearSearch } = familiesSlice.actions;

export default familiesSlice.reducer;