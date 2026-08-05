import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../utils/apiClient';
import defaultBg from '../../assets/default-bg.jpg';

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
    let dataToProcess = [];
    try {
      const response = await apiClient.get('/families');
      dataToProcess = response.data;
    } catch (error) {
      console.warn('API /families failed (possibly not implemented yet). Fallback to mock data.', error);
      await new Promise(resolve => setTimeout(resolve, 800));
      dataToProcess = [...mockFamilies];
    }

    // Tạm thời tính toán thống kê (membersCount, generations) ở frontend
    // Bằng cách gọi API lấy danh sách thành viên của từng gia phả
    try {
      const updatedData = await Promise.all(dataToProcess.map(async (family) => {
        try {
          const membersRes = await apiClient.get(`/families/${family.id}/members`);
          const membersData = membersRes.data?.members || [];
          const membersCount = membersData.length;
          let maxGen = 1;
          membersData.forEach(m => {
            const gen = parseInt(m.generation, 10) || 1;
            if (gen > maxGen) maxGen = gen;
          });

          return {
            ...family,
            membersCount,
            generations: maxGen
          };
        } catch (err) {
          // Nếu không lấy được, giữ nguyên số liệu cũ
          return family;
        }
      }));
      return updatedData;
    } catch (error) {
      return dataToProcess;
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
        coverImg: familyData.coverImg || defaultBg,
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
        coverImg: familyData.coverImg || defaultBg,
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
      })

      // Upload Cover Image
      .addCase(uploadFamilyCoverImage.fulfilled, (state, action) => {
        const updatedFamily = action.payload;
        // Update in Redux state
        const index = state.list.findIndex(f => f.id === updatedFamily.id);
        if (index !== -1) {
          state.list[index].coverImg = updatedFamily.coverImageUrl;
        }
        // Update in mock local storage
        const mockIndex = mockFamilies.findIndex(f => f.id === updatedFamily.id);
        if (mockIndex !== -1) {
          mockFamilies[mockIndex].coverImg = updatedFamily.coverImageUrl;
          saveMockFamilies();
        }
      });
  },
});

export default familiesSlice.reducer;
