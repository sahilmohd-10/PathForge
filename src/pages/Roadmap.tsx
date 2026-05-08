import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import PageShell from '../components/PageShell';
import { Map, Loader2, Play, CheckCircle, Target, Sparkles, ChevronRight, BookOpen, Clock, Rocket, Route, Calendar, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TwilioShare from '../components/TwilioShare';

const Roadmap = () => {
  const { user } = useAuth();
  const [targetRole, setTargetRole] = useState('');
  const [currentSkills, setCurrentSkills] = useState('');
  const [roadmap, setRoadmap] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generateRoadmap = async () => {
    if (!targetRole || !currentSkills) return;
    setLoading(true);
    try {
      const response = await axios.post('/api/ai/learning-roadmap', {
        userId: user?.id,
        targetRole,
        currentSkills: currentSkills.split(',').map(s => s.trim())
      });
      const roadmapData = response.data.roadmap || response.data || [];
      setRoadmap(Array.isArray(roadmapData) ? roadmapData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [selectedStep, setSelectedStep] = useState<any>(null);

  return (
    <PageShell title="Learning Roadmap" subtitle="AI-synthesized learning paths designed to bridge your technical skill gaps">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Input Form */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 p-10">
          <div className="flex flex-col md:flex-row items-end gap-6">
            <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Target Role</label>
                <input type="text" value={targetRole} onChange={e => setTargetRole(e.target.value)} placeholder="e.g. Senior Backend Architect" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-[#0081C9] outline-none transition-all font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Current Skills</label>
                <input type="text" value={currentSkills} onChange={e => setCurrentSkills(e.target.value)} placeholder="e.g. Node.js, SQL, React" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-[#0081C9] outline-none transition-all font-bold" />
              </div>
            </div>
            <button onClick={generateRoadmap} disabled={!targetRole || !currentSkills || loading} className="py-4 px-8 bg-[#0081C9] text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 hover:bg-[#0070B0] transition-all min-w-[180px]">
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {loading ? 'Synthesizing...' : 'Generate Path'}
            </button>
          </div>
        </div>

        {/* Results Section */}
        <AnimatePresence>
          {roadmap && (
            <div className="space-y-8">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <Route className="text-[#0081C9]" size={24} />
                  <h3 className="text-2xl font-black text-[#0f172a]">Project Architected Roadmaps</h3>
                </div>
                {user && (
                  <TwilioShare 
                    userId={user.id} 
                    featureName="Career Acceleration Engine" 
                    summary={`Strategic Role: ${targetRole}. Vector Roadmap complete with ${roadmap?.length || 0} specialized milestones.`} 
                  />
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {roadmap.map((milestone: any, idx: number) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 flex flex-col justify-between hover:border-[#0081C9]/30 transition-all group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#0081C9] border border-slate-50">
                          <Rocket size={20} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          STEP {idx + 1} / {roadmap.length}
                        </span>
                      </div>
                      <h4 className="text-xl font-black text-[#0f172a] mb-4 tracking-tight leading-tight group-hover:text-[#0081C9] transition-colors">
                        {milestone.focus || milestone.title}
                      </h4>
                      <div className="flex items-center gap-2 text-slate-400 mb-6">
                        <Calendar size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">ESTIMATED TIME: {milestone.estimated_time || milestone.duration || '2 WEEKS'}</span>
                      </div>
                      <p className="text-sm text-slate-500 font-bold leading-relaxed mb-4 line-clamp-3">
                        {milestone.description}
                      </p>
                      <button onClick={() => setSelectedStep(milestone)} className="text-[#0081C9] text-[10px] font-black uppercase tracking-widest mb-8 hover:underline">Read Full Deep-Dive</button>
                    </div>
                    <button 
                      onClick={() => {
                        const resource = milestone.resources?.[0];
                        if (resource?.url) {
                          window.open(resource.url, '_blank');
                        } else {
                          const query = encodeURIComponent(`${milestone.focus || milestone.title} study guide`);
                          window.open(`https://www.google.com/search?q=${query}`, '_blank');
                        }
                      }}
                      className="w-full py-4 bg-slate-50 text-[#0081C9] font-black rounded-2xl border border-slate-100 hover:bg-[#EBF7FF] transition-all flex items-center justify-center gap-2"
                    >
                      Study This Step
                      <ExternalLink size={18} />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal for Details */}
        <AnimatePresence>
          {selectedStep && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-12">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={() => setSelectedStep(null)}
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-full"
              >
                <div className="p-10 overflow-y-auto">
                  <div className="flex items-center justify-between mb-8">
                    <span className="px-4 py-2 bg-blue-50 text-[#0081C9] text-[10px] font-black uppercase tracking-widest rounded-full">Technical Deep-Dive</span>
                    <button onClick={() => setSelectedStep(null)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">✕</button>
                  </div>
                  <h3 className="text-3xl font-black text-[#0f172a] mb-4">{selectedStep.focus || selectedStep.title}</h3>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl text-slate-400">
                      <Clock size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{selectedStep.estimated_time || '2 Weeks'}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-8">
                    <div>
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">CONCEPTS & ARCHITECTURE</h5>
                      <p className="text-slate-600 font-bold leading-loose">{selectedStep.description}</p>
                    </div>
                    
                    {selectedStep.mini_project && (
                      <div className="p-8 bg-[#F8FAFC] rounded-3xl border border-slate-100">
                        <h5 className="text-[10px] font-black text-[#0081C9] uppercase tracking-widest mb-3">PRACTICAL VALIDATION (MINI PROJECT)</h5>
                        <p className="text-slate-700 font-black text-sm leading-relaxed">{selectedStep.mini_project}</p>
                      </div>
                    )}

                    <div>
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">RECOMMENDED STUDY RESOURCES</h5>
                      <div className="space-y-3">
                        {(selectedStep.resources || []).map((res: any, i: number) => (
                          <a key={i} href={res.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl hover:border-[#0081C9] transition-all group">
                            <span className="font-bold text-slate-600 group-hover:text-[#0081C9]">{res.name}</span>
                            <ExternalLink size={16} className="text-slate-300 group-hover:text-[#0081C9]" />
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                  <button onClick={() => setSelectedStep(null)} className="px-8 py-4 bg-[#0F172A] text-white font-black rounded-2xl hover:bg-black transition-all">Close Details</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {!roadmap && !loading && (
          <div className="py-20 text-center space-y-6">
            <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto border border-slate-100">
              <Map size={40} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-[#0f172a]">Generate Your Path</h3>
              <p className="text-slate-500 font-bold max-w-sm mx-auto mt-2">Enter your ambition and we'll architect a strategic roadmap to your goal.</p>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default Roadmap;
