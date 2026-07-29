import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import apiClient from '../../utils/apiClient';
import { getTreeData, buildAdjacencyLists } from '../../utils/familyTreeUtils';

// Thunks
export const fetchFamilyTree = createAsyncThunk(
  'members/fetchFamilyTree',
  async (familyId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/families/${familyId}/members`);
      const { family, members, parentChildRelations, marriages } = response.data;
      
      // Convert backend relations to frontend unified format
      const relationships = [];
      
      if (parentChildRelations) {
        parentChildRelations.forEach(rel => {
          relationships.push({
            id: `pc_${rel.id}`,
            type: rel.relationType || 'biological_child',
            person_a: rel.parentId,
            person_b: rel.childId
          });
        });
      }

      if (marriages) {
        marriages.forEach(m => {
          relationships.push({
            id: `m_${m.id}`,
            type: 'marriage',
            person_a: m.memberAId,
            person_b: m.memberBId
          });
        });
      }

      return { family, members, relationships };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch family tree');
    }
  }
);

export const addMemberToFamily = createAsyncThunk(
  'members/addMember',
  async ({ familyId, memberData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/families/${familyId}/members`, memberData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add member');
    }
  }
);

export const updateMemberToFamily = createAsyncThunk(
  'members/updateMember',
  async ({ memberId, memberData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/members/${memberId}`, memberData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update member');
    }
  }
);

export const deleteMemberFromFamily = createAsyncThunk(
  'members/deleteMember',
  async (memberId, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/members/${memberId}`);
      return memberId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete member');
    }
  }
);

export const softDeleteMember = createAsyncThunk(
  'members/softDeleteMember',
  async (memberId, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/members/${memberId}`, { isDeleted: true });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to soft delete member');
    }
  }
);

export const addParentChildRelation = createAsyncThunk(
  'members/addParentChild',
  async (relationData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/parent-child-relations`, relationData);
      return {
        id: `pc_${response.data.id}`,
        type: response.data.relationType || 'biological_child',
        person_a: response.data.parentId,
        person_b: response.data.childId
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add relation');
    }
  }
);

export const addMarriageRelation = createAsyncThunk(
  'members/addMarriage',
  async (marriageData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/marriages`, marriageData);
      return {
        id: `m_${response.data.id}`,
        type: 'marriage',
        person_a: response.data.memberAId,
        person_b: response.data.memberBId
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add marriage');
    }
  }
);

const initialState = {
  familyInfo: null,
  persons: [],
  relationships: [],
  ui: {
    collapsedNodes: {}
  },
  loading: false,
  error: null
};

const membersSlice = createSlice({
  name: 'members',
  initialState,
  reducers: {
    setNodeCollapse: (state, action) => {
      const { personId, isCollapsed } = action.payload;
      state.ui.collapsedNodes[personId] = isCollapsed;
    },
    // Keep these synchronous reducers for offline/mock support or optimistic updates if needed
    updateMemberSync: (state, action) => {
      const index = state.persons.findIndex(p => p.id === action.payload.id);
      if (index !== -1) state.persons[index] = action.payload;
    },
    deleteMemberSync: (state, action) => {
      const id = typeof action.payload === 'object' ? action.payload.id : action.payload;
      state.persons = state.persons.filter(p => p.id !== id);
      state.relationships = state.relationships.filter(r => r.person_a !== id && r.person_b !== id);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFamilyTree.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.familyInfo = null;
        state.persons = [];
        state.relationships = [];
      })
      .addCase(fetchFamilyTree.fulfilled, (state, action) => {
        state.loading = false;
        state.familyInfo = action.payload.family;
        state.persons = action.payload.members;
        state.relationships = action.payload.relationships;
      })
      .addCase(fetchFamilyTree.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addMemberToFamily.fulfilled, (state, action) => {
        state.persons.push(action.payload);
      })
      .addCase(addParentChildRelation.fulfilled, (state, action) => {
        state.relationships.push(action.payload);
      })
      .addCase(addMarriageRelation.fulfilled, (state, action) => {
        state.relationships.push(action.payload);
      })
      .addCase(updateMemberToFamily.fulfilled, (state, action) => {
        const index = state.persons.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.persons[index] = action.payload;
        }
      })
      .addCase(softDeleteMember.fulfilled, (state, action) => {
        const index = state.persons.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.persons[index] = action.payload;
        }
      })
      .addCase(deleteMemberFromFamily.fulfilled, (state, action) => {
        const id = action.payload;
        state.persons = state.persons.filter(p => p.id !== id);
        state.relationships = state.relationships.filter(r => r.person_a !== id && r.person_b !== id);
      });
  }
});

export const { setNodeCollapse, updateMemberSync, deleteMemberSync } = membersSlice.actions;

// --- Selectors ---
export const selectPersons = (state) => state.members.persons;
export const selectRelationships = (state) => state.members.relationships;

// createSelector sẽ memoize kết quả dựa trên persons và relationships
export const selectTreeData = createSelector(
  [selectPersons, selectRelationships],
  (persons, relationships) => {
    return getTreeData(persons, relationships);
  }
);

export const selectFamilyTreeGraphData = createSelector(
  [selectPersons, selectRelationships],
  (persons, relationships) => {
    const pMap = new Map();
    const currentPersons = persons.filter(p => !p.isDeleted);
    currentPersons.forEach(p => pMap.set(p.id, p));

    const adjacency = buildAdjacencyLists(relationships, pMap);

    const rootNodes = [];
    const seenAsSpouse = new Set();
    
    const sortedForRoots = [...currentPersons].sort((a, b) => {
      if (a.gender === 'male' && b.gender !== 'male') return -1;
      if (a.gender !== 'male' && b.gender === 'male') return 1;
      return 0;
    });

    sortedForRoots.forEach(p => {
      const parents = adjacency[p.id]?.parents || [];
      const isActuallyInLaw = p.isInLaw;
      
      if (parents.length === 0 && !isActuallyInLaw && !seenAsSpouse.has(p.id)) {
        rootNodes.push(p);
        const spouses = adjacency[p.id]?.spouses || [];
        spouses.forEach(sId => seenAsSpouse.add(sId));
      }
    });

    return { personsMap: pMap, adj: adjacency, roots: rootNodes };
  }
);

export default membersSlice.reducer;
