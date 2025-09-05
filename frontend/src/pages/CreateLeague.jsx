// src/pages/CreateLeague.jsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'react-hot-toast';

export default function CreateLeague({ session, profile, onLeagueCreate }) {
  const [leagueName, setLeagueName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!leagueName.trim()) return;
    setLoading(true);

    // 1. Create the league
    const { data: newLeague, error: leagueError } = await supabase
      .from('leagues')
      .insert({ name: leagueName, commissioner_id: session.user.id })
      .select()
      .single();

    if (leagueError) {
      setLoading(false);
      return toast.error(leagueError.message);
    }

    // 2. Update the user's profile to join the league
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ league_id: newLeague.id })
      .eq('id', session.user.id);
    
    if (profileError) {
      setLoading(false);
      return toast.error(profileError.message);
    }
    
    toast.success(`League '${leagueName}' created!`);
    onLeagueCreate(); // This triggers a refetch in App.jsx
    setLoading(false);
  };

  return (
    <div className="create-league-container">
      <h2>Create Your League</h2>
      <p>You're not in a league yet. Create one to start earning XP!</p>
      <form onSubmit={handleSubmit} className="post-form">
        <input
          type="text"
          placeholder="Your League's Name"
          className="auth-input"
          value={leagueName}
          onChange={(e) => setLeagueName(e.target.value)}
        />
        <button type="submit" className="nav-button signup" disabled={loading}>
          {loading ? 'Creating...' : 'Create League'}
        </button>
      </form>
    </div>
  );
}