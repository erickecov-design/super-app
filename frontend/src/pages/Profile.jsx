// src/pages/Profile.jsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import Avatar from '../components/Avatar';
import { toast } from 'react-hot-toast'; // Import toast

export default function Profile({ session, profile, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url);

  const handleUpload = async (event) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: filePath }).eq('id', session.user.id);
      if (updateError) throw updateError;
      
      setAvatarUrl(filePath);
      onUpdate();
      toast.success('Profile updated!'); // Replaced alert

    } catch (error) {
      toast.error(error.message); // Replaced alert
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="profile-container">
      <h2>Your Profile</h2>
      <div className="profile-card">
        <Avatar url={avatarUrl} size={150} />
        <h3>{profile?.username}</h3>
        <div className="upload-form">
          <label htmlFor="avatar-upload" className="nav-button">
            {uploading ? 'Uploading...' : 'Upload Avatar'}
          </label>
          <input type="file" id="avatar-upload" accept="image/*" onChange={handleUpload} disabled={uploading} style={{ display: 'none' }} />
        </div>
      </div>
    </div>
  );
}