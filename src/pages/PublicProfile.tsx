import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Mail, BookOpen, Briefcase, Award, Globe, Loader2, MapPin, Building2, ExternalLink } from 'lucide-react';
import PageShell from '../components/PageShell';

const PublicProfile = () => {
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const searchParams = new URLSearchParams(window.location.hash.split('?')[1]);
  const profileId = searchParams.get('id');

  useEffect(() => {
    if (!profileId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const profRes = await axios.get(`/api/profile/${profileId}`);
        setProfile(profRes.data);
      } catch (err) {
        console.error('Error loading public profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [profileId]);

  if (!profileId) return <div className="p-8">User ID not specified.</div>;
  if (loading) return <div className="p-8 flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-[#0081C9]" size={32} /></div>;
  if (!profile) return <div className="p-8">User profile not found.</div>;

  return (
    <PageShell title="Professional Profile" subtitle={`Viewing ${profile.fullName}'s career identity`}>
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="relative h-48 bg-slate-100">
            {profile.background_url ? (
              <img src={profile.background_url} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-10"></div>
            )}
          </div>

          <div className="px-10 pb-12">
            <div className="relative flex flex-col md:flex-row md:items-end justify-between -mt-16 gap-8">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
                <div className="relative h-32 w-32 bg-white rounded-[24px] p-1 shadow-2xl overflow-hidden ring-8 ring-white">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover rounded-[22px]" />
                  ) : (
                    <div className="h-full w-full bg-[#0081C9] flex items-center justify-center text-white text-4xl font-black rounded-[22px]">
                      {profile.fullName.charAt(0)}
                    </div>
                  )}
                </div>
                
                <div className="text-center md:text-left mb-2">
                  <h2 className="text-3xl font-black text-[#0f172a]">{profile.fullName}</h2>
                  <p className="text-[#0081C9] font-black text-[10px] uppercase tracking-widest mt-1">
                    {profile.target_career || 'Strategic Professional'}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button className="px-6 py-3 bg-[#0081C9] text-white font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center gap-2">
                  <Mail size={14} /> Contact
                </button>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-12">
                <section className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">About</h4>
                  <p className="text-slate-600 font-bold leading-relaxed">{profile.bio || 'No bio available.'}</p>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <InfoItem icon={<Mail size={14} />} label="Email Address" value={profile.email} />
                  <InfoItem icon={<MapPin size={14} />} label="Location" value={profile.location || 'Distributed'} />
                  <InfoItem icon={<Briefcase size={14} />} label="Experience" value={`${profile.experience_years || 0} Years`} />
                  <InfoItem icon={<BookOpen size={14} />} label="Education" value={profile.education || 'Self-Taught'} />
                </div>
              </div>

              <div className="space-y-8">
                <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Expertise</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills?.map((skill: any, idx: number) => (
                      <span key={idx} className="px-4 py-2 bg-white text-[#0081C9] rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100 shadow-sm">
                        {typeof skill === 'string' ? skill : skill.name}
                      </span>
                    )) || <p className="text-xs text-slate-400">No skills listed.</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

const InfoItem = ({ icon, label, value }: any) => (
  <div className="space-y-1">
    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
      {icon} {label}
    </div>
    <p className="text-sm font-black text-[#0f172a]">{value}</p>
  </div>
);

export default PublicProfile;