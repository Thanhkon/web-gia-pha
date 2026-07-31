import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../utils/apiClient';

// Mock data (thay thế bằng API call thực tế sau này)
const defaultMock = [
  {
    id: 1,
    name: 'Gia phả họ Nguyễn',
    membersCount: 45,
    generations: 4,
    role: 'admin',
    description: 'Chi Tôn, gốc ở Hưng Yên, di cư vào Nam năm 1954.',
    createdAt: '2023-01-15T00:00:00Z',
  },
];

const loadMockFamilies = () => {
  const saved = localStorage.getItem('mockFamilies');
  if (saved) return JSON.parse(saved);
  localStorage.setItem('mockFamilies', JSON.stringify(defaultMock));
  return defaultMock;
};

let mockFamilies = loadMockFamilies();

const saveMockFamilies = () => {
  localStorage.setItem('mockFamilies', JSON.stringify(mockFamilies));
};

// Async Thunks
export const fetchFamilies = createAsyncThunk(
  'families/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/families');
      return response.data;
    } catch (error) {
      console.warn('API /families failed (possibly not implemented yet). Fallback to mock data.', error);
      await new Promise(resolve => setTimeout(resolve, 800));
      return [...mockFamilies];
    }
  }
);

export const createFamily = createAsyncThunk(
  'families/create',
  async (familyData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/families', familyData);
      const newFamily = {
        ...response.data,
        membersCount: 0,
        generations: 1,
        role: 'admin',
        coverImg: familyData.coverImg || 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      };
      mockFamilies.unshift(newFamily); // Keep mock updated for session
      saveMockFamilies();
      return newFamily;
    } catch (error) {
      console.warn('API POST /families failed. Fallback to mock data.', error);
      await new Promise(resolve => setTimeout(resolve, 500));
      const newFamily = {
        ...familyData,
        id: Date.now(),
        membersCount: 0,
        generations: 1,
        role: 'admin',
        createdAt: new Date().toISOString(),
        coverImg: familyData.coverImg || 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      };
      mockFamilies.unshift(newFamily);
      saveMockFamilies();
      return newFamily;
    }
  }
);

export const updateFamily = createAsyncThunk(
  'families/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/families/${id}`, data);
      const index = mockFamilies.findIndex(f => f.id === id);
      if (index !== -1) {
        mockFamilies[index] = { ...mockFamilies[index], ...data };
        saveMockFamilies();
      }
      return response.data;
    } catch (error) {
      console.warn(`API PATCH /families/${id} failed. Fallback to mock data.`, error);
      await new Promise(resolve => setTimeout(resolve, 500));
      const index = mockFamilies.findIndex(f => f.id === id);
      if (index === -1) throw new Error('Không tìm thấy gia phả');

      mockFamilies[index] = { ...mockFamilies[index], ...data };
      saveMockFamilies();
      return mockFamilies[index];
    }
  }
);

export const deleteFamily = createAsyncThunk(
  'families/delete',
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/families/${id}`);
      mockFamilies = mockFamilies.filter(f => f.id !== id);
      saveMockFamilies();
      return id;
    } catch (error) {
      console.warn(`API DELETE /families/${id} failed. Fallback to mock data.`, error);
      await new Promise(resolve => setTimeout(resolve, 500));
      mockFamilies = mockFamilies.filter(f => f.id !== id);
      saveMockFamilies();
      return id;
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

      // Add Family (Fallback for older implementation compatibility)
      .addCase('families/add/fulfilled', (state, action) => {
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
