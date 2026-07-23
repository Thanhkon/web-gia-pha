import { createSlice, createSelector } from '@reduxjs/toolkit';

const loadFromSessionStorage = (key, defaultData) => {
  try {
    const saved = sessionStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultData;
  } catch (e) {
    return defaultData;
  }
};

const initialState = {
  items: loadFromSessionStorage('giapha_edit_requests', [])
};

const editRequestsSlice = createSlice({
  name: 'editRequests',
  initialState,
  reducers: {
    submitRequest: (state, action) => {
      // payload: { type, targetMemberId, targetMemberName, changes, reason, submittedBy }
      const newRequest = {
        ...action.payload,
        id: `req_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        status: 'pending',
        adminNote: '',
        createdAt: new Date().toISOString(),
        reviewedAt: null,
        reviewedBy: null
      };
      state.items.push(newRequest);
    },
    approveRequest: (state, action) => {
      const { id, adminNote, reviewerName } = action.payload;
      const index = state.items.findIndex(r => r.id === id);
      if (index !== -1) {
        state.items[index].status = 'approved';
        state.items[index].adminNote = adminNote || '';
        state.items[index].reviewedAt = new Date().toISOString();
        state.items[index].reviewedBy = reviewerName;
      }
    },
    rejectRequest: (state, action) => {
      const { id, adminNote, reviewerName } = action.payload;
      const index = state.items.findIndex(r => r.id === id);
      if (index !== -1) {
        state.items[index].status = 'rejected';
        state.items[index].adminNote = adminNote || '';
        state.items[index].reviewedAt = new Date().toISOString();
        state.items[index].reviewedBy = reviewerName;
      }
    },
    deleteRequest: (state, action) => {
      state.items = state.items.filter(r => r.id !== action.payload);
    }
  }
});

export const { submitRequest, approveRequest, rejectRequest, deleteRequest } = editRequestsSlice.actions;

// Selectors
export const selectAllRequests = state => state.editRequests.items;

export const selectPendingRequests = createSelector(
  [selectAllRequests],
  (items) => items.filter(r => r.status === 'pending').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
);

export const selectProcessedRequests = createSelector(
  [selectAllRequests],
  (items) => items.filter(r => r.status !== 'pending').sort((a, b) => new Date(b.reviewedAt) - new Date(a.reviewedAt))
);

export const selectPendingCount = createSelector(
  [selectPendingRequests],
  (pending) => pending.length
);

export default editRequestsSlice.reducer;
