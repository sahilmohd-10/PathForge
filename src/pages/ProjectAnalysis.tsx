import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import PageShell from '../components/PageShell';
import { Github, Loader2, CheckCircle2, AlertCircle, Sparkles, Code2, Rocket, Globe, Cpu, Zap, Target, Layout, ChevronRight, FileDown, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TwilioShare from '../components/TwilioShare';

const ProjectAnalysis = () => {
  const { user } = useAuth();
  const [githubUrl, setGithubUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [evaluation, setEvaluation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!githubUrl && !portfolioUrl) return;
    setLoading(true);
    try {
      const response = await axios.post('/api/ai/portfolio-evaluation', {
        userId: user?.id,
        githubUrl,
        portfolioUrl
      });
      setEvaluation(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell title="Github Analysis" subtitle="Deep-layer project analysis and repository benchmarking">
      <div className="max-w-6xl mx-auto space-y-12">
        {!evaluation ? (
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 p-12 text-center">
            <div className="w-20 h-20 bg-slate-900 text-white rounded-[24px] flex items-center justify-center mx-auto mb-8 shadow-xl">
              <Github size={36} />
            </div>
            <h2 className="text-3xl font-black text-[#0f172a] mb-4">GitHub Ecosystem Analysis</h2>
            <p className="text-slate-500 mb-10 max-w-lg mx-auto font-bold">
              Our neural engine evaluates code quality, architectural patterns, and proof of work across your repositories.
            </p>
            <div className="max-w-md mx-auto space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex ml-1">GitHub Profile Link</label>
                <div className="relative">
                  <Github className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" placeholder="github.com/your-handle" className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-[#0081C9] outline-none transition-all font-bold" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex ml-1">Live Portfolio Link</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" placeholder="https://yourportfolio.com" className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-[#0081C9] outline-none transition-all font-bold" value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)} />
                </div>
              </div>
              <button onClick={analyze} disabled={(!githubUrl && !portfolioUrl) || loading} className="w-full py-5 bg-[#0081C9] text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 hover:bg-[#0070B0] transition-all">
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                {loading ? 'Synthesizing...' : 'Initialize Code Audit'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Result Header */}
            <div className="grid grid-cols-1 lg:grid-cols-12 bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
              <div className="lg:col-span-4 bg-[#0081C9] p-12 text-white flex flex-col items-center justify-center text-center">
                <div className="flex items-baseline gap-2">
                  <span className="text-8xl font-black">{evaluation.score || 0}</span>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mt-2">AUDIT SCORE</p>
              </div>
              <div className="lg:col-span-8 p-12 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-emerald-500 mb-2">
                    <CheckCircle2 size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">PROJECT ARCHITECTED EVALUATION</span>
                  </div>
                  <h3 className="text-4xl font-black text-[#0f172a] mb-6">Codebase Verified</h3>
                  <p className="text-sm text-slate-500 font-bold leading-relaxed mb-8">
                    {evaluation.feedback}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  <button 
                    onClick={() => document.getElementById('project-showroom')?.scrollIntoView({ behavior: 'smooth' })}
                    className="flex-1 py-4 bg-[#0F172A] text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-black transition-all"
                  >
                    View Project Breakdown
                  </button>
                  <button className="flex-1 py-4 bg-slate-50 text-slate-900 font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-100 transition-all border border-slate-100">
                    <FileDown size={18} />
                    Export Analysis
                  </button>
                  {user && (
                    <TwilioShare 
                      userId={user.id} 
                      featureName="Digital Asset Validation" 
                      summary={`Digital Asset Score: ${evaluation.score}%. Verified Repos: ${evaluation.githubData?.profile?.public_repos || 0}. Feedback: ${evaluation.feedback?.substring(0, 60) || 'Optimization complete'}`} 
                    />
                  )}
                </div>
              </div>
            </div>

             {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <MetricBox label="TOTAL STARS" value={evaluation.githubData?.metrics?.total_stars || 0} icon={<Star size={20} className="text-amber-500" />} />
              <MetricBox label="TOTAL FORKS" value={evaluation.githubData?.metrics?.total_forks || 0} icon={<Github size={20} className="text-slate-500" />} />
              <MetricBox label="EVENT ACTIVITY" value={evaluation.githubData?.metrics?.event_activity_score || 0} icon={<Zap size={20} className="text-blue-500" />} />
              <MetricBox label="REPOS AUDITED" value={evaluation.githubData?.metrics?.top_repos_analyzed || 0} icon={<Target size={20} className="text-emerald-500" />} />
            </div>
 
            {/* Project Showroom */}
            <div id="project-showroom" className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-sm">
              <h4 className="text-2xl font-black text-[#0f172a] mb-10 flex items-center gap-4">
                <Rocket className="text-[#0081C9]" size={28} /> Project Showroom
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {(() => {
                  const aiProjects = (evaluation.projects || []).filter((p: any) => p.name && p.name !== 'Unknown');
                  const githubRepos = (evaluation.githubData?.all_repos || []).map((r: any) => ({
                    name: r.name,
                    overview: r.description || 'No description provided.',
                    tools_used: r.primary_language ? [r.primary_language] : [],
                    stars: r.stars,
                    forks: r.forks,
                    is_raw: true
                  }));
                  
                  return aiProjects.length > 0 ? aiProjects : githubRepos;
                })().slice(0, 15).map((project: any, i: number) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={i} 
                    className="group bg-slate-50 rounded-[28px] p-8 border border-slate-100 hover:border-[#0081C9]/30 hover:bg-white hover:shadow-xl transition-all flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col">
                        <h5 className="text-lg font-black text-[#0f172a] group-hover:text-[#0081C9] transition-colors line-clamp-1">{project.name}</h5>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400"><Star size={10} /> {project.stars || 0}</span>
                          <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400"><Github size={10} /> {project.forks || 0}</span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-[9px] font-black uppercase rounded-full ${
                        project.is_raw ? 'bg-slate-200 text-slate-600' : 'bg-[#0081C9]/10 text-[#0081C9]'
                      }`}>
                        {project.is_raw ? 'Repo Detected' : 'Project Verified'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-bold mb-6 leading-relaxed line-clamp-3">
                      {project.overview}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-auto">
                      {(project.tools_used || []).map((tool: string, idx: number) => (
                        <span key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl text-[10px] font-bold text-slate-600 border border-slate-100">
                          <Cpu size={12} className="text-[#0081C9]" /> {tool}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
                {(!evaluation.projects || evaluation.projects.length === 0) && (!evaluation.githubData?.all_repos || evaluation.githubData.all_repos.length === 0) && (
                  <div className="col-span-full p-12 bg-slate-50 rounded-[32px] text-center border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold">No public repositories found for this account.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-sm">
                <h4 className="text-xl font-black text-[#0f172a] mb-8 flex items-center gap-3">
                  <Zap className="text-[#0081C9]" /> Strategic Strengths
                </h4>
                <div className="space-y-4">
                  {(evaluation.strengths || []).map((s: string, i: number) => (
                    <div key={i} className="flex items-start gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                      <ChevronRight size={18} className="text-blue-500 shrink-0" />
                      <p className="text-sm text-slate-600 font-medium">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-sm">
                <h4 className="text-xl font-black text-[#0f172a] mb-8 flex items-center gap-3">
                  <AlertCircle className="text-amber-500" /> Improvement Vectors
                </h4>
                <div className="space-y-4">
                  {(evaluation.weaknesses || []).map((s: string, i: number) => (
                    <div key={i} className="flex items-start gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                      <ChevronRight size={18} className="text-amber-500 shrink-0" />
                      <p className="text-sm text-slate-600 font-medium">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <button onClick={() => setEvaluation(null)} className="w-full py-4 bg-slate-50 text-slate-400 font-black rounded-2xl hover:bg-slate-100 transition-all border border-slate-100">
              Run New Audit
            </button>
          </div>
        )}
      </div>
    </PageShell>
  );
};

const MetricBox = ({ label, value, icon }: any) => (
  <div className="bg-white rounded-[24px] p-8 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-50">
      {icon}
    </div>
    <h4 className="text-2xl font-black text-[#0f172a] mb-1">{value}</h4>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
  </div>
);

export default ProjectAnalysis;
