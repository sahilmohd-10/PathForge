import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  User, Mail, Briefcase, MapPin, Globe, Camera, Save, 
  Plus, X, Award, BookOpen, Loader2, Phone, Github, Linkedin, Twitter, Zap, Edit3, Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PageShell from '../components/PageShell';
import { motion, AnimatePresence } from 'framer-motion';

const Profile = () => {
  const { user, token, login } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    target_career: '',
    phone_number: '',
    location: '',
    website: '',
    experience_years: 0,
    education: '',
    bio: '',
    skills: [] as string[],
    avatar_url: '',
    background_url: ''
  });

  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    if (user?.id && token) {
      fetchProfile();
    }
  }, [user?.id, token]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/profile/${user?.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data;
      setFormData({
        fullName: data.fullName || user?.fullName || '',
        email: data.email || user?.email || '',
        target_career: data.target_career || '',
        phone_number: data.phone_number || '',
        location: data.location || '',
        website: data.website || '',
        experience_years: data.experience_years || 0,
        education: data.education || '',
        bio: data.bio || '',
        skills: Array.isArray(data.skills) ? data.skills.map((s: any) => typeof s === 'string' ? s : s.name) : [],
        avatar_url: data.avatar_url || '',
        background_url: data.background_url || ''
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await axios.put(`/api/profile/${user?.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      if (res.data.user) {
        login(token!, res.data.user);
      }
      setIsEditMode(false);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (newSkill && !formData.skills.includes(newSkill)) {
      setFormData({ ...formData, skills: [...formData.skills, newSkill] });
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(s => s !== skillToRemove)
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-[#0081C9]" size={32} />
    </div>
  );

  return (
    <PageShell title="Personal Identity" subtitle="Manage your professional digital twin and career metrics">
      <div className="max-w-5xl mx-auto pb-20">
        <form onSubmit={handleUpdate} className="space-y-8">
          
          {/* Header Card */}
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden relative group/header">
            <div className="h-48 relative overflow-hidden">
              {formData.background_url ? (
                <img src={formData.background_url} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-[#0081C9] to-indigo-600 opacity-10"></div>
              )}
              {isEditMode && (
                <button 
                  type="button" 
                  className="absolute top-6 right-6 p-3 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-xl transition-all hover:bg-white/40"
                  onClick={() => {
                    const url = prompt('Enter image URL for background:');
                    if (url) setFormData({ ...formData, background_url: url });
                  }}
                >
                  <Camera size={20} />
                </button>
              )}
            </div>
            <div className="px-10 pb-10">
              <div className="flex flex-col md:flex-row items-center md:items-end -mt-16 gap-8">
                <div className="relative group">
                  <div className="h-32 w-32 bg-white rounded-[32px] p-1 shadow-2xl overflow-hidden ring-8 ring-white">
                    {formData.avatar_url ? (
                      <img src={formData.avatar_url} alt="Avatar" className="h-full w-full object-cover rounded-[28px]" />
                    ) : (
                      <div className="h-full w-full bg-[#0081C9] flex items-center justify-center text-white text-4xl font-black rounded-[28px]">
                        {formData.fullName?.charAt(0) || user?.fullName?.charAt(0)}
                      </div>
                    )}
                  </div>
                  {isEditMode && (
                    <button 
                      type="button" 
                      className="absolute inset-0 bg-black/40 text-white rounded-[32px] flex items-center justify-center transition-opacity"
                      onClick={() => {
                        const url = prompt('Enter image URL for avatar:');
                        if (url) setFormData({ ...formData, avatar_url: url });
                      }}
                    >
                      <Camera size={24} />
                    </button>
                  )}
                </div>
                <div className="text-center md:text-left flex-1 mb-2">
                  <h2 className="text-3xl font-black text-[#0f172a]">{formData.fullName}</h2>
                  <p className="text-slate-400 font-bold text-sm flex items-center justify-center md:justify-start gap-2">
                    <ShieldCheck size={16} className="text-[#0081C9]" /> Verified Digital Professional
                  </p>
                </div>
                
                {isEditMode ? (
                  <div className="flex gap-4">
                    <button 
                      type="button" 
                      onClick={() => setIsEditMode(false)}
                      className="px-10 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-[0.98]"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={saving} 
                      className="px-10 py-4 bg-[#0081C9] text-white font-black rounded-2xl text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-blue-500/20 hover:bg-[#0070B0] transition-all disabled:opacity-50 active:scale-[0.98]"
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      Save Profile
                    </button>
                  </div>
                ) : (
                  <button 
                    type="button" 
                    onClick={() => setIsEditMode(true)}
                    className="px-10 py-4 bg-white border-2 border-[#0081C9] text-[#0081C9] font-black rounded-2xl text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-[#0081C9] hover:text-white transition-all active:scale-[0.98]"
                  >
                    <Edit3 size={16} />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>

          {message.text && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`p-5 rounded-2xl border text-sm font-bold flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
              {message.type === 'success' ? <Check size={18} /> : <X size={18} />}
              {message.text}
            </motion.div>
          )}

          {/* Form Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-[40px] border border-slate-100 p-10 space-y-10 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-[#0f172a] uppercase tracking-widest flex items-center gap-3">
                    <User size={18} className="text-[#0081C9]" /> Personal Details
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormInput label="Full Name" icon={<User size={16} />} value={formData.fullName} onChange={(v: string) => setFormData({...formData, fullName: v})} disabled={!isEditMode} />
                  <FormInput label="Email Address" icon={<Mail size={16} />} value={formData.email} onChange={(v: string) => setFormData({...formData, email: v})} disabled={!isEditMode} />
                  <FormInput label="Target Career" icon={<Briefcase size={16} />} value={formData.target_career} onChange={(v: string) => setFormData({...formData, target_career: v})} disabled={!isEditMode} />
                  <FormInput label="Phone Number (Twilio)" icon={<Phone size={16} />} value={formData.phone_number} onChange={(v: string) => setFormData({...formData, phone_number: v})} placeholder="+91 98765 43210" disabled={!isEditMode} />
                  <FormInput label="Location" icon={<MapPin size={16} />} value={formData.location} onChange={(v: string) => setFormData({...formData, location: v})} disabled={!isEditMode} />
                  <FormInput label="Portfolio Website" icon={<Globe size={16} />} value={formData.website} onChange={(v: string) => setFormData({...formData, website: v})} disabled={!isEditMode} />
                  <FormInput label="Experience Years" icon={<Award size={16} />} type="number" value={formData.experience_years} onChange={(v: string) => setFormData({...formData, experience_years: parseInt(v)})} disabled={!isEditMode} />
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Professional Bio</label>
                  <textarea 
                    className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl focus:border-[#0081C9] focus:bg-white outline-none font-bold text-sm min-h-[160px] transition-all disabled:opacity-70" 
                    value={formData.bio} 
                    onChange={e => setFormData({...formData, bio: e.target.value})}
                    placeholder="Describe your professional journey and aspirations..."
                    disabled={!isEditMode}
                  />
                </div>
              </div>

              <div className="bg-white rounded-[40px] border border-slate-100 p-10 space-y-8 shadow-sm">
                <h3 className="text-sm font-black text-[#0f172a] uppercase tracking-widest flex items-center gap-3">
                  <BookOpen size={18} className="text-[#0081C9]" /> Academic Background
                </h3>
                <textarea 
                  className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl focus:border-[#0081C9] focus:bg-white outline-none font-bold text-sm min-h-[120px] transition-all disabled:opacity-70" 
                  value={formData.education} 
                  onChange={e => setFormData({...formData, education: e.target.value})}
                  placeholder="List your degrees, certifications, and educational milestones..."
                  disabled={!isEditMode}
                />
              </div>
            </div>

            <div className="space-y-8">
              {/* Skill Matrix */}
              <div className="bg-white rounded-[40px] border border-slate-100 p-10 space-y-8 shadow-sm">
                <h3 className="text-sm font-black text-[#0f172a] uppercase tracking-widest flex items-center gap-3">
                  <Zap size={18} className="text-[#0081C9]" /> Skill Matrix
                </h3>
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    placeholder="Add a skill..." 
                    className="flex-1 px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs outline-none focus:border-[#0081C9] focus:bg-white transition-all disabled:opacity-50" 
                    value={newSkill}
                    onChange={e => setNewSkill(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    disabled={!isEditMode}
                  />
                  <button type="button" onClick={addSkill} disabled={!isEditMode} className="p-3 bg-[#0081C9] text-white rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
                    <Plus size={20} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence>
                    {formData.skills.map(skill => (
                      <motion.span 
                        key={skill} 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="px-4 py-2 bg-slate-50 text-[#0081C9] rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-slate-100 group hover:border-[#0081C9]/30 transition-all"
                      >
                        {skill}
                        {isEditMode && <X size={12} className="cursor-pointer text-slate-300 hover:text-rose-500 transition-colors" onClick={() => removeSkill(skill)} />}
                      </motion.span>
                    ))}
                  </AnimatePresence>
                  {formData.skills.length === 0 && (
                    <p className="text-[10px] font-bold text-slate-400 italic">No skills added to matrix yet.</p>
                  )}
                </div>
              </div>

              {/* Social Connect */}
              <div className="bg-white rounded-[40px] border border-slate-100 p-10 space-y-8 shadow-sm">
                <h3 className="text-sm font-black text-[#0f172a] uppercase tracking-widest flex items-center gap-3">
                  Social Connectivity
                </h3>
                <div className="space-y-6">
                  <SocialInput icon={<Github size={16} />} label="GitHub" placeholder="github.com/username" disabled={!isEditMode} />
                  <SocialInput icon={<Linkedin size={16} />} label="LinkedIn" placeholder="linkedin.com/in/username" disabled={!isEditMode} />
                  <SocialInput icon={<Twitter size={16} />} label="Twitter" placeholder="twitter.com/username" disabled={!isEditMode} />
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </PageShell>
  );
};

const FormInput = ({ label, icon, value, onChange, type = "text", placeholder = "", disabled = false }: any) => (
  <div className="space-y-3">
    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative">
      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#0081C9]">{icon}</div>
      <input 
        type={type} 
        placeholder={placeholder}
        disabled={disabled}
        className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl focus:border-[#0081C9] focus:bg-white outline-none font-bold text-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed" 
        value={value} 
        onChange={e => onChange(e.target.value)} 
      />
    </div>
  </div>
);

const SocialInput = ({ icon, label, placeholder, disabled = false }: any) => (
  <div className={`flex items-center gap-4 group ${disabled ? 'opacity-70' : ''}`}>
    <div className={`w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 ${!disabled ? 'group-focus-within:text-[#0081C9] group-focus-within:bg-blue-50' : ''} transition-all`}>
      {icon}
    </div>
    <div className="flex-1">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <input 
        type="text" 
        placeholder={placeholder} 
        disabled={disabled}
        className="w-full bg-transparent border-b border-slate-100 py-1 text-xs font-bold outline-none focus:border-[#0081C9] transition-all disabled:cursor-not-allowed" 
      />
    </div>
  </div>
);

const ShieldCheck = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export default Profile;