// src/components/Avatar.jsx
import React from 'react';

export default function Avatar({ url, size = 40 }) {
  const avatarSrc = url ? 
    `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${url}` : 
    'default-avatar.png'; // A placeholder in your /public folder

  return (
    <img
      src={avatarSrc}
      alt="User avatar"
      className="avatar-image"
      style={{ height: size, width: size }}
    />
  );
}