import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/authSlice.js';
import projectsReducer from '../features/projectsSlice.js';
import healthReducer from '../features/healthSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectsReducer,
    health: healthReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});