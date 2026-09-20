import React, { useState } from 'react';
import { auth } from '../../config/firebase-config.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import './login.css';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        setSuccess('Account created. Signing you in…');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setSuccess('Logged in. Welcome back.');
      }
    } catch (err) {
      const message = err.message.replace('Firebase: ', '');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsSignUp((prev) => !prev);
    setError('');
    setSuccess('');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand__mark">DP</div>
          <h2>
            {isSignUp ? 'Create your account' : 'Welcome to DevPulse'}
          </h2>
        </div>
        <p className="login-subtitle">
          Track your code. Monitor your health. Stay balanced.
        </p>

        {error && <div className="login-error">{error}</div>}
        {success && <div className="login-success">{success}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="login-input"
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                placeholder="At least 6 characters"
                className="login-input"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((p) => !p)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="login-button"
          >
            {loading
              ? 'Please wait…'
              : isSignUp
              ? 'Create account'
              : 'Log in'}
          </button>
        </form>

        <p className="toggle-text">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <span onClick={switchMode} className="toggle-link">
            {isSignUp ? 'Log in' : 'Register'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;