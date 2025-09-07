// src/pages/LeagueHomePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Avatar from '../components/Avatar';
import { toast } from 'react-hot-toast';

export default function LeagueHomePage({ session }) {
  const { leagueId } = useParams();
  const [league, setLeague] = useState(null);
  const [members, setMembers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const isCommissioner = league && session && league.commissioner_id === session.user.id;

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

    // Fetch ONLY approved members for this league
    const { data: membersData, error: membersError } = await supabase
      .from('league_members')
      .select('id, status, profiles(*)')
      .eq('league_id', leagueId)
      .eq('status', 'approved'); // This is more efficient
    if (membersError) console.error("Error fetching members:", membersError);
    else setMembers(membersData);

    // If the current user is the commissioner, also fetch pending requests
    if (leagueData && session && leagueData.commissioner_id === session.user.id) {
      const { data: requestsData, error: requestsError } = await supabase
        .from('league_members')
        .select('id, status, profiles(*)')
        .eq('league_id', leagueId)
        .eq('status', 'pending');
      if (requestsError) console.error("Error fetching pending requests:", requestsError);
      else setPendingRequests(requestsData);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    if (leagueId && session) {
      fetchLeagueData();
    }
  }, [leagueId, session]);

  const handleRequest = async (memberRowId, status) => {
    const { error } = await supabase.rpc('manage_join_request', { member_row_id: memberRowId, new_status: status });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Request ${status}.`);
      fetchLeagueData(); // Refresh all the data on the page
    }
  };

  if (loading) return <h2>Loading League...</h2>;
  if (!league) return <h2>League Not Found</h2>;

  return (
    <div className="league-home-page">
      <div className="league-home-header">
        <h1>{league.name}</h1>
        <p>Total XP: {league.total_xp.toLocaleString()}</p>
      </div>

      {isCommissioner && pendingRequests.length > 0 && (
        <div className="pending-requests-card">
          <h3>Pending Join Requests</h3>
          <ul className="member-list">
            {pendingRequests.map(req => (
              <li key={req.id}>
                <div className="member-info">
                  <Avatar url={req.profiles.avatar_url} size={30} />
                  <span>{req.profiles.username}</span>
                </div>
                <div className="request-actions">
                  <button className="approve-btn" onClick={() => handleRequest(req.id, 'approved')}>Approve</button>
                  <button className="deny-btn" onClick={() => handleRequest(req.id, 'denied')}>Deny</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="league-home-body">
        <div className="league-posts">
          <h3>League Activity Feed</h3>
          <p>A feed showing only posts from this league's members is coming soon!</p>
        </div>
        <div className="league-members-sidebar">
          <h3>Members ({members.length})</h3>
          <ul className="member-list">
            {members.map(member => (
              <li key={member.profiles.id}>
                <div className="member-info">
                  <Avatar url={member.profiles.avatar_url} size={30} />
                  <span>{member.profiles.username}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}