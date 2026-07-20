import { createSlice } from '@reduxjs/toolkit';
import { MOCK_PERSONS, MOCK_RELATIONSHIPS } from '../../data/mockFamily';

// Try to load from localStorage first
const loadFromLocal = (key, defaultData) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultData;
  } catch (e) {
    return defaultData;
  }
};

const initialState = {
  persons: loadFromLocal('giapha_mock_persons', MOCK_PERSONS),
  relationships: loadFromLocal('giapha_mock_relationships', MOCK_RELATIONSHIPS),
  ui: {
    collapsedNodes: {} // Dạng object: { "id_nguoi_dung": true }
  }
};

const membersSlice = createSlice({
  name: 'members',
  initialState,
  reducers: {
    addMember: (state, action) => {
      state.persons.push(action.payload);
      // localStorage được xử lý bởi store subscriber ở store.js
    },
    addMembersBulk: (state, action) => {
      const { newPersons, newRelationships } = action.payload;
      if (newPersons && newPersons.length > 0) {
        state.persons.push(...newPersons);
      }
      if (newRelationships && newRelationships.length > 0) {
        state.relationships.push(...newRelationships);
      }
    },
    updateMember: (state, action) => {
      const index = state.persons.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.persons[index] = action.payload;
      }
    },
    deleteMember: (state, action) => {
      const payload = action.payload;
      const id = typeof payload === 'object' ? payload.id : payload;
      const hardDelete = typeof payload === 'object' ? payload.hardDelete : false;

      if (hardDelete) {
        state.persons = state.persons.filter(p => p.id !== id);
        state.relationships = state.relationships.filter(r => r.person_a !== id && r.person_b !== id);
      } else {
        // Soft delete
        const index = state.persons.findIndex(p => p.id === id);
        if (index !== -1) {
          state.persons[index].isDeleted = true;
        }
      }
    },
    addRelationship: (state, action) => {
      state.relationships.push(action.payload);
    },
    setNodeCollapse: (state, action) => {
      const { personId, isCollapsed } = action.payload;
      state.ui.collapsedNodes[personId] = isCollapsed;
    }
  },
});

export const { addMember, addMembersBulk, updateMember, deleteMember, addRelationship, setNodeCollapse } = membersSlice.actions;

export default membersSlice.reducer;
