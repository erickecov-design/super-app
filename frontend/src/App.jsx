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

const getUserLevel = (marks = 0) => { /* ... */ };
const getLeagueLevel = (xp = 0) => { /* ... */ };

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
          {profile && ( <nav className="main-nav"> <div className="user-info"> <Link to="/profile" className="welcome-email"> Welcome, <strong>{profile.username}</strong> {profile.role === 'admin' && <span className="admin-badge">Admin</span>} </Link> <div className="user-level" style={{'--level-color': getUserLevel(profile.hash_marks).color}}>{getUserLevel(profile.hash_marks).name} - {profile.hash_marks.toLocaleString()} Marks</div> <button onClick={handleLogout} className="nav-button logout-btn">Logout</button> </div> </nav> )}
        </div>
      </header>
      <div className="ticker-and-league-bar">
        {league && <div className="league-bar"><span className="league-level" style={{ color: getLeagueLevel(league.total_xp).color }}>{getLeagueLevel(league.total_xp).name}</span><span className="league-xp">{league.total_xp.toLocaleString()} XP</span></div>}
        <NewsTicker />
      </div>
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

  const setupUser = async (user) => { /* ... */ };
  useEffect(() => { /* ... */ }, []);
  useEffect(() => { setupUser(session?.user); }, [session]);
  useEffect(() => { /* ... */ }, [session, profile]);
  
  const handleLogout = async () => await supabase.auth.signOut();
  if (loading) { return ( <div className="loading-container"> <PulseLoader color={"#007bff"} size={20} /> </div> ) }
  
  const ProtectedRoute = ({ children }) => {
    if (!session) return <Navigate to="/login" replace />;
    // This is the corrected logic. It now checks for the profile to be loaded first.
    if (profile && !profile.active_league_id) {
      return <LeaguesPage session={session} onUpdate={() => setupUser(session.user)} />;
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
        <Route path="/*" element={
          <ProtectedRoute>
            <MainLayout session={session} profile={profile} league={league} handleLogout={handleLogout} onSwitch={() => setupUser(session.user)}>
              <Routes>
                <Route path="/" element={<WarRoom session={session} profile={profile} />} />
                <Route path="/media" element={<Media />} />
                <Route path="/news" element={<News />} />
                <Route path="/leagues" element={<LeaguesPage session={session} onUpdate={() => setupUser(session.user)} />} />
                <Route path="/league/:leagueId" element={<LeagueHomePage session={session} />} />
                <Route path="/leaderboards" element={<Leaderboards />} />
                <Route path="/hall-of-fame" element={<HallOfFame session={session} league={league} />} />
                <Route path="/profile" element={<Profile session={session} profile={profile} league={league} onUpdate={() => setupUser(session.user)} />} />
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </>
  );
}
export default App;