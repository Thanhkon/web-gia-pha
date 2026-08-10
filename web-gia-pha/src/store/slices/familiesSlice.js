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
  }
);

// 2. GET: Tìm kiếm gia phả theo mã familyCode (Trả về 200 kèm null nếu không tìm thấy)
export const findFamilyByCode = createAsyncThunk(
  'families/findByCode',
  async (code, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/families/code/${code}`);
      return response.data; // nếu backend trả về null thì response.data là null
    } catch (error) {
      return rejectWithValue(
        error?.response?.data || error.message || `Failed to find family by code ${code}`
      );
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
        // Nếu payload là null thì gán thông báo không tìm thấy
        state.searchError = action.payload ? null : 'Không tìm thấy gia phả với mã đã nhập.';
      })
      .addCase(findFamilyByCode.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchResult = null;
        state.searchError = action.payload || action.error?.message;
      });
  },
});

export const { clearSearch } = familiesSlice.actions;

export default familiesSlice.reducer;