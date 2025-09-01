// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, Navigate, NavLink } from "react-router-dom";
import { supabase } from './supabaseClient';
import { Toaster, toast } from 'react-hot-toast';

import WarRoom from './pages/WarRoom';
import News from './pages/News';
import HallOfFame from './pages/HallOfFame';
import Trivia from './pages/Trivia';
import PaperFootball from './pages/PaperFootball';
import Profile from './pages/Profile';
import Leaderboards from './pages/Leaderboards';
import Legal from './pages/Legal';

const getLeagueLevel = (xp) => { if (xp <= 1500000) return { name: 'Orange - Rookie', color: '#ff8c00' }; if (xp <= 3000000) return { name: 'Blue - Intermediate', color: '#007bff' }; if (xp <= 7000000) return { name: 'White - Professional', color: '#f8f9fa' }; if (xp <= 14500000) return { name: 'Silver - Legend', color: '#c0c0c0' }; return { name: 'Gold - Master', color: '#ffd700' }; };
const getUserLevel = (marks) => { if (marks <= 1000) return { name: 'Rookie', color: '#9d9d9d' }; if (marks <= 3500) return { name: 'Intermediate', color: '#007bff' }; if (marks <= 8000) return { name: 'Pro', color: '#f8f9fa' }; if (marks <= 21500) return { name: 'Legend', color: '#c0c0c0' }; return { name: 'Master', color: '#ffd700' }; };

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [league, setLeague] = useState(null);
  const [loading, setLoading] = useState(true);

  const setupUser = async (user) => { const { data: userProfile } = await supabase.from('profiles').select('username, league_id, hash_marks, avatar_url').eq('id', user.id).single(); setProfile(userProfile); if (userProfile?.league_id) { const { data: leagueData } = await supabase.from('leagues').select('*').eq('id', userProfile.league_id).single(); setLeague(leagueData); } };
  useEffect(() => { const getSessionAndSetup = async () => { const { data: { session } } = await supabase.auth.getSession(); setSession(session); if (session) await setupUser(session.user); setLoading(false); }; getSessionAndSetup(); const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => { setSession(session); if (!session) { setProfile(null); setLeague(null); } else { await setupUser(session.user); } }); return () => subscription.unsubscribe(); }, []);
  useEffect(() => { if (!session?.user?.id) return; const dataChannel = supabase.channel('public-data-updates').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'leagues', filter: `id=eq.${profile?.league_id}`}, payload => setLeague(payload.new)).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${session.user.id}`}, payload => setProfile(payload.new)).subscribe(); return () => supabase.removeChannel(dataChannel); }, [session, profile]);
  
  const handleLogout = async () => await supabase.auth.signOut();
  
  const CreateLeague = () => { const [leagueName, setLeagueName] = useState(''); const handleSubmit = async (e) => { e.preventDefault(); if (!leagueName.trim()) return; const { data: newLeague, error: leagueError } = await supabase.from('leagues').insert({ name: leagueName, commissioner_id: session.user.id }).select().single(); if (leagueError) return toast.error(leagueError.message); const { error: profileError } = await supabase.from('profiles').update({ league_id: newLeague.id }).eq('id', session.user.id); if (profileError) return toast.error(profileError.message); toast.success(`League '${leagueName}' created!`); setLeague(newLeague); setProfile({ ...profile, league_id: newLeague.id }); }; return ( <div className="create-league-container"> <h2>Create Your League</h2> <p>You're not in a league yet. Create one to start earning XP!</p> <form onSubmit={handleSubmit} className="post-form"> <input type="text" placeholder="Your League's Name" className="auth-input" value={leagueName} onChange={(e) => setLeagueName(e.target.value)} /> <button type="submit">Create League</button> </form> </div> ); };
  const Auth = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [agreed, setAgreed] = useState(false);

    const handleSignUp = async (e) => {
      e.preventDefault();
      if (!agreed) {
        toast.error('You must agree to the Terms of Service to sign up.');
        return;
      }
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { username: username } } });
      if (error) toast.error(error.message);
      else toast.success('Sign up successful! Please check your email to confirm.');
    };
    
    const handleLogin = async (e) => { e.preventDefault(); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) toast.error(error.message); };

    return (
      <div className="auth-form-container">
        <h2>Enter the Mothership</h2>
        <form>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="auth-input" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="auth-input" />
          <input type="text" placeholder="Username (for new sign-ups)" value={username} onChange={(e) => setUsername(e.target.value)} className="auth-input" />
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
    );
  };
  
  if (loading) { return <div className="main-content"><h2>Loading SUPER...</h2></div> }
  const ProtectedRoute = ({ children }) => { if (!session) return <Navigate to="/login" replace />; if (!profile?.league_id && window.location.pathname !== '/login') return <CreateLeague />; return children; };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} toastOptions={{ style: { background: '#333', color: '#fff', }, }} />
      <div className="app-container">
        <header className="app-header">
          <div className="logo-container"> <Link to="/"><h1 className="logo-text">SUPER</h1></Link> <p className="subtitle-text">The Home of Fantasy Football</p> </div>
          {session && <nav className="page-nav"> <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>War Room</NavLink> <NavLink to="/news" className={({ isActive }) => isActive ? 'active' : ''}>News</NavLink> <NavLink to="/leaderboards" className={({ isActive }) => isActive ? 'active' : ''}>Leaderboards</NavLink> <NavLink to="/hall-of-fame" className={({ isActive }) => isActive ? 'active' : ''}>Hall of Fame</NavLink> <div className="nav-dropdown"> <span className="nav-dropdown-label">Games</span> <div className="nav-dropdown-content"> <NavLink to="/trivia">Trivia</NavLink> <NavLink to="/paper-football">Paper Football</NavLink> </div> </div> </nav> }
          {session && league && ( <div className="league-info"> <span className="league-name">{league.name}</span> <span className="league-xp">{league.total_xp.toLocaleString()} XP</span> <span className="league-level" style={{ color: getLeagueLevel(league.total_xp).color }}>{getLeagueLevel(league.total_xp).name}</span> </div> )}
          {session && profile && ( <nav className="main-nav"> <div className="user-info"> <Link to="/profile" className="welcome-email">Welcome, <strong>{profile.username}</strong></Link> <div className="user-level" style={{'--level-color': getUserLevel(profile.hash_marks).color}}>{getUserLevel(profile.hash_marks).name} - {profile.hash_marks.toLocaleString()} Marks</div> </div> <button onClick={handleLogout} className="nav-button">Logout</button> </nav> )}
        </header>
        <main className="main-content">
          <Routes>
            <Route path="/login" element={!session ? <Auth /> : <Navigate to="/" replace />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/" element={<ProtectedRoute><WarRoom session={session} profile={profile} /></ProtectedRoute>} />
            <Route path="/news" element={<ProtectedRoute><News /></ProtectedRoute>} />
            <Route path="/leaderboards" element={<ProtectedRoute><Leaderboards /></ProtectedRoute>} />
            <Route path="/hall-of-fame" element={<ProtectedRoute><HallOfFame session={session} league={league} /></ProtectedRoute>} />
            <Route path="/trivia" element={<ProtectedRoute><Trivia /></ProtectedRoute>} />
            <Route path="/paper-football" element={<ProtectedRoute><PaperFootball /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile session={session} profile={profile} onUpdate={() => setupUser(session.user)} /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </>
  );
}
export default App;