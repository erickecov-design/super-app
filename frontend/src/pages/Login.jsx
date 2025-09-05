// src/pages/Login.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'react-hot-toast';
import AuthLayout from '../layouts/AuthLayout';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [agreed, setAgreed] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!agreed) {
      toast.error('You must agree to the Terms of Service to sign up.');
      return;
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { 
          username: username,
          invite_code: inviteCode.trim()
        }
      }
    });
    if (error) toast.error(error.message);
    else toast.success('Sign up successful! Please check your email to confirm.');
  };
  
  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message);
  };

  return (
    <AuthLayout>
      <div className="login-card">
        <img src="/logo.png" alt="SUPER Logo" className="login-logo" />
        <h2 className="login-subtitle">The Home of Fantasy Football</h2>
        
        <form>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="auth-input" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="auth-input" />
          <input type="text" placeholder="Username (for new sign-ups)" value={username} onChange={(e) => setUsername(e.target.value)} className="auth-input" />
          <input type="text" placeholder="Invite Code (Optional)" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} className="auth-input" />
          
          <div className="terms-agreement">
            <input type="checkbox" id="terms" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <label htmlFor="terms">I agree to the <Link to="/legal" target="_blank">Terms of Service & Privacy Policy</Link>.</label>
          </div>
          
          <div className="auth-buttons">
            <button onClick={handleLogin} className="nav-button">Log In</button>
            <button onClick={handleSignUp} className="nav-button signup" disabled={!agreed}>Sign Up</button>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}