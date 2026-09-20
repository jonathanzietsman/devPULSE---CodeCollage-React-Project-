import { createSlice } from '@reduxjs/toolkit';

const healthSlice = createSlice({
  name: 'health',
  initialState: {
    logs: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    fetchLogsStart: (state) => {
      state.status = 'loading';
    },
    fetchLogsSuccess: (state, action) => {
      state.status = 'succeeded';
      state.logs = action.payload;
    },
    fetchLogsFailure: (state, action) => {
      state.status = 'failed';
      state.error = action.payload;
    },
    addLogSuccess: (state, action) => {
      state.logs.unshift(action.payload);
    },
    removeLogSuccess: (state, action) => {
      state.logs = state.logs.filter((l) => l.id !== action.payload);
    },
    clearLogs: (state) => {
      state.logs = [];
      state.status = 'idle';
      state.error = null;
    },
  },
});

export const {
  fetchLogsStart,
  fetchLogsSuccess,
  fetchLogsFailure,
  addLogSuccess,
  removeLogSuccess,
  clearLogs,
} = healthSlice.actions;

export default healthSlice.reducer;