// src/pages/Profile.jsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import Avatar from '../components/Avatar';
import { toast } from 'react-hot-toast';

const getLeagueLevel = (xp = 0) => { if (xp <= 1500000) return { name: 'Orange - Rookie', color: '#ff8c00' }; if (xp <= 3000000) return { name: 'Blue - Intermediate', color: '#007bff' }; if (xp <= 7000000) return { name: 'White - Professional', color: 'black' }; if (xp <= 14500000) return { name: 'Silver - Legend', color: '#8d99ae' }; return { name: 'Gold - Master', color: '#ffd700' }; };
const getUserLevel = (marks = 0) => { if (marks <= 1000) return { name: 'Rookie', color: '#6c757d' }; if (marks <= 3500) return { name: 'Intermediate', color: '#007bff' }; if (marks <= 8000) return { name: 'Pro', color: 'black' }; if (marks <= 21500) return { name: 'Legend', color: '#8d99ae' }; return { name: 'Master', color: '#ffd700' }; };

export default function Profile({ session, profile, league, onUpdate }) {
  const [editingUsername, setEditingUsername] = useState(false);
  const [username, setUsername] = useState(profile?.username);
  const [uploading, setUploading] = useState(false);
  const [userRank, setUserRank] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => { setUsername(profile?.username); }, [profile]);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) return;
      const { data: rankData, error: rankError } = await supabase.rpc('get_user_rank', { user_id_arg: session.user.id });
      if (rankError) console.error("Error fetching user rank:", rankError);
      else setUserRank(rankData);

      const { data: requests, error: requestsError } = await supabase.rpc('get_pending_requests_for_commissioner');
      if (requestsError) console.error("Error fetching pending requests:", requestsError);
      else setPendingRequests(requests);
    };
    fetchData();
  }, [session, profile, league]);
  
  const handleRequest = async (memberRowId, status) => {
    const { error } = await supabase.rpc('manage_join_request', { member_row_id: memberRowId, new_status: status });
    if (error) { toast.error(error.message); } 
    else { 
      toast.success(`Request ${status}.`);
      setPendingRequests(pendingRequests.filter(req => req.id !== memberRowId));
    }
  };
  
  const handleUpload = async (event) => { /* ... unchanged ... */ };
  const handleProfileUpdate = async (e) => { /* ... unchanged ... */ };
  
  return (
    <div className="profile-container">
      <div className="profile-card">
        <div style={{position: 'relative', marginBottom: '10px'}}>
          <Avatar url={profile?.avatar_url} size={150} />
          <button className="edit-icon-btn" style={{position: 'absolute', bottom: 5, right: 5}} onClick={() => fileInputRef.current.click()}>✏️</button>
          <input type="file" ref={fileInputRef} id="avatar-upload" accept="image/*" onChange={handleUpload} disabled={uploading} style={{ display: 'none' }} />
        </div>
        
        {editingUsername ? (
          <form onSubmit={handleProfileUpdate} className="username-edit-form">
            <input type="text" className="auth-input" value={username || ''} onChange={(e) => setUsername(e.target.value)} />
            <button type="submit" className="nav-button">Save</button>
          </form>
        ) : (
          <div className="username-display">
            <h2>{profile?.username}</h2>
            <button className="edit-icon-btn" onClick={() => setEditingUsername(true)}>✏️</button>
          </div>
        )}
      </div>

      <div className="profile-card" style={{marginTop: '30px', textAlign: 'left'}}>
        <h2>Stats</h2>
        <ul className="profile-stats">
          <li><span>User Rank:</span> <strong>#{userRank || '...'}</strong></li>
          <li><span>User Level:</span> <strong style={{color: getUserLevel(profile?.hash_marks || 0).color}}>{getUserLevel(profile?.hash_marks || 0).name}</strong></li>
          <li><span>Hash Marks:</span> <strong>{(profile?.hash_marks || 0).toLocaleString()}</strong></li>
          <li><span>Active League:</span> <strong>{league?.name || 'N/A'}</strong></li>
          <li><span>League Level:</span> <strong style={{color: getLeagueLevel(league?.total_xp || 0).color}}>{getLeagueLevel(league?.total_xp || 0).name}</strong></li>
          <li><span>League XP:</span> <strong>{(league?.total_xp || 0).toLocaleString()}</strong></li>
        </ul>
      </div>

      {pendingRequests && pendingRequests.length > 0 && (
        <div className="commissioner-tools profile-card" style={{marginTop: '30px'}}>
          <h3>Pending Join Requests</h3>
          <ul className="member-list">
            {pendingRequests.map(req => (
              <li key={req.id}>
                <div className="member-info">
                  <Avatar url={req.profile_avatar_url} size={30} />
                  <span><strong>{req.profile_username}</strong> wants to join <strong>{req.league_name}</strong></span>
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
    </div>
  );
}