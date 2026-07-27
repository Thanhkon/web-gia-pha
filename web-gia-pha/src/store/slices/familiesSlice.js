import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Mock data (thay thế bằng API call thực tế sau này)
let mockFamilies = [
  {
    id: 1,
    name: 'Gia phả họ Nguyễn',
    membersCount: 45,
    generations: 4,
    role: 'admin',
    coverImg: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    description: 'Chi Tôn, gốc ở Hưng Yên, di cư vào Nam năm 1954.',
    createdAt: '2023-01-15T00:00:00Z',
  },
  {
    id: 2,
    name: 'Gia phả họ Lê (Ngoại)',
    membersCount: 30,
    generations: 3,
    role: 'admin',
    coverImg: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    description: 'Họ Lê bên ngoại, chủ yếu sống ở TP.HCM.',
    createdAt: '2024-02-10T00:00:00Z',
  }
];

// Async Thunks
export const fetchFamilies = createAsyncThunk(
  'families/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      // Giả lập network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      return [...mockFamilies];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addFamily = createAsyncThunk(
  'families/add',
  async (familyData, { rejectWithValue }) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newFamily = {
        ...familyData,
        id: Date.now(),
        membersCount: 0,
        generations: 0,
        role: 'admin', // Người tạo luôn là admin
        createdAt: new Date().toISOString(),
      };
      mockFamilies.push(newFamily);
      return newFamily;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createFamily = createAsyncThunk(
  'families/create',
  async (familyData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/families', familyData);
      return {
        ...response.data,
        membersCount: 0,
        generations: 1,
        role: 'admin',
        coverImg: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateFamily = createAsyncThunk(
  'families/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const index = mockFamilies.findIndex(f => f.id === id);
      if (index === -1) throw new Error('Không tìm thấy gia phả');

      mockFamilies[index] = { ...mockFamilies[index], ...data };
      return mockFamilies[index];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteFamily = createAsyncThunk(
  'families/delete',
  async (id, { rejectWithValue }) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      mockFamilies = mockFamilies.filter(f => f.id !== id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const familiesSlice = createSlice({
  name: 'families',
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {},
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

      // Add Family
      .addCase(addFamily.fulfilled, (state, action) => {
        state.list.push(action.payload);
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
      });
  },
});

export default familiesSlice.reducer;
