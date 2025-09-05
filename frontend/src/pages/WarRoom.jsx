// src/pages/WarRoom.jsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import DailyTasks from '../components/DailyTasks';
import Avatar from '../components/Avatar';
import { toast } from 'react-hot-toast';

export default function WarRoom({ session, profile }) {
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [editingPost, setEditingPost] = useState(null);
  const [userReactions, setUserReactions] = useState({});
  const [animatingReaction, setAnimatingReaction] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const mediaInputRef = useRef(null);

  const fetchPostsAndReactions = async () => { const { data: postsData, error: postsError } = await supabase.from('posts_with_reactions').select('*').order('created_at', { ascending: false }); if (postsError) { console.error('Error fetching posts:', postsError); } else { setPosts(postsData); } const postIds = postsData?.map(p => p.id) || []; if (postIds.length > 0) { const { data: reactionsData, error: reactionsError } = await supabase.from('post_reactions').select('post_id, reaction_type').eq('profile_id', session.user.id).in('post_id', postIds); if (reactionsError) { console.error('Error fetching user reactions:', reactionsError); } else { const reactionsMap = reactionsData.reduce((acc, reaction) => { acc[reaction.post_id] = reaction.reaction_type; return acc; }, {}); setUserReactions(reactionsMap); } } };
  useEffect(() => { if(session.user.id) { fetchPostsAndReactions(); try { const channel = supabase.channel('public-data-war-room-v2').on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, fetchPostsAndReactions).on('postgres_changes', { event: '*', schema: 'public', table: 'post_reactions' }, fetchPostsAndReactions).on('postgres_changes', {event: '*', schema: 'public', table: 'crash_clicks'}, fetchPostsAndReactions).subscribe(); return () => { supabase.removeChannel(channel); }; } catch (error) { console.error("Failed to subscribe to War Room updates:", error) } } }, [session.user.id]);
  
  const handlePostSubmit = async (e) => { e.preventDefault(); if (!newPostContent.trim() && !mediaFile) return; setUploading(true); let mediaUrl = null; if (mediaFile) { const fileExt = mediaFile.name.split('.').pop(); const fileName = `${Date.now()}.${fileExt}`; const filePath = `${session.user.id}/${fileName}`; const { error: uploadError } = await supabase.storage.from('post-media').upload(filePath, mediaFile); if (uploadError) { toast.error(uploadError.message); setUploading(false); return; } mediaUrl = filePath; } const { error: insertError } = await supabase.from('posts').insert({ content: newPostContent, profile_id: session.user.id, media_url: mediaUrl }); if (insertError) { toast.error(insertError.message); } else { setNewPostContent(''); setMediaFile(null); if (mediaInputRef.current) mediaInputRef.current.value = null; toast.success('Post created!'); fetchPostsAndReactions(); } setUploading(false); };
  const handleReaction = async (postId, reactionType) => { setAnimatingReaction({ postId, type: reactionType }); setTimeout(() => setAnimatingReaction(null), 300); if (reactionType === 'crash') { const { error } = await supabase.rpc('increment_crash_count', { post_id_arg: postId }); if (error) toast.error(error.message); else fetchPostsAndReactions(); } else { const { error } = await supabase.rpc('handle_reaction', { post_id_arg: postId, reaction_type_arg: reactionType }); if (error) toast.error(error.message); else fetchPostsAndReactions(); } };
  const handleDeletePost = async (postId) => { if (window.confirm('Are you sure you want to delete this post?')) { const { error } = await supabase.from('posts').delete().eq('id', postId); if (error) { toast.error(error.message); } else { toast.success('Post deleted.'); fetchPostsAndReactions(); } } };
  const handleUpdatePost = async (e) => { e.preventDefault(); const { id, content } = editingPost; const { error } = await supabase.from('posts').update({ content: content }).eq('id', id); if (error) { toast.error(error.message); } else { toast.success('Post updated!'); fetchPostsAndReactions(); } setEditingPost(null); };
  
  const getMediaType = (url) => { if (!url) return null; const extension = url.split('.').pop().toLowerCase(); if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(extension)) return 'image'; if (['mp4', 'webm', 'ogg'].includes(extension)) return 'video'; return null; }

  return (
    <div className="war-room-layout">
      <div className="main-feed">
        <div className="post-form-container">
          <form onSubmit={handlePostSubmit} className="post-form">
            <div className="post-form-input-wrapper">
              <Avatar url={profile?.avatar_url} size={40} />
              <textarea placeholder={`What's on your mind, ${profile?.username}?`} value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} />
            </div>
            {mediaFile && <div className="media-preview">Selected: {mediaFile.name}</div>}
            <div className="post-form-actions">
              <button type="button" className="media-btn" onClick={() => mediaInputRef.current.click()}>🖼️</button>
              <input type="file" ref={mediaInputRef} onChange={(e) => setMediaFile(e.target.files[0])} style={{ display: 'none' }} accept="image/*,video/*" />
              <button type="submit" className="nav-button signup" disabled={uploading}>{uploading ? 'Posting...' : 'Post'}</button>
            </div>
          </form>
        </div>
        <div className="feed">
          {posts.map(post => {
            const mediaType = getMediaType(post.media_url);
            const mediaPublicUrl = post.media_url ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/post-media/${post.media_url}` : null;
            return (
              <article key={post.id} className="post-v2">
                <div className="post-v2-avatar-container"> <Avatar url={post.avatar_url} size={40} /> </div>
                <div className="post-v2-main-content">
                  <div className="post-v2-header">
                    <span className="post-v2-author">{post.username || 'Loading...'}</span>
                    <span className="post-v2-timestamp">{new Date(post.created_at).toLocaleString()}</span>
                  </div>
                  {editingPost?.id === post.id ? ( <form onSubmit={handleUpdatePost} className="edit-form"> <textarea value={editingPost.content} onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })} /> <div className="edit-actions"> <button type="button" onClick={() => setEditingPost(null)}>Cancel</button> <button type="submit">Save</button> </div> </form> ) : ( <p className="post-v2-content">{post.content}</p> )}
                  {mediaPublicUrl && ( <div className="post-media-container"> {mediaType === 'image' && <img src={mediaPublicUrl} alt="Post media"/>} {mediaType === 'video' && <video controls src={mediaPublicUrl} />} </div> )}
                  <div className="post-v2-footer">
                    <div className="post-reactions-v2">
                      {['love', 'laugh', 'football', 'crash'].map(reaction => {
                        const emojis = { love: '❤️', laugh: '😂', football: '🏈', crash: '💥' };
                        const isActive = userReactions[post.id] === reaction;
                        const isAnimating = animatingReaction?.postId === post.id && animatingReaction?.type === reaction;
                        const crashClass = reaction === 'crash' ? 'crash-reaction' : '';
                        const crashHighlightStyle = reaction === 'crash' && post.crash_click_count > 0 ? { filter: `saturate(${100 + post.crash_click_count * 10}%) brightness(${100 + post.crash_click_count * 2}%)`} : {};
                        return ( <button key={reaction} onClick={() => handleReaction(post.id, reaction)} className={`reaction-v2 ${isActive && reaction !== 'crash' ? 'active' : ''} ${isAnimating ? 'animating' : ''} ${crashClass}`}> <span className="reaction-emoji" style={crashHighlightStyle}>{emojis[reaction]}</span> {reaction === 'crash' && post.crash_click_count > 0 && <span className="reaction-count">{post.crash_click_count}</span>} </button> );
                      })}
                    </div>
                    {session.user.id === post.profile_id && ( <div className="post-actions"> <button onClick={() => setEditingPost({ id: post.id, content: post.content })} className="action-btn">Edit</button> <button onClick={() => handleDeletePost(post.id)} className="action-btn delete">Delete</button> </div> )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
      <aside className="sidebar"> <DailyTasks /> </aside>
    </div>
  );
}