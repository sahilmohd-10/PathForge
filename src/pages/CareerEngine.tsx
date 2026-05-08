import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  RefreshCw, 
  Upload, 
  Search, 
  ArrowRight, 
  Zap, 
  Target, 
  TrendingUp, 
  DollarSign, 
  Sparkles,
  ChevronRight,
  BookOpen,
  Activity,
  Lightbulb,
  FileText,
  Briefcase,
  GraduationCap,
  Globe,
  ExternalLink,
  Code
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import PageShell from '../components/PageShell';
import TwilioShare from '../components/TwilioShare';

interface ResumeData {
  personalInfo: {
    currentRole: string;
    careerGoal: string;
  };
  experienceSummary: string;
  skills: string;
  tools: string;
  educationLevel: string;
  semester: string;
  experienceLevel: string;
}

interface UnifiedResults {
  resumeScore: number;
  overallImprovements: string[];
  mlPredictions: any;
  predictedRole: string;
  skillGaps: { missing_skill: string; topics_to_cover: string[] }[];
  recommendedCourses: { name: string; platform: string; duration: string; link?: string }[];
  eligiblePositions?: { position: string; other_skills_required: string[] }[];
  jobDescription: string;
}

const getSemesterOptions = (educationLevel: string) => {
  if (!educationLevel) return [];
  let maxSemesters = 0;
  if (educationLevel === 'B.Tech') maxSemesters = 8;
  else if (educationLevel === 'B.Sc IT' || educationLevel === 'BCA') maxSemesters = 6;
  else if (educationLevel === 'M.Tech' || educationLevel === 'MCA') maxSemesters = 4;
  if (maxSemesters === 0) return [{ value: 'N/A', label: 'Not Applicable (N/A)' }];
  const options = [];
  for (let i = 1; i <= maxSemesters; i++) {
    const suffix = i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th';
    options.push({ value: `${i}${suffix} Semester`, label: `${i}${suffix} Semester` });
  }
  options.push({ value: 'N/A', label: 'Not Applicable (N/A)' });
  return options;
};

