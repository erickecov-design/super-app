// src/pages/LeaguesPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'react-hot-toast';

export default function LeaguesPage({ session, onUpdate }) {
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newLeagueName, setNewLeagueName] = useState('');
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  useEffect(() => {
    const fetchLeaguesAndStatus = async () => {
      // Fetch all leagues for browsing
      const { data: leaguesData, error: leaguesError } = await supabase.from('leagues').select('id, name');
      if (leaguesError) { console.error("Error fetching leagues:", leaguesError); } 
      else { setLeagues(leaguesData); }

      // Check if this user has any pending requests
      const { data: pendingData, error: pendingError } = await supabase
        .from('league_members')
        .select('id')
        .eq('profile_id', session.user.id)
        .eq('status', 'pending');
      
      if (pendingError) { console.error("Error checking pending status:", pendingError); }
      else if (pendingData && pendingData.length > 0) {
        setHasPendingRequest(true);
      }

      setLoading(false);
    };
    fetchLeaguesAndStatus();
  }, [session.user.id]);

  const handleCreateLeague = async (e) => { e.preventDefault(); if (!newLeagueName.trim()) return; const { data: newLeague, error: leagueError } = await supabase.from('leagues').insert({ name: newLeagueName, commissioner_id: session.user.id }).select().single(); if (leagueError) return toast.error(leagueError.message); const { error: memberError } = await supabase.from('league_members').insert({ profile_id: session.user.id, league_id: newLeague.id, status: 'approved' }); if (memberError) return toast.error(memberError.message); const { error: profileError } = await supabase.from('profiles').update({ active_league_id: newLeague.id }).eq('id', session.user.id); if (profileError) return toast.error(profileError.message); toast.success(`League '${newLeagueName}' created!`); onUpdate(); };
  
  const handleRequestJoin = async (leagueId) => {
    const { error } = await supabase.rpc('request_to_join_league', { league_id_arg: leagueId });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Request to join sent!");
      setHasPendingRequest(true); // THIS IS THE KEY: Instantly update the UI
    }
  };

  if (loading) return <h2>Loading Leagues...</h2>

  // This is the new, robust onboarding flow
  if (hasPendingRequest) {
    return (
      <div className="pending-approval-container">
        <h2>Request Sent!</h2>
        <p>Your request to join a league has been sent to the commissioner.</p>
        <p>Once they approve your request, this page will automatically update.</p>
        <p>(You may need to refresh the page if it doesn't update automatically after a minute).</p>
      </div>
    );
  }

  return (
    <div className="leagues-page-container">
      <div className="league-actions-card">
        <h2>Create a League</h2>
        <form onSubmit={handleCreateLeague} className="post-form">
          <p>Create a new league where you are the commissioner.</p>
          <input type="text" className="auth-input" placeholder="New League Name" value={newLeagueName} onChange={e => setNewLeagueName(e.target.value)} />
          <button type="submit" className="nav-button signup">Create New League</button>
        </form>
      </div>
      
      <div className="league-browser-card">
        <h2>Browse & Join Leagues</h2>
        <div className="league-list">
          {leagues.map(league => (
            <div key={league.id} className="league-list-item">
              <Link to={`/league/${league.id}`} className="league-name-link">{league.name}</Link>
              <button className="nav-button" onClick={() => handleRequestJoin(league.id)}>Request to Join</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}