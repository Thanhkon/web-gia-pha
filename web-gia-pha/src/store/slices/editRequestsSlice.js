import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import {
  getEditRequestsAPI,
  addEditRequestAPI,
  approveEditRequestAPI,
  rejectEditRequestAPI,
  deleteEditRequestAPI
} from '../../services/editRequestService';

export const fetchRequests = createAsyncThunk(
  'editRequests/fetchRequests',
  async (familyId, { rejectWithValue }) => {
    try {
      const data = await getEditRequestsAPI(familyId);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch requests');
    }
  },
  {
    condition: (familyId, { getState }) => {
      const { editRequests } = getState();
      if (editRequests.loading) {
        return false;
      }
    }
  }
);

export const addRequest = createAsyncThunk(
  'editRequests/addRequest',
  async ({ familyId, requestData }, { rejectWithValue }) => {
    try {
      const data = await addEditRequestAPI(familyId, requestData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add request');
    }
  }
);

export const approveRequestThunk = createAsyncThunk(
  'editRequests/approveRequest',
  async ({ id, adminNote, reviewerName }, { rejectWithValue }) => {
    try {
      const data = await approveEditRequestAPI(id, adminNote, reviewerName);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to approve request');
    }
  }
);

export const rejectRequestThunk = createAsyncThunk(
  'editRequests/rejectRequest',
  async ({ id, adminNote, reviewerName }, { rejectWithValue }) => {
    try {
      const data = await rejectEditRequestAPI(id, adminNote, reviewerName);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reject request');
    }
  }
);

export const deleteRequestThunk = createAsyncThunk(
  'editRequests/deleteRequest',
  async (id, { rejectWithValue }) => {
    try {
      await deleteEditRequestAPI(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete request');
    }
  }
);

const initialState = {
  items: [],
  loading: false,
  error: null
};

const editRequestsSlice = createSlice({
  name: 'editRequests',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchRequests
      .addCase(fetchRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.items = [];
      })
      .addCase(fetchRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // addRequest
      .addCase(addRequest.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      // approveRequest
      .addCase(approveRequestThunk.fulfilled, (state, action) => {
        const index = state.items.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      // rejectRequest
      .addCase(rejectRequestThunk.fulfilled, (state, action) => {
        const index = state.items.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      // deleteRequest
      .addCase(deleteRequestThunk.fulfilled, (state, action) => {
        state.items = state.items.filter(r => r.id !== action.payload);
      });
  }
});

// Selectors
export const selectAllRequests = state => state.editRequests.items;

export const selectPendingRequests = createSelector(
  [selectAllRequests],
  (items) => items.filter(r => r.status?.toLowerCase() === 'pending').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
);

export const selectProcessedRequests = createSelector(
  [selectAllRequests],
  (items) => items.filter(r => r.status?.toLowerCase() !== 'pending').sort((a, b) => new Date(b.reviewedAt) - new Date(a.reviewedAt))
);

export const selectPendingCount = createSelector(
  [selectPendingRequests],
  (pending) => pending.length
);

export default editRequestsSlice.reducer;
