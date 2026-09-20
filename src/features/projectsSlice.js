import { createSlice } from '@reduxjs/toolkit';

const projectsSlice = createSlice({
  name: 'projects',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    fetchProjectsStart: (state) => {
      state.status = 'loading';
    },
    fetchProjectsSuccess: (state, action) => {
      state.status = 'succeeded';
      state.items = action.payload;
    },
    fetchProjectsFailure: (state, action) => {
      state.status = 'failed';
      state.error = action.payload;
    },
    addProjectSuccess: (state, action) => {
      state.items.push(action.payload);
    },
    removeProjectSuccess: (state, action) => {
      state.items = state.items.filter((p) => p.id !== action.payload);
    },
    incrementProjectHours: (state, action) => {
      const { projectId, delta } = action.payload;
      const project = state.items.find((p) => p.id === projectId);
      if (project) {
        project.totalHours = Math.max(0, (project.totalHours || 0) + delta);
      }
    },
    clearProjects: (state) => {
      state.items = [];
      state.status = 'idle';
      state.error = null;
    },
  },
});

export const {
  fetchProjectsStart,
  fetchProjectsSuccess,
  fetchProjectsFailure,
  addProjectSuccess,
  removeProjectSuccess,
  incrementProjectHours,
  clearProjects,
} = projectsSlice.actions;

export default projectsSlice.reducer;