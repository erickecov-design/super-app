// src/pages/Profile.jsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import Avatar from '../components/Avatar';
import { toast } from 'react-hot-toast';

// Helper functions moved here to be self-contained
const getLeagueLevel = (xp = 0) => { if (xp <= 1500000) return { name: 'Orange - Rookie', color: '#ff8c00' }; if (xp <= 3000000) return { name: 'Blue - Intermediate', color: '#007bff' }; if (xp <= 7000000) return { name: 'White - Professional', color: 'black' }; if (xp <= 14500000) return { name: 'Silver - Legend', color: '#8d99ae' }; return { name: 'Gold - Master', color: '#ffd700' }; };
const getUserLevel = (marks = 0) => { if (marks <= 1000) return { name: 'Rookie', color: '#6c757d' }; if (marks <= 3500) return { name: 'Intermediate', color: '#007bff' }; if (marks <= 8000) return { name: 'Pro', color: 'black' }; if (marks <= 21500) return { name: 'Legend', color: '#8d99ae' }; return { name: 'Master', color: '#ffd700' }; };

export default function Profile({ session, profile, league, onUpdate }) {
  const [editingUsername, setEditingUsername] = useState(false);
  const [username, setUsername] = useState(profile?.username);
  const [uploading, setUploading] = useState(false);
  const [userRank, setUserRank] = useState(null);
  const fileInputRef = useRef(null);
  const [inviteCode, setInviteCode] = useState('');
  const [newLeagueName, setNewLeagueName] = useState('');

  useEffect(() => { setUsername(profile?.username); }, [profile]);

  useEffect(() => {
    const fetchRank = async () => {
      if (session?.user?.id) {
        const { data, error } = await supabase.rpc('get_user_rank', { user_id_arg: session.user.id });
        if (error) console.error("Error fetching user rank:", error);
        else setUserRank(data);
      }
    };
    fetchRank();
  }, [session]);
  
  const handleUpload = async (event) => {
    try {
      if (!event.target.files || event.target.files.length === 0) { throw new Error('You must select an image to upload.'); }
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;
      
      setUploading(true);
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: filePath }).eq('id', session.user.id);
      if (updateError) throw updateError;
      
      toast.success('Profile updated!');
      onUpdate();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };
  
  const handleProfileUpdate = async (e) => { e.preventDefault(); try { const { error } = await supabase.from('profiles').update({ username: username }).eq('id', session.user.id); if (error) throw error; toast.success('Username updated!'); onUpdate(); setEditingUsername(false); } catch (error) { toast.error(error.message); } };

  const handleCreateLeague = async (e) => { e.preventDefault(); if (!newLeagueName.trim()) return; const { data: newLeague, error: leagueError } = await supabase.from('leagues').insert({ name: newLeagueName, commissioner_id: session.user.id }).select().single(); if (leagueError) return toast.error(leagueError.message); const { error: memberError } = await supabase.from('league_members').insert({ profile_id: session.user.id, league_id: newLeague.id }); if (memberError) return toast.error(memberError.message); const { error: profileError } = await supabase.from('profiles').update({ active_league_id: newLeague.id }).eq('id', session.user.id); if (profileError) return toast.error(profileError.message); toast.success(`League '${newLeagueName}' created!`); onUpdate(); };
  const handleJoinLeague = async (e) => { e.preventDefault(); if (!inviteCode.trim()) return; const { error } = await supabase.rpc('join_league_with_code', { invite_code_arg: inviteCode.trim() }); if (error) { toast.error(error.message); } else { toast.success("Successfully joined league!"); onUpdate(); } };
  
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
      
      <div className="profile-card" style={{marginTop: '30px'}}>
        <h2>League Management</h2>
        <form onSubmit={handleJoinLeague} className="post-form">
          <p>Have an invite code? Join another league.</p>
          <input type="text" className="auth-input" placeholder="Enter Invite Code" value={inviteCode} onChange={e => setInviteCode(e.target.value)} />
          <button type="submit" className="nav-button">Join League</button>
        </form>
        <hr style={{width: '100%', margin: '20px 0', borderTop: '1px solid var(--color-border)'}} />
        <form onSubmit={handleCreateLeague} className="post-form">
          <p>Or, create a new league where you are the commissioner.</p>
          <input type="text" className="auth-input" placeholder="New League Name" value={newLeagueName} onChange={e => setNewLeagueName(e.target.value)} />
          <button type="submit" className="nav-button signup">Create New League</button>
        </form>
      </div>
    </div>
  );
}