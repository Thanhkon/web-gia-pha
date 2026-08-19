import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import settingsReducer from './slices/settingsSlice';
import membersReducer from './slices/membersSlice';
import editRequestsReducer from './slices/editRequestsSlice';
import familiesReducer from './slices/familiesSlice';
import albumsReducer from './slices/albumsSlice';
import eventsReducer from './slices/eventsSlice';
import postsReducer from './slices/postsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    settings: settingsReducer,
    members: membersReducer,
    editRequests: editRequestsReducer,
    families: familiesReducer,
    albums: albumsReducer,
    events: eventsReducer,
    posts: postsReducer,
  },
});


