// src/pages/LeaguesPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'react-hot-toast';

export default function LeaguesPage({ session, onUpdate }) {
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState('');
  const [newLeagueName, setNewLeagueName] = useState('');

  useEffect(() => {
    const fetchLeagues = async () => {
      // Fetches all leagues to browse
      const { data, error } = await supabase.from('leagues').select('id, name');
      if (error) { console.error("Error fetching leagues:", error); } 
      else { setLeagues(data); }
      setLoading(false);
    };
    fetchLeagues();
  }, []);

  const handleCreateLeague = async (e) => { e.preventDefault(); if (!newLeagueName.trim()) return; const { data: newLeague, error: leagueError } = await supabase.from('leagues').insert({ name: newLeagueName, commissioner_id: session.user.id }).select().single(); if (leagueError) return toast.error(leagueError.message); const { error: memberError } = await supabase.from('league_members').insert({ profile_id: session.user.id, league_id: newLeague.id }); if (memberError) return toast.error(memberError.message); const { error: profileError } = await supabase.from('profiles').update({ active_league_id: newLeague.id }).eq('id', session.user.id); if (profileError) return toast.error(profileError.message); toast.success(`League '${newLeagueName}' created!`); onUpdate(); };
  const handleJoinLeague = async (e) => { e.preventDefault(); if (!inviteCode.trim()) return; const { error } = await supabase.rpc('join_league_with_code', { invite_code_arg: inviteCode.trim() }); if (error) { toast.error(error.message); } else { toast.success("Successfully joined league!"); onUpdate(); } };

  if (loading) return <h2>Loading Leagues...</h2>

  return (
    <div className="leagues-page-container">
      <div className="league-actions-card">
        <h2>Join or Create a League</h2>
        <form onSubmit={handleJoinLeague} className="post-form">
          <p>Have an invite code? Join another league.</p>
          <input type="text" className="auth-input" placeholder="Enter Invite Code" value={inviteCode} onChange={e => setInviteCode(e.target.value)} />
          <button type="submit" className="nav-button">Join League</button>
        </form>
        <hr />
        <form onSubmit={handleCreateLeague} className="post-form">
          <p>Or, create a new league where you are the commissioner.</p>
          <input type="text" className="auth-input" placeholder="New League Name" value={newLeagueName} onChange={e => setNewLeagueName(e.target.value)} />
          <button type="submit" className="nav-button signup">Create New League</button>
        </form>
      </div>
      
      <div className="league-browser-card">
        <h2>Browse All Leagues</h2>
        <div className="league-list">
          {leagues.map(league => (
            <Link to={`/league/${league.id}`} key={league.id} className="league-list-item">
              <span>{league.name}</span>
              <span>&rarr;</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}