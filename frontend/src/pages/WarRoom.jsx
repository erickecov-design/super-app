// src/pages/WarRoom.jsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import DailyTasks from '../components/DailyTasks';
import Avatar from '../components/Avatar';
import { toast } from 'react-hot-toast';

const getMediaType = (url) => { if (!url) return null; const extension = url.split('.').pop().toLowerCase(); if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(extension)) return 'image'; if (['mp4', 'webm', 'ogg'].includes(extension)) return 'video'; return null; }

export default function WarRoom({ session, profile }) {
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [userReactions, setUserReactions] = useState({});
  const [animatingReaction, setAnimatingReaction] = useState(null);
  const mediaInputRef = useRef(null);

  const fetchPostsAndReactions = async () => { const { data: postsData, error: postsError } = await supabase.from('posts_with_reactions').select('*').order('created_at', { ascending: false }); if (postsError) { console.error('Error fetching posts:', postsError); } else { setPosts(postsData); } const postIds = postsData?.map(p => p.id) || []; if (postIds.length > 0) { const { data: reactionsData, error: reactionsError } = await supabase.from('post_reactions').select('post_id, reaction_type').eq('profile_id', session.user.id).in('post_id', postIds); if (reactionsError) { console.error('Error fetching user reactions:', reactionsError); } else { const reactionsMap = reactionsData.reduce((acc, reaction) => { acc[reaction.post_id] = reaction.reaction_type; return acc; }, {}); setUserReactions(reactionsMap); } } };
  useEffect(() => { if(session.user.id) { fetchPostsAndReactions(); try { const channel = supabase.channel('public-data-war-room-v3').on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, fetchPostsAndReactions).on('postgres_changes', { event: '*', schema: 'public', table: 'post_reactions' }, fetchPostsAndReactions).on('postgres_changes', {event: '*', schema: 'public', table: 'crash_clicks'}, fetchPostsAndReactions).subscribe(); return () => { supabase.removeChannel(channel); }; } catch (error) { console.error("Failed to subscribe to War Room updates:", error) } } }, [session.user.id]);
  
  const handlePostSubmit = async (e) => { e.preventDefault(); if (!newPostContent.trim() && !mediaFile) return; setUploading(true); let mediaUrl = null; if (mediaFile) { const fileExt = mediaFile.name.split('.').pop(); const fileName = `${Date.now()}.${fileExt}`; const filePath = `${session.user.id}/${fileName}`; const { error: uploadError } = await supabase.storage.from('post-media').upload(filePath, mediaFile); if (uploadError) { toast.error(uploadError.message); setUploading(false); return; } mediaUrl = filePath; } const { error: insertError } = await supabase.from('posts').insert({ content: newPostContent, profile_id: session.user.id, media_url: mediaUrl }); if (insertError) { toast.error(insertError.message); } else { setNewPostContent(''); setMediaFile(null); if (mediaInputRef.current) mediaInputRef.current.value = null; toast.success('Post created!'); fetchPostsAndReactions(); } setUploading(false); };
  const handleReaction = async (postId, reactionType) => { setAnimatingReaction({ postId, type: reactionType }); setTimeout(() => setAnimatingReaction(null), 300); if (reactionType === 'crash') { const { error } = await supabase.rpc('increment_crash_count', { post_id_arg: postId }); if (error) toast.error(error.message); else fetchPostsAndReactions(); } else { const { error } = await supabase.rpc('handle_reaction', { post_id_arg: postId, reaction_type_arg: reactionType }); if (error) toast.error(error.message); else fetchPostsAndReactions(); } };
  const handleDeletePost = async (postId) => { if (window.confirm('Are you sure you want to delete this post?')) { const { error } = await supabase.from('posts').delete().eq('id', postId); if (error) { toast.error(error.message); } else { toast.success('Post deleted.'); fetchPostsAndReactions(); } } };
  const handleUpdatePost = async (e) => { e.preventDefault(); const { id, content } = editingPost; const { error } = await supabase.from('posts').update({ content: content }).eq('id', id); if (error) { toast.error(error.message); } else { toast.success('Post updated!'); fetchPostsAndReactions(); } setEditingPost(null); };

  return (
    <div className="war-room-layout-v2">
      <div className="war-room-sidebar-left">
        {/* Placeholder for future components */}
      </div>
      <div className="main-feed">
        <div className="post-form-container">
          <form onSubmit={handlePostSubmit} className="post-form">
            <div className="post-form-input-wrapper">
              <Avatar url={profile?.avatar_url} size={40} />
              <textarea placeholder={`What's on your mind, ${profile?.username}?`} value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} />
            </div>
            {mediaFile && <div className="media-preview">Selected: {mediaFile.name}</div>}
            <div className="post-form-actions">
              <button type="button" className="media-btn" onClick={() => mediaInputRef.current.click()}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.08 7.33333C14.08 4.94167 12.14 3 9.75 3C7.36 3 5.42 4.94167 5.42 7.33333C5.42 9.725 7.36 11.6667 9.75 11.6667C10.5475 11.6667 11.2858 11.4558 11.9125 11.0858L12.5833 11.7567V13.8333C12.5833 14.5825 12.9233 15.2575 13.4817 15.6942L16.2917 18.0608C17.1358 18.7833 18.4167 18.1575 18.4167 17.0608V7.33333C18.4167 6.07333 17.65 5 16.5 5C15.2283 5 14.08 6.04167 14.08 7.33333Z" stroke="#65676b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M9.75 21C7.36 21 5.42 19.0583 5.42 16.6667C5.42 14.275 7.36 12.3333 9.75 12.3333C12.14 12.3333 14.08 14.275 14.08 16.6667" stroke="#65676b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <input type="file" ref={mediaInputRef} onChange={(e) => setMediaFile(e.target.files[0])} style={{ display: 'none' }} accept="image/*,video/*" />
              <button type="submit" className="nav-button post-btn" disabled={uploading}>{uploading ? 'Posting...' : 'Post'}</button>
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
                    <div className="post-footer-right">
                      <div className="post-reactions-v2">
                        {['love', 'laugh', 'football', 'crash'].map(reaction => {
                          const emojis = { love: '❤️', laugh: '😂', football: '🏈', crash: '💥' };
                          const isActive = userReactions[post.id] === reaction;
                          const isAnimating = animatingReaction?.postId === post.id && animatingReaction?.type === reaction;
                          const crashClass = reaction === 'crash' ? 'crash-reaction' : '';
                          const hasCrashClicks = reaction === 'crash' && post.crash_click_count > 0;
                          return (
                            <button key={reaction} onClick={() => handleReaction(post.id, reaction)} className={`reaction-v2 ${isActive && reaction !== 'crash' ? 'active' : ''} ${isAnimating ? 'animating' : ''} ${crashClass} ${hasCrashClicks ? 'has-clicks' : ''}`}>
                              <span className="reaction-emoji">{emojis[reaction]}</span>
                              {reaction === 'crash' && post.crash_click_count > 0 && <span className="reaction-count">{post.crash_click_count}</span>}
                            </button>
                          );
                        })}
                      </div>
                      {session.user.id === post.profile_id && (
                        <div className="post-actions-v2">
                          <button onClick={() => setEditingPost({ id: post.id, content: post.content })} className="action-btn">Edit</button>
                          <button onClick={() => handleDeletePost(post.id)} className="action-btn delete">Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
      <aside className="war-room-sidebar-right"> <DailyTasks /> </aside>
    </div>
  );
}