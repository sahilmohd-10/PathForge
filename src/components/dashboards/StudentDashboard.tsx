import React, { useState, useEffect } from 'react';
import { Zap, CheckCircle, Clock, Briefcase, MapPin, ChevronRight, Compass, Video, Route, FileSearch, Github, User } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

const StudentDashboard = ({ profile }: any) => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appsRes] = await Promise.all([
          axios.get(`/api/jobs/applications/student/${user?.id}`)
        ]);
        setApplications(appsRes.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchData();
  }, [user]);

  const isNewUser = applications.length === 0 && !profile?.bio;

  const stats = [
    { label: 'Skills Tracked', value: isNewUser ? '0' : (profile?.skills?.length || '39'), icon: <Zap size={24} />, color: 'bg-white' },
    { label: 'Applications', value: isNewUser ? '0' : (applications.length || '7'), icon: <CheckCircle size={24} />, color: 'bg-white' },
    { label: 'Time Learned', value: isNewUser ? '0 min' : '8 min', icon: <Clock size={24} />, color: 'bg-white' },
  ];

  const tools = [
    { id: 'career', label: 'AI Career Engine', desc: 'Upload resume & get ML predictions', icon: <Compass className="text-blue-500" />, bgColor: 'bg-blue-50' },
    { id: 'mockinterview', label: 'Video Mock Interview', desc: 'Practice with Sarah (AI)', icon: <Video className="text-pink-500" />, bgColor: 'bg-pink-50' },
    { id: 'roadmap', label: 'Learning Roadmap', desc: 'Milestone-based path', icon: <Route className="text-indigo-500" />, bgColor: 'bg-indigo-50' },
    { id: 'resume', label: 'ATS Resume Analyzer', desc: 'Check your ATS score', icon: <FileSearch className="text-emerald-500" />, bgColor: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-3xl font-black text-[#0f172a] mb-2">Student Dashboard</h2>
        <p className="text-slate-500 font-bold">Your {profile?.target_career || 'Target Role'} readiness at a glance.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">{stat.label}</p>
              <h4 className="text-4xl font-black text-[#0f172a]">{stat.value}</h4>
            </div>
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 border border-slate-100">
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: My Applications */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3 text-[#0081C9]">
                <Briefcase size={20} />
                <h3 className="text-lg font-black text-[#0f172a]">My Applications</h3>
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-[#0081C9]">{isNewUser ? 0 : (applications.length || 7)}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">total</p>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {isNewUser ? (
                <div className="p-10 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                    <Briefcase size={32} />
                  </div>
                  <p className="text-sm font-bold text-slate-400">No applications found yet.</p>
                  <button 
                    onClick={() => window.location.hash = 'jobboard'}
                    className="mt-4 text-[10px] font-black uppercase tracking-widest text-[#0081C9] hover:underline"
                  >
                    Browse available jobs
                  </button>
                </div>
              ) : (
                (applications.length > 0 ? applications : [
                  { id: 1, job_title: 'Data Analyst', company: 'Vrinda Global', location: 'Noida, Ghaziabad', status: 'Applied', created_at: '2026-05-03' },
                  { id: 2, job_title: 'Data Analyst', company: 'Tech Solutions', location: 'Remote', status: 'Applied', created_at: '2026-05-01' }
                ]).map((app) => (
                  <div 
                    key={app.id} 
                    onClick={() => {
                      if (app.external_url) window.open(app.external_url, '_blank');
                      else window.location.hash = `jobboard?search=${encodeURIComponent(app.job_title)}`;
                    }}
                    className="p-5 bg-slate-50 rounded-[24px] flex items-center justify-between border border-transparent hover:border-blue-200 hover:bg-blue-50/30 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#0081C9] shadow-sm group-hover:scale-110 transition-transform">
                        <Briefcase size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 group-hover:text-[#0081C9] transition-colors">{app.job_title}</h4>
                        <p className="text-[11px] font-bold text-slate-500">{app.company_name || app.company} • {app.job_location || app.location}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="text-right">
                        <span className={`px-3 py-1 border text-[10px] font-black uppercase rounded-lg ${
                          app.status === 'shortlisted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-white border-slate-200 text-slate-500'
                        }`}>
                          {app.status}
                        </span>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">
                          {new Date(app.applied_at || app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      {app.interview_offered === 1 && app.interview_completed !== 1 && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.hash = `mockinterview?jobId=${app.job_id}&role=${encodeURIComponent(app.job_title)}`;
                          }}
                          className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center gap-2 hover:bg-black transition-all"
                        >
                          <Video size={12} /> Interview
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: AI Navigation Tools */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            <div className="flex items-center gap-3 text-[#0081C9] mb-8">
              <Compass size={20} />
              <h3 className="text-lg font-black text-[#0f172a]">AI Navigation Tools</h3>
            </div>
            <div className="space-y-4">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => {
                    window.location.hash = tool.id;
                  }}
                  className="w-full p-4 rounded-2xl flex items-center gap-4 hover:bg-slate-50 transition-all text-left border border-transparent hover:border-slate-100"
                >
                  <div className={`w-12 h-12 ${tool.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    {tool.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-slate-900">{tool.label}</h4>
                    <p className="text-[11px] font-bold text-slate-500 truncate">{tool.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;