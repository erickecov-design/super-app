// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, Navigate, NavLink } from "react-router-dom";
import { supabase } from './supabaseClient';
import { Toaster, toast } from 'react-hot-toast';
import { PulseLoader } from 'react-spinners';
import WarRoom from './pages/WarRoom';
import News from './pages/News';
import HallOfFame from './pages/HallOfFame';
import Profile from './pages/Profile';
import Leaderboards from './pages/Leaderboards';
import Legal from './pages/Legal';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Footer from './components/Footer';
import NewsTicker from './components/NewsTicker';
import LeaguesPage from './pages/LeaguesPage';
import Media from './pages/Media';
import LeagueHomePage from './pages/LeagueHomePage';
import LeagueSwitcher from './components/LeagueSwitcher';
import CreateLeague from './pages/CreateLeague';

const getUserLevel = (marks = 0) => { if (marks <= 1000) return { name: 'Rookie', color: '#6c757d' }; if (marks <= 3500) return { name: 'Intermediate', color: '#007bff' }; if (marks <= 8000) return { name: 'Pro', color: 'black' }; if (marks <= 21500) return { name: 'Legend', color: '#8d99ae' }; return { name: 'Master', color: '#ffd700' }; };
const getLeagueLevel = (xp = 0) => { if (xp <= 1500000) return { name: 'Orange - Rookie', color: '#ff8c00' }; if (xp <= 3000000) return { name: 'Blue - Intermediate', color: '#007bff' }; if (xp <= 7000000) return { name: 'White - Professional', color: 'black' }; if (xp <= 14500000) return { name: 'Silver - Legend', color: '#8d99ae' }; return { name: 'Gold - Master', color: '#ffd700' }; };

const MainLayout = ({ children, session, profile, league, handleLogout, onSwitch }) => {
  return (
    <div className="app-layout-grid">
      <header className="app-header">
        <div className="logo-container"> <Link to="/"> <img src="/logo.png" alt="SUPER Logo" className="super-logo" /> </Link> </div>
        <nav className="page-nav">
          <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>War Room</NavLink>
          <NavLink to="/media" className={({ isActive }) => isActive ? 'active' : ''}>Media</NavLink>
          <NavLink to="/news" className={({ isActive }) => isActive ? 'active' : ''}>News</NavLink>
          <NavLink to="/leagues" className={({ isActive }) => isActive ? 'active' : ''}>Leagues</NavLink>
          <NavLink to="/leaderboards" className={({ isActive }) => isActive ? 'active' : ''}>Leaderboards</NavLink>
          <NavLink to="/hall-of-fame" className={({ isActive }) => isActive ? 'active' : ''}>Hall of Fame</NavLink>
        </nav>
        <div className="header-right-section">
          <LeagueSwitcher session={session} activeLeague={league} onSwitch={onSwitch} />
          {profile && (
            <nav className="main-nav">
              <div className="user-info">
                <Link to="/profile" className="welcome-email">
                  Welcome, <strong>{profile.username}</strong>
                  {profile.role === 'admin' && <span className="admin-badge">Admin</span>}
                </Link>
                <div className="user-level" style={{'--level-color': getUserLevel(profile.hash_marks).color}}>{getUserLevel(profile.hash_marks).name} - {profile.hash_marks.toLocaleString()} Marks</div>
                <button onClick={handleLogout} className="nav-button logout-btn">Logout</button>
              </div>
            </nav>
          )}
        </div>
      </header>
      {league && <div className="league-bar"><span className="league-level" style={{ color: getLeagueLevel(league.total_xp).color }}>{getLeagueLevel(league.total_xp).name}</span><span className="league-xp">{league.total_xp.toLocaleString()} XP</span></div>}
      <NewsTicker />
      <main className="main-content">{children}</main>
      <Footer />
    </div>
  );
};

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [league, setLeague] = useState(null);
  const [loading, setLoading] = useState(true);

  const setupUser = async (user) => { if (!user) { setProfile(null); setLeague(null); setLoading(false); return; } const { data: userProfile } = await supabase.from('profiles').select('*, football_level').eq('id', user.id).single(); setProfile(userProfile); if (userProfile?.active_league_id) { const { data: leagueData } = await supabase.from('leagues').select('*').eq('id', userProfile.active_league_id).single(); setLeague(leagueData); } else { setLeague(null); } setLoading(false); };
  useEffect(() => { const getSessionAndSetup = async () => { const { data: { session } } = await supabase.auth.getSession(); setSession(session); await setupUser(session?.user); }; getSessionAndSetup(); const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => { setSession(session); }); return () => subscription.unsubscribe(); }, []);
  useEffect(() => { setupUser(session?.user); }, [session]);
  useEffect(() => { if (!session?.user?.id) return; try { const dataChannel = supabase.channel('public-data-updates').on('postgres_changes', { event: '*', schema: 'public', table: 'leagues', filter: `id=eq.${profile?.active_league_id}`}, payload => setLeague(payload.new)).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${session.user.id}`}, payload => setProfile(payload.new)).subscribe(); return () => { supabase.removeChannel(dataChannel); }; } catch (error) { console.error("Failed to subscribe to real-time updates:", error); } }, [session, profile]);
  useEffect(() => { if (!session?.user?.id) return; try { const membershipChannel = supabase.channel(`league-memberships-for-${session.user.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'league_members', filter: `profile_id=eq.${session.user.id}` }, (payload) => { console.log('Membership change detected, refetching user data:', payload); setupUser(session.user); }).subscribe(); return () => { supabase.removeChannel(membershipChannel); }; } catch (error) { console.error("Failed to subscribe to membership updates:", error); } }, [session]);
  
  const handleLogout = async () => await supabase.auth.signOut();
  if (loading) { return ( <div className="loading-container"> <PulseLoader color={"#007bff"} size={20} /> </div> ) }
  
  const ProtectedRoute = ({ children }) => {
    if (!session) return <Navigate to="/login" replace />;
    // If the user is logged in but has no active league, AND they are not already on the Leagues page,
    // send them to the Leagues page so they can create or join one.
    if (!profile?.active_league_id && window.location.pathname !== '/leagues') {
      return <Navigate to="/leagues" replace />;
    }
    return children;
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} toastOptions={{ style: { background: '#333', color: '#fff', }, }} />
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/signup" element={session ? <Navigate to="/" replace /> : <SignupPage />} />
        <Route path="/legal" element={<Legal />} />
        
        {/* Special route for Leagues page that doesn't get caught in the redirect loop */}
        <Route path="/leagues" element={
          !session ? <Navigate to="/login" replace /> : <MainLayout session={session} profile={profile} league={league} handleLogout={handleLogout} onSwitch={() => setupUser(session.user)}><LeaguesPage session={session} onUpdate={() => setupUser(session.user)} /></MainLayout>
        }/>
        
        <Route path="/*" element={
          <ProtectedRoute>
            <MainLayout session={session} profile={profile} league={league} handleLogout={handleLogout} onSwitch={() => setupUser(session.user)}>
              <Routes>
                <Route path="/" element={<WarRoom session={session} profile={profile} />} />
                <Route path="/media" element={<Media />} />
                <Route path="/news" element={<News />} />
                <Route path="/league/:leagueId" element={<LeagueHomePage session={session} />} />
                <Route path="/leaderboards" element={<Leaderboards />} />
                <Route path="/hall-of-fame" element={<HallOfFame session={session} league={league} />} />
                <Route path="/profile" element={<Profile session={session} profile={profile} league={league} onUpdate={() => setupUser(session.user)} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </>
  );
}
export default App;