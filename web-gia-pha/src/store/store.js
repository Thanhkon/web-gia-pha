import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import settingsReducer from './slices/settingsSlice';
import statsReducer from './slices/statsSlice';
import eventsReducer from './slices/eventsSlice';
import postsReducer from './slices/postsSlice';
import albumsReducer from './slices/albumsSlice';
import membersReducer from './slices/membersSlice';
import editRequestsReducer from './slices/editRequestsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    settings: settingsReducer,
    stats: statsReducer,
    events: eventsReducer,
    posts: postsReducer,
    albums: albumsReducer,
    members: membersReducer,
    editRequests: editRequestsReducer,
  },
});

// Lưu dữ liệu gia phả vào localStorage mỗi khi store thay đổi.
// Dùng subscriber thay vì gọi trong reducer để giữ reducer luôn là pure function.
let previousPersons = null;
let previousRelationships = null;
let previousEditRequests = null;

store.subscribe(() => {
  const { persons, relationships } = store.getState().members;

  // Chỉ ghi khi thực sự có thay đổi, tránh ghi thừa
  if (persons !== previousPersons) {
    previousPersons = persons;
    try {
      localStorage.setItem('giapha_mock_persons', JSON.stringify(persons));
    } catch (e) {
      console.warn('localStorage full, could not save persons:', e);
    }
  }

  if (relationships !== previousRelationships) {
    previousRelationships = relationships;
    try {
      localStorage.setItem('giapha_mock_relationships', JSON.stringify(relationships));
    } catch (e) {
      console.warn('localStorage full, could not save relationships:', e);
    }
  }

  const { items: editRequests } = store.getState().editRequests;
  if (editRequests !== previousEditRequests) {
    previousEditRequests = editRequests;
    try {
      localStorage.setItem('giapha_edit_requests', JSON.stringify(editRequests));
    } catch (e) {
      console.warn('localStorage full, could not save edit requests:', e);
    }
  }
});
