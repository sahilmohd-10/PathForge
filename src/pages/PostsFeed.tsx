import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Heart, MessageCircle, UserPlus, UserCheck, Image, Video,
  Send, MoreHorizontal, X, Play, ChevronDown, ChevronUp, Loader2, Globe, Trash2,
  TrendingUp, Users, Newspaper
} from 'lucide-react';
import PageShell from '../components/PageShell';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Post {
  id: number;
  user_id: number;
  content: string | null;
  media_url: string | null;
  media_type: 'image' | 'video' | 'none';
  created_at: string;
  full_name: string;
  role: string;
  avatar_url: string | null;
  like_count: number;
  comment_count: number;
  follower_count: number;
  isLiked: boolean;
  isFollowing: boolean;
}

interface Comment {
  id: number;
  user_id: number;
  content: string;
  created_at: string;
  full_name: string;
  role: string;
}

interface UserProfile {
  id: number;
  full_name: string;
  role: string;
  avatar_url: string | null;
  banner_url: string | null;
  followersCount: number;
  followingCount: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
export function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 5) return 'Just now';
  if (s < 0) return 'Recently';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function initials(name: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function avatarColor(name: string) {
  const colors = [
    'from-blue-500 to-blue-600',
    'from-indigo-500 to-indigo-600',
    'from-sky-500 to-sky-600',
    'from-slate-500 to-slate-600',
    'from-blue-600 to-indigo-600'
  ];
  let hash = 0;
  for (let c of name || '') hash = c.charCodeAt(0) + hash;
  return colors[hash % colors.length];
}

export function roleBadge(role: string) {
  if (role === 'recruiter')
    return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">Recruiter</span>;
  if (role === 'student')
    return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">Student</span>;
  return null;
}

// ─── CreatePost Component ────────────────────────────────────────────────────
function CreatePost({ currentUser, onPosted }: { currentUser: any; onPosted: (post: Post) => void }) {
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setMediaType(f.type.startsWith('video/') ? 'video' : 'image');
    setPreview(URL.createObjectURL(f));
    setError(null);
  };

  const removeMedia = () => {
    setFile(null);
    setPreview(null);
    setMediaType(null);
  };

  const submit = async () => {
    if (!content.trim() && !file) return;
    if (!currentUser?.id) { setError('You must be logged in to post.'); return; }
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('userId', String(currentUser.id));
      if (content.trim()) fd.append('content', content.trim());
      if (file) fd.append('media', file);

      const res = await fetch('/api/social/posts', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to post');
      onPosted(json);
      setContent('');
      removeMedia();
    } catch (e: any) {
      console.error('Post error:', e);
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 mb-4">
      <div className="flex gap-3">
        {currentUser?.avatar_url ? (
          <img src={currentUser.avatar_url} alt="avatar" className="w-12 h-12 rounded-2xl object-cover shadow-lg flex-shrink-0 border-2 border-white dark:border-neon-teal/30" />
        ) : (
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${avatarColor(currentUser?.fullName || '')} flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg border-2 border-white dark:border-neon-teal/30 z-10`}>
            {initials(currentUser?.fullName || '')}
          </div>
        )}
        <div className="flex-1">
          <textarea
            className="input-base min-h-[100px] resize-none pb-10"
            placeholder="Share something with the professional community…"
            value={content}
            onChange={e => setContent(e.target.value)}
          />

          {preview && (
            <div className="relative mt-3 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
              {mediaType === 'video'
                ? <video src={preview} className="w-full max-h-64 object-cover" controls />
                : <img src={preview} alt="preview" className="w-full max-h-64 object-cover" />
              }
              <button
                onClick={removeMedia}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-2">
              <button
                onClick={() => imageRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-primary-600 dark:text-neon-cyan hover:bg-primary-50 dark:hover:bg-neon-teal/10 rounded-xl transition-all duration-300"
              >
                <Image size={18} /> Photo
              </button>
              <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <button
                onClick={() => videoRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/10 rounded-xl transition-all duration-300"
              >
                <Video size={18} /> Video
              </button>
              <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>
            <button
              onClick={submit}
              disabled={loading || (!content.trim() && !file)}
              className="btn-primary flex items-center gap-2 px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
              {loading ? 'Posting…' : 'Post Update'}
            </button>
          </div>
          {error && (
            <div className="mt-2 text-xs text-rose-500 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700 rounded-lg px-3 py-2">
              ⚠️ {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PostCard Component ──────────────────────────────────────────────────────
export function PostCard({ post: initialPost, currentUser, onDelete }: { post: Post; currentUser: any; onDelete: (postId: number) => void }) {
  const [post, setPost] = useState(initialPost);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [likePending, setLikePending] = useState(false);
  const [followPending, setFollowPending] = useState(false);

  const toggleLike = async () => {
    if (likePending) return;
    setLikePending(true);
    const wasLiked = post.isLiked;
    // Optimistic update
    setPost(p => ({ 
      ...p, 
      isLiked: !p.isLiked, 
      like_count: Math.max(0, p.like_count + (wasLiked ? -1 : 1)) 
    }));
    
    try {
      const res = await fetch(`/api/social/posts/${post.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id })
      });
      if (!res.ok) throw new Error();
    } catch {
      // Revert on error
      setPost(p => ({ 
        ...p, 
        isLiked: wasLiked, 
        like_count: p.like_count + (wasLiked ? 1 : -1) 
      }));
    } finally {
      setLikePending(false);
    }
  };

  const toggleFollow = async () => {
    if (followPending || post.user_id === currentUser?.id) return;
    setFollowPending(true);
    const wasFollowing = post.isFollowing;
    setPost(p => ({ ...p, isFollowing: !p.isFollowing }));
    try {
      await fetch('/api/social/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: currentUser?.id, followingId: post.user_id })
      });
    } catch {}
    setFollowPending(false);
  };

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/social/posts/${post.id}/comments`);
      setComments(await res.json());
    } catch {}
    setLoadingComments(false);
  };

  const toggleComments = () => {
    const next = !showComments;
    setShowComments(next);
    if (next && comments.length === 0) loadComments();
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    try {
      const res = await fetch(`/api/social/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id, content: commentText.trim() })
      });
      const c = await res.json();
      setComments(prev => [...prev, c]);
      setPost(p => ({ ...p, comment_count: p.comment_count + 1 }));
      setCommentText('');
    } catch {}
  };

  const deletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await fetch(`/api/social/posts/${post.id}?userId=${currentUser.id}`, { method: 'DELETE' });
      if (res.ok) onDelete(post.id);
    } catch (e) { console.error(e); }
  };

  const deleteComment = async (commentId: number) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      const res = await fetch(`/api/social/comments/${commentId}?userId=${currentUser.id}`, { method: 'DELETE' });
      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId));
        setPost(p => ({ ...p, comment_count: p.comment_count - 1 }));
      }
    } catch (e) { console.error(e); }
  };

  const isOwnPost = post.user_id === currentUser?.id;

  return (
    <div className="card-base card-hover overflow-hidden mb-6 border border-gray-100 dark:border-neon-teal/20">
      <div className="flex items-start justify-between p-5 pb-3">
        <div className="flex items-center gap-3">
          <a href={`#user?id=${post.user_id}`} className="block transition hover:opacity-80">
            {post.avatar_url ? (
              <img src={post.avatar_url} alt="avatar" className="w-11 h-11 rounded-2xl object-cover shadow-md flex-shrink-0 border border-slate-200 dark:border-neon-teal/20" />
            ) : (
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${avatarColor(post.full_name)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md border border-white/20`}>
                {initials(post.full_name)}
              </div>
            )}
          </a>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <a href={`#user?id=${post.user_id}`} className="font-semibold text-gray-900 dark:text-white text-sm hover:text-primary-600 transition">
                {post.full_name}
              </a>
              {roleBadge(post.role)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
              <Globe size={11} className="text-primary-500 dark:text-neon-cyan" />
              <span>{timeAgo(post.created_at)}</span>
              <span className="mx-1">•</span>
              <span className="font-semibold text-primary-600 dark:text-neon-cyan">
                {(post.follower_count || 0).toLocaleString()} {post.follower_count === 1 ? 'follower' : 'followers'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOwnPost && (
            <button
              onClick={deletePost}
              className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition"
              title="Delete post"
            >
              <Trash2 size={16} />
            </button>
          )}
          {!isOwnPost && (
            <button
              onClick={toggleFollow}
              disabled={followPending}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                post.isFollowing
                  ? 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  : 'border-indigo-300 dark:border-cyan-500 text-indigo-600 dark:text-cyan-400 hover:bg-indigo-50 dark:hover:bg-gray-700'
              }`}
            >
              {post.isFollowing ? <UserCheck size={13} /> : <UserPlus size={13} />}
              {post.isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
      </div>

      {post.content && (
        <div className="px-5 pb-3 text-sm text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </div>
      )}

      {post.media_url && post.media_type === 'image' && (
        <div className="w-full bg-gray-50 dark:bg-gray-900">
          <img src={post.media_url} alt="post media" className="w-full object-cover max-h-[480px]" />
        </div>
      )}
      {post.media_url && post.media_type === 'video' && (
        <div className="w-full bg-black">
          <video src={post.media_url} className="w-full max-h-[480px] object-contain" controls />
        </div>
      )}

      <div className="px-5 py-2 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 border-t border-gray-50 dark:border-gray-700">
        <span className="flex items-center gap-1">
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-rose-500 text-white text-[9px]">♥</span>
          {post.like_count > 0 ? post.like_count : ''}
        </span>
        {post.comment_count > 0 && (
          <button onClick={toggleComments} className="hover:text-gray-600 dark:hover:text-gray-300 transition">
            {post.comment_count} comment{post.comment_count !== 1 ? 's' : ''}
          </button>
        )}
      </div>

      <div className="px-5 py-1 flex items-center gap-1 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl flex-1 justify-center transition hover:bg-gray-50 dark:hover:bg-gray-700 ${
            post.isLiked ? 'text-rose-500' : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <Heart size={17} fill={post.isLiked ? 'currentColor' : 'none'} />
          <span>Like</span>
        </button>

        <button
          onClick={toggleComments}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl flex-1 justify-center text-gray-500 dark:text-gray-400 transition hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <MessageCircle size={17} />
          <span>Comment</span>
        </button>
      </div>

      {showComments && (
        <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-3 px-5 py-3">
            {currentUser?.avatar_url ? (
              <img src={currentUser.avatar_url} alt="avatar" className="w-8 h-8 rounded-xl object-cover shadow flex-shrink-0" />
            ) : (
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${avatarColor(currentUser?.fullName || '')} flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0 shadow`}>
                {initials(currentUser?.fullName || '')}
              </div>
            )}
            <div className="flex-1 flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full px-4 py-2">
              <input
                type="text"
                placeholder="Write a comment…"
                className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitComment()}
              />
              <button onClick={submitComment} className="text-indigo-500 dark:text-cyan-400 hover:opacity-75 transition disabled:opacity-40" disabled={!commentText.trim()}>
                <Send size={15} />
              </button>
            </div>
          </div>

          <div className="px-5 pb-3 space-y-3">
            {loadingComments && (
              <div className="flex justify-center py-4">
                <Loader2 size={18} className="animate-spin text-gray-400" />
              </div>
            )}
            {comments.map(c => (
              <div key={c.id} className="flex gap-2.5">
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${avatarColor(c.full_name)} flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0 shadow`}>
                  {initials(c.full_name)}
                </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl px-4 py-2.5 max-w-[85%] relative group">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-100">{c.full_name}</span>
                    {roleBadge(c.role)}
                    <span className="text-xs text-gray-400">{timeAgo(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-200 pr-6">{c.content}</p>
                  
                  {c.user_id === currentUser?.id && (
                    <button
                      onClick={() => deleteComment(c.id)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition"
                      title="Delete comment"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main PostsFeed Page ─────────────────────────────────────────────────────
export default function PostsFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'following'>('all');
  const [followingView, setFollowingView] = useState<'posts' | 'following' | 'followers'>('posts');
  const [stats, setStats] = useState<UserProfile | null>(null);
  const [networkUsers, setNetworkUsers] = useState<any[]>([]);
  const [recentFollowers, setRecentFollowers] = useState<any[]>([]);

  const loadPosts = async (pg: number, tab?: 'all' | 'following') => {
    setLoading(true);
    const currentTab = tab || activeTab;
    try {
      const res = await fetch(`/api/social/feed?userId=${user?.id || ''}&page=${pg}&followingOnly=${currentTab === 'following'}`);
      const data: Post[] = await res.json();
      if (pg === 1) setPosts(data);
      else setPosts(prev => [...prev, ...data]);
      setHasMore(data.length === 10);
    } catch (e) {
      console.error('Feed load error:', e);
    }
    setLoading(false);
  };

  const loadStats = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/social/user/${user.id}`);
      setStats(await res.json());
    } catch {}
  };

  const loadNetwork = async (type: 'followers' | 'following') => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/social/${type}/${user.id}`);
      setNetworkUsers(await res.json());
    } catch {}
    setLoading(false);
  };

  const loadRecentFollowers = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/social/followers/${user.id}`);
      const data = await res.json();
      setRecentFollowers(data.slice(0, 5));
    } catch {}
  };

  useEffect(() => { 
    setPage(1);
    if (activeTab === 'following' && followingView === 'following') {
      loadNetwork('following');
    } else if (activeTab === 'following' && followingView === 'followers') {
      loadNetwork('followers');
    } else {
      loadPosts(1, activeTab); 
    }
    loadStats();
    loadRecentFollowers();
  }, [user?.id, activeTab, followingView]);

  const handlePosted = (post: Post) => {
    if (activeTab === 'all') {
      setPosts(prev => [post, ...prev]);
    }
    loadStats();
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    loadPosts(next);
  };

  return (
    <PageShell
      title={activeTab === 'all' ? 'Professional Community' : 'My Professional Network'}
      subtitle={activeTab === 'all' ? 'Connect with fellow students and industry recruiters at PathForge' : 'Nurture and manage your growing professional relationships'}
      actions={
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <button 
            onClick={() => setActiveTab('all')} 
            className={`flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'all' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-primary-600'}`}
          >
            <Newspaper size={16} />
            Community
          </button>
          <button 
            onClick={() => setActiveTab('following')} 
            className={`flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'following' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-primary-600'}`}
          >
            <Users size={16} />
            Following
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar: User Quick Stats */}
        <div className="hidden lg:block lg:col-span-3">
          <div className="card-base p-6 sticky top-8">
            <div className="flex flex-col items-center text-center">
              {stats?.avatar_url ? (
                <img src={stats.avatar_url} alt="avatar" className="w-20 h-20 rounded-2xl object-cover shadow-lg mb-4 border-4 border-white dark:border-slate-700" />
              ) : (
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${avatarColor(user?.fullName || '')} flex items-center justify-center text-white font-bold text-2xl shadow-lg mb-4 border-4 border-white dark:border-slate-700`}>
                  {initials(user?.fullName || '')}
                </div>
              )}
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">{user?.fullName}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">{user?.role}</p>
              
              <div className="w-full mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-primary-600 dark:text-primary-400">{stats?.followersCount || 0}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-primary-600 dark:text-primary-400">{stats?.followingCount || 0}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Following</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Feed Area */}
        <div className="lg:col-span-6">
          {activeTab === 'following' && (
            <div className="flex gap-2 mb-6 border-b border-gray-100 dark:border-gray-700 pb-2">
              <button 
                onClick={() => setFollowingView('posts')}
                className={`px-3 py-1 text-sm font-medium transition ${followingView === 'posts' ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400' : 'text-slate-500'}`}
              >
                Posts
              </button>
              <button 
                onClick={() => setFollowingView('following')}
                className={`px-3 py-1 text-sm font-medium transition ${followingView === 'following' ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400' : 'text-slate-500'}`}
              >
                Following
              </button>
              <button 
                onClick={() => setFollowingView('followers')}
                className={`px-3 py-1 text-sm font-medium transition ${followingView === 'followers' ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400' : 'text-slate-500'}`}
              >
                Followers
              </button>
            </div>
          )}

          {activeTab === 'all' && (user?.role === 'student' || user?.role === 'recruiter') && (
            <CreatePost currentUser={{...user, avatar_url: stats?.avatar_url}} onPosted={handlePosted} />
          )}

          {activeTab === 'following' && (followingView === 'following' || followingView === 'followers') ? (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-400 mb-2 px-1 uppercase tracking-wider">{followingView === 'following' ? 'People you follow' : 'People following you'}</h3>
              {networkUsers.length === 0 ? (
                <div className="card-base p-8 text-center">
                  <UserPlus size={40} className="mx-auto mb-3 opacity-20" />
                  <p className="text-gray-500">You haven't followed anyone yet.</p>
                </div>
              ) : (
                networkUsers.map(u => (
                  <div key={u.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 flex items-center justify-between shadow-sm hover:shadow-md transition">
                    <div className="flex items-center gap-3">
                      <a href={`#user?id=${u.id}`} className="block">
                        <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${avatarColor(u.full_name)} flex items-center justify-center text-white font-bold text-sm shadow-sm hover:opacity-80 transition`}>
                          {initials(u.full_name)}
                        </div>
                      </a>
                      <div>
                        <a href={`#user?id=${u.id}`} className="font-bold text-gray-900 dark:text-white text-sm hover:text-primary-600 transition">
                          {u.full_name}
                        </a>
                        <p className="text-xs text-gray-500 capitalize">{u.role}</p>
                      </div>
                    </div>
                    {followingView === 'following' ? (
                      <button 
                        onClick={async () => {
                          await fetch('/api/social/follow', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ followerId: user?.id, followingId: u.id })
                          });
                          setNetworkUsers(prev => prev.filter(user => user.id !== u.id));
                          loadStats();
                        }}
                        className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-rose-50 hover:text-rose-600 transition"
                      >
                        Unfollow
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-3 py-1 rounded-lg">Follower</span>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            <>
              {loading && posts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Loader2 size={32} className="animate-spin mb-3" />
                  <p className="text-sm">Loading feed…</p>
                </div>
              )}

              {!loading && posts.length === 0 && (
                <div className="text-center py-20 text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <Globe size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="font-medium">No posts here yet</p>
                  <p className="text-sm mt-1">{activeTab === 'all' ? 'Be the first to share something!' : 'Follow people to see their updates here.'}</p>
                </div>
              )}

              {posts.map(post => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  currentUser={{...user, avatar_url: stats?.avatar_url}} 
                  onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
                />
              ))}

              {hasMore && posts.length > 0 && (
                <div className="flex justify-center mt-4 mb-8">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-primary-600 dark:text-neon-cyan border border-primary-200 dark:border-neon-teal/30 rounded-xl hover:bg-primary-50 dark:hover:bg-gray-800 transition disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={15} className="animate-spin" /> : <ChevronDown size={15} />}
                    Load more
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Sidebar: Suggestions */}
        <div className="hidden xl:block xl:col-span-3">
          <div className="card-base p-6 sticky top-8">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">Add to your feed</h3>
            <div className="space-y-4">
              <p className="text-xs text-gray-500 leading-relaxed">Following people helps you stay updated with industry trends and opportunities!</p>
              <button 
                onClick={() => setActiveTab('all')} 
                className="w-full py-2.5 text-xs font-bold text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/10 transition"
              >
                Explore Community
              </button>
            </div>
          </div>

          {recentFollowers.length > 0 && (
            <div className="card-base p-6 mt-6 sticky top-[300px]">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-sm flex items-center gap-2">
                <Users size={16} className="text-primary-500" />
                Recent Followers
              </h3>
              <div className="space-y-4">
                {recentFollowers.map(f => (
                  <div key={f.id} className="flex items-center gap-3">
                    <a href={`#user?id=${f.id}`} className="block">
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${avatarColor(f.full_name)} flex items-center justify-center text-white font-bold text-[10px] shadow-sm flex-shrink-0 hover:opacity-80 transition`}>
                        {initials(f.full_name)}
                      </div>
                    </a>
                    <div className="min-w-0">
                      <a href={`#user?id=${f.id}`} className="font-bold text-gray-900 dark:text-white text-[12px] truncate hover:text-primary-600 transition">
                        {f.full_name}
                      </a>
                      <p className="text-[10px] text-gray-500 capitalize">{f.role}</p>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => { setActiveTab('following'); setFollowingView('followers'); }}
                  className="w-full mt-2 py-2 text-[10px] font-bold text-slate-500 hover:text-primary-600 transition uppercase tracking-widest"
                >
                  View All Followers
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