const CareerEngine = () => {
  const { user } = useAuth();
  const [resumeData, setResumeData] = useState<ResumeData>({
    personalInfo: { currentRole: '', careerGoal: '' },
    experienceSummary: '',
    skills: '',
    tools: '',
    educationLevel: '',
    semester: '',
    experienceLevel: '',
  });

  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [unifiedResults, setUnifiedResults] = useState<UnifiedResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('userId', user.id.toString());
    setUploading(true);
    setError(null);
    try {
      const res = await axios.post('/api/ai/upload-resume', formData);
      const parsed = res.data.parsed;
      setResumeData(prev => ({
        ...prev,
        personalInfo: {
          currentRole: parsed.target_career || prev.personalInfo.currentRole,
          careerGoal: parsed.career_goal || parsed.suggestions || prev.personalInfo.careerGoal
        },
        experienceSummary: parsed.bio || prev.experienceSummary,
        skills: Array.isArray(parsed.skills) ? parsed.skills.join(', ') : prev.skills,
        experienceLevel: parsed.experience_years ? (parsed.experience_years === 0 ? 'Fresher' : parsed.experience_years <= 3 ? '1-3 years' : parsed.experience_years <= 5 ? '3-5 years' : '5+ years') : prev.experienceLevel,
        educationLevel: parsed.education || prev.educationLevel
      }));
    } catch (err: any) {
      setError('Failed to parse resume. Please fill manually.');
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!user) return setError('Please log in.');
    if (!resumeData.personalInfo.currentRole.trim() || !resumeData.skills.trim()) return setError('Please fill mandatory fields.');
    setAnalyzing(true);
    setError(null);
    try {
      const resumeText = `${resumeData.personalInfo.currentRole} ${resumeData.personalInfo.careerGoal} ${resumeData.experienceSummary} ${resumeData.skills} ${resumeData.tools} ${resumeData.educationLevel} ${resumeData.semester}`;
      const profileData = {
        personalInfo: resumeData.personalInfo,
        experience: resumeData.experienceSummary,
        skills: resumeData.skills.split(',').map(s => s.trim()).filter(Boolean),
        tools: resumeData.tools.split(',').map(s => s.trim()).filter(Boolean),
        educationLevel: resumeData.educationLevel,
        semester: resumeData.semester,
        experienceLevel: resumeData.experienceLevel
      };
      const res = await axios.post('/api/ai/unified-analysis', { userId: user.id, resumeText, profileData });
      setUnifiedResults(res.data);
    } catch (err: any) {
      setError('Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <PageShell title="AI Career Engine" subtitle="Comprehensive AI & ML trajectory analysis powered by PathForge intelligence">
      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold">
          {error}
        </div>
      )}

      {!unifiedResults ? (
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="text-[#0081C9]" size={24} />
                <h3 className="text-xl font-black text-[#0f172a]">Career Snapshot</h3>
              </div>
              <div className="relative">
                <input type="file" id="resume-up" className="hidden" onChange={handleFileUpload} />
                <label htmlFor="resume-up" className="flex items-center gap-2 px-4 py-2 bg-[#EBF7FF] text-[#0081C9] text-xs font-black uppercase tracking-widest rounded-xl cursor-pointer hover:bg-[#D6EFFF] transition-all">
                  {uploading ? <RefreshCw className="animate-spin" size={14} /> : <Upload size={14} />}
                  Auto-fill from Resume
                </label>
              </div>
            </div>

            <div className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">CURRENT / DESIRED ROLE *</label>
                  <input
                    type="text"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#0081C9] transition-all"
                    placeholder="e.g. Software Engineer, Data Analyst"
                    value={resumeData.personalInfo.currentRole}
                    onChange={(e) => setResumeData({ ...resumeData, personalInfo: { ...resumeData.personalInfo, currentRole: e.target.value } })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">CAREER GOAL *</label>
                  <input
                    type="text"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#0081C9] transition-all"
                    placeholder="e.g. Build a career in AI / Product Management"
                    value={resumeData.personalInfo.careerGoal}
                    onChange={(e) => setResumeData({ ...resumeData, personalInfo: { ...resumeData.personalInfo, careerGoal: e.target.value } })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">HIGHEST EDUCATION *</label>
                  <select
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#0081C9] appearance-none transition-all"
                    value={resumeData.educationLevel}
                    onChange={(e) => setResumeData({ ...resumeData, educationLevel: e.target.value, semester: '' })}
                  >
                    <option value="">Select Education</option>
                    {['B.Tech', 'B.Sc IT', 'BCA', 'M.Tech', 'MCA', 'Self-taught'].map(opt => <option key={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">SEMESTER (IF APPLICABLE) *</label>
                  <select
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#0081C9] appearance-none transition-all"
                    value={resumeData.semester}
                    onChange={(e) => setResumeData({ ...resumeData, semester: e.target.value })}
                  >
                    <option value="">{resumeData.educationLevel ? 'Select Semester' : 'Select Education First'}</option>
                    {getSemesterOptions(resumeData.educationLevel).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">EXPERIENCE LEVEL *</label>
                  <select
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#0081C9] appearance-none transition-all"
                    value={resumeData.experienceLevel}
                    onChange={(e) => setResumeData({ ...resumeData, experienceLevel: e.target.value })}
                  >
                    <option value="">Select Experience Level</option>
                    {['Fresher', 'Junior (1-3y)', 'Mid (3-5y)', 'Senior (5y+)'].map(opt => <option key={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">TECHNICAL SKILLS (COMMA SEPARATED) *</label>
                  <input
                    type="text"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#0081C9] transition-all"
                    value={resumeData.skills}
                    onChange={(e) => setResumeData({ ...resumeData, skills: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">TOOLS / PLATFORMS (COMMA SEPARATED)</label>
                  <input
                    type="text"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#0081C9] transition-all"
                    placeholder="e.g. Git, Docker, Jupyter Notebook, VS Code"
                    value={resumeData.tools}
                    onChange={(e) => setResumeData({ ...resumeData, tools: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">EXPERIENCE SUMMARY *</label>
                  <textarea
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#0081C9] transition-all min-h-[120px]"
                    placeholder="Describe your recent work, projects, or internship impact"
                    value={resumeData.experienceSummary}
                    onChange={(e) => setResumeData({ ...resumeData, experienceSummary: e.target.value })}
                  />
                </div>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="w-full py-5 bg-[#0081C9] text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 hover:bg-[#0070B0] transition-all"
              >
                {analyzing ? <RefreshCw className="animate-spin" /> : <Sparkles />}
                {analyzing ? 'Processing Analysis...' : 'Launch Intelligence Audit'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-10 pb-20">
          {/* Result Card (Image 5) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="lg:col-span-5 bg-[#0081C9] p-12 text-white relative flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-x-10 translate-y-10"></div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-6">RESUME MATCH SCORE</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-8xl font-black">{unifiedResults.resumeScore}</span>
                  <span className="text-4xl font-black opacity-40">/100</span>
                </div>
              </div>
              <div className="mt-12">
                <p className="text-sm font-medium leading-relaxed opacity-90">
                  Evaluation based on market demand and your current trajectory.
                </p>
                <div className="mt-8 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <Sparkles size={20} />
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-7 p-12 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">PREDICTED TARGET ROLE</p>
                <h3 className="text-4xl font-black text-[#4F46E5] mb-6 tracking-tight">{unifiedResults.predictedRole}</h3>
                <p className="text-sm text-slate-600 font-medium leading-relaxed mb-8">
                  {unifiedResults.jobDescription}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="flex-1 py-4 bg-[#0F172A] text-white font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-black transition-all">
                  <Search size={20} />
                  Search Available Jobs
                </button>
                {user && (
                  <TwilioShare 
                    userId={user.id} 
                    featureName="Unified Talent Profiling" 
                    summary={`Readiness: ${unifiedResults.resumeScore}%. Target: ${unifiedResults.predictedRole}. Market Fit: ${unifiedResults.mlPredictions.market_fit_score}%.`} 
                  />
                )}
              </div>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <MetricBox label="MARKET FIT" value={`${unifiedResults.mlPredictions.market_fit_score}%`} icon={<Target size={16} className="text-[#6366F1]" />} />
            <MetricBox label="GROWTH" value={typeof unifiedResults.mlPredictions.growth_potential === 'number' ? `${unifiedResults.mlPredictions.growth_potential}%` : unifiedResults.mlPredictions.growth_potential} icon={<TrendingUp size={16} className="text-[#10B981]" />} />
            <MetricBox label="READINESS" value={`${unifiedResults.resumeScore}%`} icon={<Zap size={16} className="text-[#F59E0B]" />} />
            <MetricBox label="EST. SALARY" value={unifiedResults.mlPredictions.salary_prediction ? `$${(unifiedResults.mlPredictions.salary_prediction.min/1000).toFixed(0)}k - ${(unifiedResults.mlPredictions.salary_prediction.max/1000).toFixed(0)}k` : "60k - 120k"} icon={<DollarSign size={16} className="text-[#10B981]" />} />
          </div>

          {/* Secondary Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-sm">
              <h4 className="text-xl font-black text-[#0f172a] mb-8 flex items-center gap-3">
                <Activity className="text-[#0081C9]" /> Areas of Improvement
              </h4>
              <div className="space-y-4">
                {unifiedResults.overallImprovements.map((tip, i) => (
                  <div key={i} className="flex items-start gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all">
                    <ChevronRight size={18} className="text-blue-500 shrink-0" />
                    <p className="text-sm text-slate-600 font-medium">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-sm">
              <h4 className="text-xl font-black text-[#0f172a] mb-8 flex items-center gap-3">
                <Lightbulb className="text-amber-500" /> Skill Gaps
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {unifiedResults.skillGaps.map((gap, i) => (
                  <div key={i} className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <h5 className="font-black text-sm text-[#0f172a] mb-2">{gap.missing_skill}</h5>
                    <div className="flex flex-wrap gap-1">
                      {gap.topics_to_cover.slice(0, 3).map((t, idx) => (
                        <span key={idx} className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded-md">{t}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* New Sections: Jobs and Courses */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7 bg-white rounded-[32px] p-10 border border-slate-100 shadow-sm">
              <h4 className="text-xl font-black text-[#0f172a] mb-8 flex items-center gap-3">
                <Briefcase className="text-[#0081C9]" /> Top 10 Eligible Positions
              </h4>
              <div className="space-y-4">
                {(unifiedResults.eligiblePositions || []).map((pos, i) => (
                  <div 
                    key={i} 
                    onClick={() => {
                      const query = encodeURIComponent(`${pos.position} jobs`);
                      window.open(`https://www.linkedin.com/jobs/search/?keywords=${query}`, '_blank');
                    }}
                    className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 cursor-pointer transition-all group"
                  >
                    <div>
                      <h5 className="font-black text-[#0f172a] mb-1">{pos.position}</h5>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Required: {pos.other_skills_required.slice(0, 3).join(', ')}
                      </p>
                    </div>
                    <button className="p-3 bg-white text-slate-400 rounded-xl border border-slate-100 group-hover:bg-[#0081C9] group-hover:text-white group-hover:border-[#0081C9] transition-all">
                      <ArrowRight size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-8">
              <div className="bg-[#0F172A] rounded-[32px] p-10 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-x-4 translate-y-4"></div>
                <h4 className="text-xl font-black mb-8 flex items-center gap-3 relative z-10">
                  <GraduationCap className="text-blue-400" /> Learning Accelerators
                </h4>
                <div className="space-y-6 relative z-10">
                  {unifiedResults.recommendedCourses.map((course, i) => (
                    <div key={i} className="flex flex-col gap-2 p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
                      <div className="flex items-start justify-between">
                        <h5 className="font-black text-sm text-blue-200">{course.name}</h5>
                        <a 
                          href={course.link || `https://www.coursera.org/search?query=${encodeURIComponent(course.name)}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-all"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{course.platform}</span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{course.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
                <h4 className="text-sm font-black text-[#0f172a] mb-6 flex items-center gap-2">
                  <Code className="text-[#0081C9]" size={16} /> Tech Stack Benchmark
                </h4>
                
                <div className="h-[250px] w-full mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                      { subject: 'Architecture', A: 85, fullMark: 100 },
                      { subject: 'DevOps', A: 70, fullMark: 100 },
                      { subject: 'Frontend', A: 90, fullMark: 100 },
                      { subject: 'Backend', A: 85, fullMark: 100 },
                      { subject: 'Security', A: 65, fullMark: 100 },
                      { subject: 'Testing', A: 80, fullMark: 100 },
                    ]}>
                      <PolarGrid stroke="#f1f5f9" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                      <Radar
                        name="Skills"
                        dataKey="A"
                        stroke="#0081C9"
                        fill="#0081C9"
                        fillOpacity={0.15}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span>Vector Alignment</span>
                    <span className="text-blue-500">{(unifiedResults.mlPredictions.market_fit_score || 88)}% OPTIMIZED</span>
                  </div>
                  <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${unifiedResults.mlPredictions.market_fit_score || 88}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600" 
                    />
                  </div>
                  <p className="text-[10px] font-medium text-slate-500 leading-relaxed">
                    Your multi-dimensional toolset aligns with {unifiedResults.mlPredictions.market_fit_score || 88}% of industry standards for {unifiedResults.predictedRole}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

const MetricBox = ({ label, value, icon }: any) => (
  <div className="bg-white rounded-[24px] p-8 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
    <div className="mb-4">{icon}</div>
    <h4 className="text-2xl font-black text-[#0f172a] mb-1">{value}</h4>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
  </div>
);

export default CareerEngine;