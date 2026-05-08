import React, { useState, useEffect } from 'react';
import { Briefcase, Users, CheckCircle, Clock, Search, Plus, X, MapPin, DollarSign, FileText, TrendingUp, Eye, MessageCircle, AlertCircle, RefreshCw, ChevronRight, LayoutPanelTop, Star, Target, ArrowUpRight, Loader2, Zap, Video } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const RecruiterDashboard = ({ stats: initialStats }: any) => {
  const { user } = useAuth();
  const [showPostModal, setShowPostModal] = useState(false);
  const [showShortlistModal, setShowShortlistModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [shortlistMessage, setShortlistMessage] = useState('');
  const [applications, setApplications] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(true);

  const unreadNotifications = notifications.filter((notif) => !notif.is_read);

  const [jobForm, setJobForm] = useState({
    title: '',
    company: '',
    description: '',
    requirements: '',
    location: '',
    salaryRange: '',
    type: 'Full-time'
  });

  const fetchRecruiterData = async () => {
    try {
      const [statsRes, appsRes, notifRes] = await Promise.all([
        axios.get('/api/recruiter/stats', { params: { userId: user?.id } }),
        axios.get(`/api/jobs/applications/recruiter/${user?.id}`),
        axios.get(`/api/chat/notifications/${user?.id}`)
      ]);
      setStats(statsRes.data);
      setApplications(appsRes.data);
      setNotifications(notifRes.data);
    } catch (err) {
      console.error('Failed to fetch recruiter data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchRecruiterData();
  }, [user]);

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/jobs', {
        ...jobForm,
        requirements: jobForm.requirements.split(',').map(s => s.trim()),
        postedBy: user?.id
      });
      setShowPostModal(false);
      setJobForm({
        title: '',
        company: '',
        description: '',
        requirements: '',
        location: '',
        salaryRange: '',
        type: 'Full-time'
      });
      fetchRecruiterData();
    } catch (err) {
      console.error('Failed to post job:', err);
    }
  };

  const handleShortlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    try {
      await axios.post(`/api/jobs/applications/${selectedApp.id}/shortlist`, {
        message: shortlistMessage
      });
      setShowShortlistModal(false);
      setShortlistMessage('');
      setSelectedApp(null);
      fetchRecruiterData();
    } catch (err) {
      console.error('Failed to shortlist candidate:', err);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Talent Acquisition</h2>
          <p className="text-slate-500 font-medium mt-1">Orchestrate your hiring pipeline with neural candidate matching.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
             <button className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all relative">
                <MessageCircle size={20} className="text-slate-600 dark:text-slate-400" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-indigo-600 rounded-full border-2 border-white dark:border-slate-900"></span>
                )}
             </button>
          </div>
          <button
            onClick={() => setShowPostModal(true)}
            className="btn-primary px-6 py-3.5 text-[10px]"
          >
            <Plus size={18} />
            Initialize Job Requisition
          </button>
        </div>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Active Requisitions" value={stats?.activeJobs || 0} icon={<Briefcase size={20} />} trend={stats?.activeJobs > 0 ? "Active" : "None"} color="indigo" />
        <MetricCard title="Total Candidates" value={stats?.totalApps || 0} icon={<Users size={20} />} trend={stats?.totalApps > 0 ? "Growing" : "No data"} color="amber" />
        <MetricCard title="Shortlisted Talent" value={stats?.shortlisted || 0} icon={<Target size={20} />} trend={stats?.shortlisted > 0 ? "Shortlisted" : "None"} color="emerald" />
        <MetricCard title="Awaiting Audit" value={stats?.pending || 0} icon={<Clock size={20} />} trend={stats?.pending > 0 ? "Pending" : "All clear"} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Applications List */}
        <div className="lg:col-span-8 space-y-8">
          <div className="glass-card p-10">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600/10 text-indigo-600 rounded-xl">
                  <Users size={20} />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Pipeline Activity</h3>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 rounded-lg">{applications.length} Profiles</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-slate-100 dark:border-slate-800">
                    <th className="pb-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Candidate Profile</th>
                    <th className="pb-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Target Role</th>
                    <th className="pb-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Neural Status</th>
                    <th className="pb-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {applications.map((app) => (
                    <motion.tr 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={app.id} 
                      className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-all"
                    >
                      <td className="py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 rounded-2xl flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-black text-lg shadow-inner ring-1 ring-indigo-500/10">
                            {app.student_name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 dark:text-white leading-none">{app.student_name}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1 tracking-tight">{app.student_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-5">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{app.job_title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {app.interview_completed === 1 ? (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100 text-[8px] font-black uppercase">
                              <CheckCircle size={8} /> Interview Complete: {app.interview_score || 0}%
                            </div>
                          ) : app.interview_offered === 1 ? (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md border border-blue-100 text-[8px] font-black uppercase">
                              <Clock size={8} /> Interview Offered
                            </div>
                          ) : (
                            <p className="text-[8px] text-slate-400 uppercase tracking-widest font-black">Waiting for Decision</p>
                          )}
                        </div>
                      </td>
                      <td className="py-5">
                        <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest inline-block ${
                          app.status === 'shortlisted'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <button 
                             onClick={() => {
                               setSelectedApp(app);
                               setShowProfileModal(true);
                             }}
                             className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
                           >
                              <Eye size={16} />
                           </button>
                           {app.status !== 'shortlisted' && (
                            <button
                              onClick={() => {
                                setSelectedApp(app);
                                setShortlistMessage(`Congratulations! You have been shortlisted for the ${app.job_title} position.`);
                                setShowShortlistModal(true);
                              }}
                              className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-600 dark:hover:bg-indigo-400 transition-all shadow-xl"
                            >
                              Shortlist
                            </button>
                           )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Analytics */}
        <div className="lg:col-span-4 space-y-8">
           {/* Productivity Card */}
           <div className="glass-card p-8 bg-indigo-600 text-white border-none shadow-2xl shadow-indigo-500/30 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-x-10 translate-y-10"></div>
              <h4 className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.3em] mb-6">Hiring Efficiency</h4>
              <div className="flex items-end justify-between gap-4">
                 <div>
                    <h5 className="text-4xl font-black leading-none">{stats?.avgDaysToHire || 0}</h5>
                    <p className="text-[10px] font-bold text-indigo-200 mt-2">Avg. Days to Hire</p>
                 </div>
                 <div className="h-20 w-32">
                    <ResponsiveContainer width="100%" height="100%">
                       <LineChart data={stats?.hiringTrend || [ {v:0}, {v:0}, {v:0}, {v:0}, {v:0} ]}>
                          <Line type="monotone" dataKey="v" stroke="white" strokeWidth={3} dot={false} />
                       </LineChart>
                    </ResponsiveContainer>
                 </div>
              </div>
           </div>

           {/* Quick Stats Radar/Chart */}
           <div className="glass-card p-8">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Pipeline Composition</h4>
              <div className="h-[200px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.composition || [ {n:'Eng', v:0}, {n:'Des', v:0}, {n:'Prod', v:0}, {n:'Mark', v:0} ]}>
                       <Bar dataKey="v" radius={[6, 6, 0, 0]}>
                          {[0,1,2,3].map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={['#4f46e5', '#06b6d4', '#8b5cf6', '#10b981'][index]} />
                          ))}
                       </Bar>
                       <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{fontSize:10, fontWeight:700, fill:'#94a3b8'}} />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* Recent System Notifications */}
           <div className="glass-card p-8">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Neural Logs</h4>
                <button className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">View All</button>
              </div>
              <div className="space-y-4">
                 {notifications.slice(0, 3).map((notif, i) => (
                    <div key={i} className="flex gap-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                       <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
                       <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold leading-relaxed">{notif.content}</p>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* Post Job Modal */}
      <AnimatePresence>
        {showPostModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass-card w-full max-w-2xl overflow-hidden shadow-2xl border-indigo-500/20"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-indigo-600 text-white rounded-2xl"><Plus size={20} /></div>
                   <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Post New Requisition</h3>
                </div>
                <button onClick={() => setShowPostModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                  <X size={24} className="text-slate-400" />
                </button>
              </div>
              
              <form onSubmit={handlePostJob} className="p-10 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup label="Job Title" value={jobForm.title} onChange={(val: string) => setJobForm({...jobForm, title: val})} placeholder="e.g. Senior Neural Architect" />
                  <InputGroup label="Enterprise Name" value={jobForm.company} onChange={(val: string) => setJobForm({...jobForm, company: val})} placeholder="e.g. Cyberdyne Systems" />
                  <InputGroup label="Target Location" value={jobForm.location} onChange={(val: string) => setJobForm({...jobForm, location: val})} placeholder="e.g. Remote / Hybrid" icon={<MapPin size={14} />} />
                  <InputGroup label="Compensation Matrix" value={jobForm.salaryRange} onChange={(val: string) => setJobForm({...jobForm, salaryRange: val})} placeholder="e.g. $140k - $190k" icon={<DollarSign size={14} />} />
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Employment Architecture</label>
                    <select
                      className="input-base appearance-none"
                      value={jobForm.type}
                      onChange={e => setJobForm({...jobForm, type: e.target.value})}
                    >
                      <option>Full-time</option>
                      <option>Contract</option>
                      <option>Venture-based</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Core Description</label>
                  <textarea
                    required
                    className="input-base h-32 resize-none"
                    placeholder="Define the scope and impact of this requisition..."
                    value={jobForm.description}
                    onChange={e => setJobForm({...jobForm, description: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Required Vectors (Comma Separated)</label>
                  <input
                    required
                    className="input-base"
                    placeholder="React, Rust, PyTorch, Kubernetes"
                    value={jobForm.requirements}
                    onChange={e => setJobForm({...jobForm, requirements: e.target.value})}
                  />
                </div>

                <div className="pt-6 flex gap-4">
                  <button type="button" onClick={() => setShowPostModal(false)} className="btn-secondary flex-1 py-4 text-[10px]">Discard Draft</button>
                  <button type="submit" className="btn-primary flex-1 py-4 text-[10px]">Finalize & Post Requisition</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shortlist Modal */}
      <AnimatePresence>
        {showShortlistModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass-card w-full max-w-lg overflow-hidden shadow-2xl border-indigo-500/20"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-emerald-600 text-white rounded-2xl"><Target size={20} /></div>
                   <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Calibrate Talent Match</h3>
                </div>
                <button onClick={() => setShowShortlistModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                  <X size={24} className="text-slate-400" />
                </button>
              </div>
              
              <form onSubmit={handleShortlist} className="p-10 space-y-6">
                <div>
                  <p className="text-xs text-slate-500 font-bold leading-relaxed mb-6">
                    Confirming shortlist for <span className="text-slate-900 dark:text-white font-black underline decoration-indigo-500">{selectedApp?.student_name}</span> for the role of <span className="font-black text-indigo-600 uppercase">{selectedApp?.job_title}</span>.
                  </p>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Calibration Message</label>
                  <textarea
                    required
                    className="input-base h-40 resize-none mt-2"
                    placeholder="Enter customized onboarding message or interview scheduling coordinates..."
                    value={shortlistMessage}
                    onChange={e => setShortlistMessage(e.target.value)}
                  />
                </div>

                <div className="pt-6 flex gap-4">
                  <button type="button" onClick={() => setShowShortlistModal(false)} className="btn-secondary flex-1 py-4 text-[10px]">Cancel</button>
                  <button type="submit" className="btn-primary flex-1 py-4 text-[10px] bg-emerald-600 hover:bg-emerald-500 border-none shadow-emerald-500/20">Authorize Shortlist</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
       </AnimatePresence>
 
       {/* Candidate Profile Modal */}
       <AnimatePresence>
         {showProfileModal && selectedApp && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-6"
           >
             <motion.div 
               initial={{ scale: 0.9, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               className="glass-card w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
             >
               <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl">
                      {selectedApp.student_name.charAt(0)}
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{selectedApp.student_name}</h3>
                       <p className="text-xs text-slate-500 font-bold">{selectedApp.student_email}</p>
                    </div>
                 </div>
                 <button onClick={() => setShowProfileModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                   <X size={24} className="text-slate-400" />
                 </button>
               </div>
               
               <div className="p-10 overflow-y-auto space-y-10">
                 {/* Bio Section */}
                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Candidate Narrative</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-bold leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                      {selectedApp.student_bio || "This candidate hasn't provided a professional bio yet. Use the technical audit below for evaluation."}
                    </p>
                 </div>
 
                 {/* Stats Row */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                       <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Experience</p>
                       <p className="text-sm font-black text-slate-900 dark:text-white">{selectedApp.experience_years || 0} Years</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                       <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Interview Score</p>
                       <p className={`text-sm font-black ${selectedApp.interview_score ? 'text-emerald-500' : 'text-slate-400'}`}>
                         {selectedApp.interview_score ? `${selectedApp.interview_score}%` : 'N/A'}
                       </p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                       <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Role Target</p>
                       <p className="text-sm font-black text-slate-900 dark:text-white">{selectedApp.job_title}</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                       <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Status</p>
                       <p className="text-sm font-black text-indigo-600 uppercase">{selectedApp.status}</p>
                    </div>
                 </div>
 
                 {/* Resume Section */}
                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Parsed Resume Data</h4>
                       <button 
                         onClick={() => {
                           if (selectedApp.resume_url) {
                             window.open(selectedApp.resume_url, '_blank');
                           } else {
                             alert("Original PDF file is not available for this candidate. Only parsed text is available.");
                           }
                         }}
                         className="text-[9px] font-black text-indigo-600 flex items-center gap-1 hover:text-indigo-800 transition-colors"
                       >
                          <FileText size={12} /> View Full PDF
                       </button>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 h-48 overflow-y-auto whitespace-pre-wrap">
                      {selectedApp.resume_text || "Resume content is being processed or was not uploaded correctly."}
                    </div>
                 </div>
 
                 {/* Technical Audit (If available) */}
                 {selectedApp.interview_details && (
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-[#0081C9] uppercase tracking-[0.3em] flex items-center gap-2">
                        <Zap size={14} /> AI Technical Audit Verdict
                      </h4>
                      <div className="p-6 bg-blue-50/50 dark:bg-[#0081C9]/5 rounded-3xl border border-blue-100 dark:border-[#0081C9]/20">
                         <p className="text-sm font-bold text-slate-800 dark:text-slate-200 italic mb-4">
                           "{JSON.parse(selectedApp.interview_details).feedback}"
                         </p>
                         <div className="flex flex-wrap gap-2">
                            {(JSON.parse(selectedApp.interview_details).strengths || []).map((s: string, i: number) => (
                               <span key={i} className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[9px] font-black uppercase rounded-lg">+{s}</span>
                            ))}
                         </div>
                      </div>
                   </div>
                 )}
               </div>
 
               <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex gap-4 bg-slate-50/50 dark:bg-slate-950/50">
                 <button 
                                       onClick={async () => {
                      if (selectedApp.interview_offered === 1) return;
                     try {
                       await axios.post(`/api/jobs/applications/${selectedApp.id}/request-interview`);
                       alert("Interview formal request sent to candidate.");
                       setShowProfileModal(false);
                       fetchRecruiterData();
                     } catch (err) {
                       alert("Failed to request interview.");
                     }
                   }}
                                       disabled={selectedApp.interview_offered === 1}
                    className={`flex-1 py-4 ${selectedApp.interview_offered === 1 ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-[#0081C9] text-white hover:bg-[#0070B0] shadow-lg shadow-blue-500/20'} font-black rounded-2xl flex items-center justify-center gap-2 transition-all`}
                 >
                                       <Video size={18} /> {selectedApp.interview_offered === 1 ? 'Interview Offered' : 'Propose Technical Interview'}
                 </button>
                 <button 
                   onClick={() => {
                     setShowProfileModal(false);
                     setSelectedApp(selectedApp);
                     setShortlistMessage(`Congratulations! You have been shortlisted for the ${selectedApp.job_title} position.`);
                     setShowShortlistModal(true);
                   }}
                   className="flex-1 py-4 bg-[#0F172A] text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-black transition-all"
                 >
                   <Target size={18} /> Finalize Shortlist
                 </button>
               </div>
             </motion.div>
           </motion.div>
         )}
       </AnimatePresence>
     </div>
   );
 };

const MetricCard = ({ title, value, icon, trend, color }: any) => {
  const colors: any = {
    indigo: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 ring-indigo-500/20',
    amber: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 ring-amber-500/20',
    emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 ring-emerald-500/20',
    rose: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 ring-rose-500/20',
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="glass-card p-6 flex items-center transition-all group"
    >
      <div className={`p-4 rounded-2xl mr-5 ring-1 ${colors[color]} group-hover:scale-110 transition-transform duration-500`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{value}</p>
        <p className="text-[9px] font-bold text-slate-400 mt-2 flex items-center gap-1">
           <ArrowUpRight size={10} className="text-emerald-500" /> {trend}
        </p>
      </div>
    </motion.div>
  );
};

const InputGroup = ({ label, value, onChange, placeholder, icon, type = "text" }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">{label}</label>
    <div className="relative">
      {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>}
      <input 
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`input-base ${icon ? 'pl-12' : ''}`}
        placeholder={placeholder}
        required
      />
    </div>
  </div>
);

export default RecruiterDashboard;