// src/pages/WarRoom.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import DailyTasks from '../components/DailyTasks';
import Avatar from '../components/Avatar';
import { toast } from 'react-hot-toast';

export default function WarRoom({ session, profile }) {
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [editingPost, setEditingPost] = useState(null);
  
  // New state to track the current user's reactions
  const [userReactions, setUserReactions] = useState({}); // e.g., { postId: 'love', anotherPostId: 'football' }

  const fetchPostsAndReactions = async () => {
    // Fetch posts
    const { data: postsData, error: postsError } = await supabase
      .from('posts_with_reactions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (postsError) {
      console.error('Error fetching posts:', postsError);
    } else {
      setPosts(postsData);
    }

    // Fetch the current user's reactions for the posts that are visible
    const postIds = postsData?.map(p => p.id) || [];
    if (postIds.length > 0) {
      const { data: reactionsData, error: reactionsError } = await supabase
        .from('post_reactions')
        .select('post_id, reaction_type')
        .eq('profile_id', session.user.id)
        .in('post_id', postIds);

      if (reactionsError) {
        console.error('Error fetching user reactions:', reactionsError);
      } else {
        // Convert the array of reactions into a simple lookup object for easy access
        const reactionsMap = reactionsData.reduce((acc, reaction) => {
          acc[reaction.post_id] = reaction.reaction_type;
          return acc;
        }, {});
        setUserReactions(reactionsMap);
      }
    }
  };

  useEffect(() => {
    fetchPostsAndReactions();
    const channel = supabase.channel('public-data-war-room-v2').on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, fetchPostsAndReactions).on('postgres_changes', { event: '*', schema: 'public', table: 'post_reactions' }, fetchPostsAndReactions).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session.user.id]);

  const handlePostSubmit = async (e) => { e.preventDefault(); if (!newPostContent.trim()) return; const { error } = await supabase.from('posts').insert({ content: newPostContent, profile_id: session.user.id }); if (error) toast.error(error.message); else { setNewPostContent(''); toast.success('Post created!'); } };

  // Updated reaction handler to call our new database function
  const handleReaction = async (postId, reactionType) => {
    const { error } = await supabase.rpc('handle_reaction', {
      post_id_arg: postId,
      reaction_type_arg: reactionType
    });
    
    if (error) {
      toast.error(error.message);
    }
    // We don't need to award points here; the frontend will just refetch
    // and the Daily Tasks triggers will handle any new reaction inserts automatically.
  };

  const handleDeletePost = async (postId) => { if (window.confirm('Are you sure you want to delete this post?')) { const { error } = await supabase.from('posts').delete().eq('id', postId); if (error) { toast.error(error.message); } else { toast.success('Post deleted.'); } } };
  const handleUpdatePost = async (e) => { e.preventDefault(); const { id, content } = editingPost; const { error } = await supabase.from('posts').update({ content: content }).eq('id', id); if (error) { toast.error(error.message); } else { toast.success('Post updated!'); } setEditingPost(null); };

  return (
    <div className="war-room-layout">
      <div className="main-feed">
        <h2>The War Room</h2>
        <form onSubmit={handlePostSubmit} className="post-form"> <textarea placeholder={`What's on your mind, ${profile?.username}?`} value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} /> <button type="submit">Post</button> </form>
        <div className="feed">
          {posts.map(post => (
            <div key={post.id} className="post">
              <div className="post-header">
                <div className="post-author">
                  <Avatar url={post.avatar_url} size={40} />
                  <span>{post.username || 'Loading...'}</span>
                </div>
                {session.user.id === post.profile_id && ( <div className="post-actions"> <button onClick={() => setEditingPost({ id: post.id, content: post.content })} className="action-btn">Edit</button> <button onClick={() => handleDeletePost(post.id)} className="action-btn delete">Delete</button> </div> )}
              </div>
              {editingPost?.id === post.id ? ( <form onSubmit={handleUpdatePost} className="edit-form"> <textarea value={editingPost.content} onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })} /> <div className="edit-actions"> <button type="button" onClick={() => setEditingPost(null)}>Cancel</button> <button type="submit">Save</button> </div> </form> ) : ( <p className="post-content">{post.content}</p> )}
              <div className="post-footer">
                <div className="reactions">
                  {['love', 'laugh', 'football', 'crash'].map(reaction => {
                    const emojis = { love: '❤️', laugh: '😂', football: '🏈', crash: '💥' };
                    const isActive = userReactions[post.id] === reaction;
                    return (
                      <button 
                        key={reaction}
                        onClick={() => handleReaction(post.id, reaction)} 
                        className={`reaction-btn ${isActive ? 'active' : ''}`}
                      >
                        {emojis[reaction]} {post[`${reaction}_count`]}
                      </button>
                    );
                  })}
                </div>
                <p className="post-timestamp">{new Date(post.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <aside className="sidebar"> <DailyTasks /> </aside>
    </div>
  );
}