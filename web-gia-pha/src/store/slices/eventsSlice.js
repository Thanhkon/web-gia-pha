import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { eventService } from '../../services/eventService';

export const fetchEvents = createAsyncThunk(
  'events/fetchAll',
  async ({ params, actor }, { rejectWithValue }) => {
    try {
      const data = await eventService.getEvents(params, actor);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || 'Failed to fetch events');
    }
  }
);



export const fetchEventById = createAsyncThunk(
  'events/fetchById',
  async ({ id, actor }, { rejectWithValue }) => {
    try {
      const data = await eventService.getEventById(id, actor);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || 'Failed to fetch event');
    }
  }
);

export const createEvent = createAsyncThunk(
  'events/create',
  async ({ payload, actor }, { rejectWithValue }) => {
    try {
      const data = await eventService.createEvent(payload, actor);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || 'Failed to create event');
    }
  }
);

export const updateEvent = createAsyncThunk(
  'events/update',
  async ({ id, payload, actor }, { rejectWithValue }) => {
    try {
      const data = await eventService.updateEvent(id, payload, actor);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || 'Failed to update event');
    }
  }
);

export const deleteEvent = createAsyncThunk(
  'events/delete',
  async ({ id, payload, actor }, { rejectWithValue }) => {
    try {
      await eventService.deleteEvent(id, payload, actor);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || 'Failed to delete event');
    }
  }
);

export const cancelEvent = createAsyncThunk(
  'events/cancel',
  async ({ id, payload, actor }, { rejectWithValue }) => {
    try {
      const data = await eventService.cancelEvent(id, payload, actor);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || 'Failed to cancel event');
    }
  }
);

const eventsSlice = createSlice({
  name: 'events',
  initialState: {
    list: [], // Filtered / search results
    loading: false,
    error: null,
    currentEvent: null,
    currentEventLoading: false,
  },
  reducers: {
    clearCurrentEvent: (state) => {
      state.currentEvent = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all (search results)
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data; // eventService returns createResponse which has .data
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })


      // Fetch By Id
      .addCase(fetchEventById.pending, (state) => {
        state.currentEventLoading = true;
      })
      .addCase(fetchEventById.fulfilled, (state, action) => {
        state.currentEventLoading = false;
        state.currentEvent = action.payload.data;
      })
      .addCase(fetchEventById.rejected, (state) => {
        state.currentEventLoading = false;
      })

      // Create
      .addCase(createEvent.fulfilled, (state, action) => {
        state.list.unshift(action.payload.data);
      })

      // Update
      .addCase(updateEvent.fulfilled, (state, action) => {
        const updated = action.payload.data;
        const updateInList = (list) => {
          const idx = list.findIndex(e => e.id === updated.id);
          if (idx !== -1) list[idx] = updated;
        };
        updateInList(state.list);
        if (state.currentEvent?.id === updated.id) {
          state.currentEvent = updated;
        }
      })

      // Delete
      .addCase(deleteEvent.fulfilled, (state, action) => {
        const id = action.payload;
        state.list = state.list.filter(e => e.id !== id);
        if (state.currentEvent?.id === id) {
          state.currentEvent = null;
        }
      })

      // Cancel
      .addCase(cancelEvent.fulfilled, (state, action) => {
        const updated = action.payload.data;
        const updateInList = (list) => {
          const idx = list.findIndex(e => e.id === updated.id);
          if (idx !== -1) list[idx] = updated;
        };
        updateInList(state.list);
        updateInList(state.calendarEvents);
        updateInList(state.upcomingEvents);
        updateInList(state.todayEvents);
        if (state.currentEvent?.id === updated.id) {
          state.currentEvent = updated;
        }
      });
  }
});

export const { clearCurrentEvent } = eventsSlice.actions;
export default eventsSlice.reducer;
