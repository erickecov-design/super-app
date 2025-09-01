// src/pages/Leaderboards.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Avatar from '../components/Avatar';

export default function Leaderboards() {
  const [leagues, setLeagues] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboards = async () => {
      // Fetch both leaderboards in parallel
      const [leagueRes, userRes] = await Promise.all([
        supabase.from('leagues').select('name, total_xp').order('total_xp', { ascending: false }).limit(100),
        supabase.from('profiles').select('username, hash_marks, avatar_url').order('hash_marks', { ascending: false }).limit(100)
      ]);

      if (leagueRes.error) console.error('Error fetching league leaderboard:', leagueRes.error);
      else setLeagues(leagueRes.data);
      
      if (userRes.error) console.error('Error fetching user leaderboard:', userRes.error);
      else setUsers(userRes.data);
      
      setLoading(false);
    };

    fetchLeaderboards();
  }, []);

  if (loading) return <h2>Loading Leaderboards...</h2>;

  const getRankColor = (rank) => {
    if (rank === 1) return '#ffd700'; // Gold
    if (rank === 2) return '#c0c0c0'; // Silver
    if (rank === 3) return '#cd7f32'; // Bronze
    return '#e0e0e0';
  };

  return (
    <div className="leaderboards-container">
      <div className="leaderboard-card">
        <h2>League Rankings (By XP)</h2>
        <ul className="leaderboard-list">
          {leagues.map((league, index) => (
            <li key={index}>
              <span className="rank" style={{ color: getRankColor(index + 1) }}>#{index + 1}</span>
              <span className="name">{league.name}</span>
              <span className="score">{league.total_xp.toLocaleString()} XP</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="leaderboard-card">
        <h2>User Rankings (By Hash Marks)</h2>
        <ul className="leaderboard-list">
          {users.map((user, index) => (
            <li key={index}>
              <span className="rank" style={{ color: getRankColor(index + 1) }}>#{index + 1}</span>
              <span className="name user-entry">
                <Avatar url={user.avatar_url} size={30} />
                {user.username}
              </span>
              <span className="score">{user.hash_marks.toLocaleString()} Marks</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}