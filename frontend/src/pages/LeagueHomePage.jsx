// src/pages/LeagueHomePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Avatar from '../components/Avatar';

export default function LeagueHomePage() {
  const { leagueId } = useParams();
  const [league, setLeague] = useState(null);
  const [members, setMembers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeagueData = async () => {
      setLoading(true);
      
      // Fetch league details
      const { data: leagueData, error: leagueError } = await supabase
        .from('leagues')
        .select('*')
        .eq('id', leagueId)
        .single();
      if (leagueError) console.error("Error fetching league details:", leagueError);
      else setLeague(leagueData);

      // Fetch league members
      const { data: membersData, error: membersError } = await supabase
        .from('league_members')
        .select('profiles(*)')
        .eq('league_id', leagueId);
      if (membersError) console.error("Error fetching members:", membersError);
      else setMembers(membersData.map(m => m.profiles));

      setLoading(false);
    };
    fetchLeagueData();
  }, [leagueId]);

  if (loading) return <h2>Loading League...</h2>;
  if (!league) return <h2>League Not Found</h2>;

  return (
    <div className="league-home-page">
      <div className="league-home-header">
        <h1>{league.name}</h1>
        <p>Total XP: {league.total_xp.toLocaleString()}</p>
      </div>
      <div className="league-home-body">
        <div className="league-posts">
          <h3>League Activity</h3>
          {/* We will add league-specific posts here in a future update */}
          <p>League-specific post feed coming soon!</p>
        </div>
        <div className="league-members-sidebar">
          <h3>Members</h3>
          <ul className="member-list">
            {members.map(member => (
              <li key={member.id}>
                <Avatar url={member.avatar_url} size={30} />
                <span>{member.username}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}