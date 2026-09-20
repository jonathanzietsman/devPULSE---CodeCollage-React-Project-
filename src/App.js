import React, { useEffect } from 'react';
import { clearProjects } from './features/projectsSlice.js';
import { clearLogs } from './features/healthSlice';
import { useDispatch, useSelector } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase-config.js';
import { setUser, clearUser } from './features/authSlice.js';
import Login from './pages/login/login.js';
import Dashboard from './pages/dashboard/dashboard.js';
import './App.css';

function App() {
  const dispatch = useDispatch();
  const { user, isInitialized } = useSelector((state) => state.auth);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        dispatch(
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
          })
        );
      } else {
        dispatch(clearUser());
        dispatch(clearProjects());
        dispatch(clearLogs());
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  if (!isInitialized) {
    return (
      <div className="app-loader">
        <div className="app-loader__spinner" />
        <p>Loading DevPulse…</p>
      </div>
    );
  }

  return <div className="App">{user ? <Dashboard /> : <Login />}</div>;
}

export default App;