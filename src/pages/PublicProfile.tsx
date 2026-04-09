import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Mail, BookOpen, Briefcase, Award, Globe, Loader2, UserPlus, UserCheck } from 'lucide-react';
import PageShell from '../components/PageShell';
import { PostCard, Post, avatarColor, initials, roleBadge } from './PostsFeed';

const PublicProfile = () => {
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followPending, setFollowPending] = useState(false);

  // Get user ID from URL hash search: #user?id=123
  const searchParams = new URLSearchParams(window.location.hash.split('?')[1]);
  const profileId = searchParams.get('id');

  useEffect(() => {
    if (!profileId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Profile
        const profRes = await axios.get(`/api/profile/${profileId}`);
        setProfile(profRes.data);

        // Check following status
        if (currentUser?.id && currentUser.id !== Number(profileId)) {
          const statsRes = await axios.get(`/api/social/user/${profileId}`);
          // Note: statsRes.data might not tell us if WE follow them, 
          // but we can check via another endpoint or the feed
          const feedRes = await axios.get(`/api/social/feed?userId=${currentUser.id}&authorId=${profileId}&limit=1`);
          if (feedRes.data.length > 0) {
            setIsFollowing(feedRes.data[0].isFollowing);
          }
        }
      } catch (err) {
        console.error('Error loading public profile:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchPosts = async () => {
      setLoadingPosts(true);
      try {
        const res = await axios.get(`/api/social/feed?userId=${currentUser?.id || ''}&authorId=${profileId}`);
        setPosts(res.data);
      } catch (err) {
        console.error('Error loading user posts:', err);
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchData();
    fetchPosts();
  }, [profileId, currentUser?.id]);

  const toggleFollow = async () => {
    if (followPending || !profileId || Number(profileId) === currentUser?.id) return;
    setFollowPending(true);
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    try {
      await axios.post('/api/social/follow', {
        followerId: currentUser?.id,
        followingId: Number(profileId)
      });
    } catch {
      setIsFollowing(wasFollowing);
    } finally {
      setFollowPending(false);
    }
  };

  if (!profileId) return <div className="p-8">User ID not specified.</div>;
  if (loading) return <div className="p-8 flex items-center gap-2"><Loader2 className="animate-spin" /> Loading profile...</div>;
  if (!profile) return <div className="p-8">User profile not found.</div>;

  const isOwnProfile = Number(profileId) === currentUser?.id;

  return (
    <PageShell
      title={`Profile: ${profile.fullName}`}
      subtitle={`Viewing the professional profile of ${profile.fullName}`}
      maxWidth="max-w-6xl"
    >
      <div className="space-y-8 pb-20">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* Background Banner */}
          <div className="relative h-44 bg-gradient-to-r from-primary-600 to-primary-800 dark:from-neon-cyan dark:to-neon-teal overflow-hidden">
            {profile.background_url && (
              <img src={profile.background_url} alt="Banner" className="w-full h-full object-cover" />
            )}
          </div>

          <div className="px-8 pb-8">
            <div className="relative -mt-16 mb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="relative h-32 w-32 bg-white dark:bg-gray-800 rounded-3xl p-1 shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover rounded-2xl" />
                ) : (
                  <div className={`h-full w-full bg-gradient-to-br ${avatarColor(profile.fullName)} flex items-center justify-center text-white text-4xl font-bold`}>
                    {initials(profile.fullName)}
                  </div>
                )}
              </div>
              
              {!isOwnProfile && (
                <button
                  onClick={toggleFollow}
                  disabled={followPending}
                  className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition shadow-lg ${
                    isFollowing 
                      ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-rose-50 hover:text-rose-600'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {isFollowing ? <UserCheck size={18} /> : <UserPlus size={18} />}
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
            </div>

            <div className="mb-8">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{profile.fullName}</h2>
                {roleBadge(profile.role)}
              </div>
              <p className="text-lg text-gray-500 dark:text-gray-400 font-medium mt-1">{profile.target_career || 'Professional'}</p>
              <div className="flex items-center gap-1.5 text-sm text-gray-400 mt-2">
                <Globe size={14} className="text-primary-500" />
                <span>{profile.location || 'Distributed'}</span>
                {profile.website && (
                  <>
                    <span className="mx-2">•</span>
                    <a href={profile.website} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">{profile.website.replace(/^https?:\/\//, '')}</a>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <Mail className="h-5 w-5 mr-3 text-gray-400" />
                  {profile.email}
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <BookOpen className="h-5 w-5 mr-3 text-gray-400" />
                  {profile.education || 'Education not listed'}
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <Briefcase className="h-5 w-5 mr-3 text-gray-400" />
                  {profile.experience_years || 0} Years Experience
                </div>
              </div>

              {profile.skills && profile.skills.length > 0 && (
                <div className="bg-slate-50 dark:bg-gray-900/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <Award className="h-4 w-4 text-primary-500" />
                    Top Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill: any, idx: number) => (
                      <span key={idx} className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold">
                        {typeof skill === 'string' ? skill : skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-700">
              <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-wider">About</h4>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {profile.bio || "No biography available."}
              </p>
            </div>
          </div>
        </div>

        {/* User Posts Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Recent Activity</h3>
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-md text-xs font-bold">{posts.length}</span>
          </div>
          
          {loadingPosts ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" /></div>
          ) : posts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {posts.map(post => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  currentUser={currentUser} 
                  onDelete={() => setPosts(prev => prev.filter(p => p.id !== post.id))} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-400">
              <p>No posts published yet.</p>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default PublicProfile;
