// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'react-hot-toast';
import AuthLayout from '../layouts/AuthLayout';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
    }
    // If successful, the onAuthStateChange listener in App.jsx will handle the redirect.
    setLoading(false);
  };

  return (
    <AuthLayout>
      <div className="login-card">
        <img src="/logo.png" alt="SUPER Logo" className="login-logo" />
        <h2 className="login-subtitle">The Home of Fantasy Football</h2>
        
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="auth-input" required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="auth-input" required />
          <div className="auth-buttons">
            <button type="submit" className="nav-button signup" disabled={loading} style={{width: '100%'}}>
              {loading ? 'Logging In...' : 'Log In'}
            </button>
          </div>
        </form>
        <div className="auth-card-footer">
          Need an account? <Link to="/signup">Sign Up</Link>
        </div>
      </div>
    </AuthLayout>
  );
}