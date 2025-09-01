// src/pages/WarRoom.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import DailyTasks from '../components/DailyTasks';

export default function WarRoom({ session, profile }) {
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      const { data: postsData, error } = await supabase
        .from('posts_with_reactions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) console.error('Error fetching posts:', error);
      else setPosts(postsData);
    };
    fetchPosts();

    const postSubscription = supabase
      .channel('public-data-war-room')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, fetchPosts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_reactions' }, fetchPosts)
      .subscribe();
    
    return () => {
      supabase.removeChannel(postSubscription);
    };
  }, []);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    const { error } = await supabase.from('posts').insert({ content: newPostContent, profile_id: session.user.id });
    if (error) alert(error.message);
    else setNewPostContent('');
  };

  const handleReaction = async (postId, reactionType) => {
    const { error } = await supabase.from('post_reactions').insert({ post_id: postId, profile_id: session.user.id, reaction_type: reactionType });
    if (error && !error.message.includes('duplicate key')) alert(error.message);
  };

  return (
    <div className="war-room-layout">
      <div className="main-feed">
        <h2>The War Room</h2>
        <form onSubmit={handlePostSubmit} className="post-form">
          <textarea
            placeholder={`What's on your mind, ${profile?.username}?`}
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
          />
          <button type="submit">Post</button>
        </form>
        <div className="feed">
          {posts.map(post => (
            <div key={post.id} className="post">
              <p className="post-author">{post.username || 'Loading...'}</p>
              <p className="post-content">{post.content}</p>
              <div className="post-footer">
                <div className="reactions">
                  <button onClick={() => handleReaction(post.id, 'love')} className="reaction-btn">❤️ {post.love_count}</button>
                  <button onClick={() => handleReaction(post.id, 'laugh')} className="reaction-btn">😂 {post.laugh_count}</button>
                  <button onClick={() => handleReaction(post.id, 'football')} className="reaction-btn">🏈 {post.football_count}</button>
                  <button onClick={() => handleReaction(post.id, 'crash')} className="reaction-btn">💥 {post.crash_count}</button>
                </div>
                <p className="post-timestamp">{new Date(post.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <aside className="sidebar">
        <DailyTasks />
      </aside>
    </div>
  );
}