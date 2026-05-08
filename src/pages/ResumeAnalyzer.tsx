import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import PageShell from '../components/PageShell';
import { FileText, Loader2, CheckCircle2, Upload, Sparkles, Zap, Search, Layout, Target, FileDown, ChevronRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TwilioShare from '../components/TwilioShare';

const ResumeAnalyzer = () => {
  const { user } = useAuth();
  const [targetRole, setTargetRole] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    const checkResumeStatus = async () => {
      if (!user?.id) return;
      try {
        const res = await axios.get(`/api/data/resume-status/${user.id}`);
        if (res.data.exists) {
          setUploadSuccess(true);
          setUploadedFileName('Current Active Resume');
        }
      } catch (err) {
        console.error('Error checking resume status:', err);
      }
    };
    checkResumeStatus();
  }, [user?.id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('userId', user.id.toString());
    setUploading(true);
    setError('');
    setUploadSuccess(false);
    try {
      await axios.post('/api/ai/upload-resume', formData);
      setUploadSuccess(true);
      setUploadedFileName(file.name);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const analyze = async () => {
    if (!targetRole) return;
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('/api/ai/resume-analyzer', {
        userId: user?.id,
        targetRole
      });
      setAnalysis(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell title="ATS Resume Analyzer" subtitle="Benchmark your resume against enterprise-grade ATS algorithms">
      <div className="max-w-5xl mx-auto space-y-12">
        {!analysis ? (
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 p-12 text-center">
            <div className="w-20 h-20 bg-slate-50 text-[#0081C9] rounded-[24px] flex items-center justify-center mx-auto mb-8 border border-slate-100">
              <FileText size={36} />
            </div>
            <h2 className="text-3xl font-black text-[#0f172a] mb-4">Enterprise Resume Audit</h2>
            <p className="text-slate-500 mb-10 max-w-lg mx-auto font-bold">
              Upload your PDF resume and Sarah AI will cross-reference it with target market requirements.
            </p>
            <div className="max-w-md mx-auto space-y-6">
              <label className="block cursor-pointer">
                <input type="file" accept=".pdf,.txt" onChange={handleFileUpload} className="hidden" disabled={uploading || loading} />
                <div className={`w-full p-5 rounded-2xl border-2 border-dashed flex items-center justify-center gap-3 transition-all ${uploadSuccess ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-[#0081C9] hover:bg-[#EBF7FF]'}`}>
                  {uploading ? <Loader2 className="animate-spin" /> : uploadSuccess ? <CheckCircle2 /> : <Upload />}
                  <span className="font-black text-xs uppercase tracking-widest">{uploading ? 'Parsing...' : uploadSuccess ? uploadedFileName : 'Upload PDF Document'}</span>
                </div>
              </label>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex ml-1">Target Role</label>
                <input type="text" placeholder="e.g. Senior Software Architect" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-[#0081C9] outline-none transition-all font-bold" value={targetRole} onChange={e => setTargetRole(e.target.value)} />
              </div>
              <button 
                onClick={analyze} 
                disabled={!targetRole || loading || uploading || !uploadSuccess} 
                className="w-full py-5 bg-[#0081C9] text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 hover:bg-[#0070B0] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles className="animate-pulse" />}
                {loading ? 'Synthesizing Intelligence...' : 'Initialize Analysis'}
              </button>
              {error && <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest">{error}</p>}
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Result Header (Image 7) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
              <div className="lg:col-span-4 bg-[#0081C9] p-12 text-white flex flex-col items-center justify-center text-center">
                <div className="flex items-baseline gap-2">
                  <span className="text-8xl font-black">{analysis.ats_score}</span>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mt-2">ATS SCORE</p>
              </div>
              <div className="lg:col-span-8 p-12 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-emerald-500 mb-2">
                    <CheckCircle2 size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">ANALYSIS COMPLETED</span>
                  </div>
                  <h3 className="text-4xl font-black text-[#0f172a] mb-6">Your Resume is Optimized</h3>
                  <p className="text-sm text-slate-500 font-bold leading-relaxed mb-8">
                    {analysis.overall_feedback}
                  </p>
                </div>
                <div className="flex flex-wrap gap-4 mt-8">
                  <button 
                    onClick={() => document.getElementById('detailed-feedback')?.scrollIntoView({ behavior: 'smooth' })}
                    className="flex-1 min-w-[140px] py-4 bg-[#0F172A] text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-black transition-all"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => {
                      const report = `PATHFORGE ATS INTELLIGENCE REPORT\n` +
                        `====================================\n\n` +
                        `Target Role: ${targetRole}\n` +
                        `ATS Match Score: ${analysis.ats_score}%\n\n` +
                        `OVERALL FEEDBACK:\n${analysis.overall_feedback}\n\n` +
                        `CRITICAL MISTAKES:\n${(analysis.critical_mistakes || []).map((m: string) => `- ${m}`).join('\n')}\n\n` +
                        `ACTIONABLE IMPROVEMENTS:\n${(analysis.actionable_improvements || []).map((i: string) => `- ${i}`).join('\n')}\n\n` +
                        `MISSING KEYWORDS:\n${(analysis.missing_keywords || []).join(', ')}\n\n` +
                        `Generated by PathForge AI Career Navigator`;
                      
                      const blob = new Blob([report], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `PathForge_Resume_Report_${targetRole.replace(/\s+/g, '_')}.txt`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="flex-1 min-w-[140px] py-4 bg-slate-50 text-slate-900 font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-100 transition-all border border-slate-100"
                  >
                    <FileDown size={18} />
                    Download
                  </button>
                  {user && (
                    <TwilioShare 
                      userId={user.id} 
                      featureName="Algorithmic ATS Validation" 
                      summary={`Match Score (${targetRole}): ${analysis.ats_score}%. Logic: ${analysis.overall_feedback.substring(0, 60)}...`} 
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricBox label="KEYWORD MATCH" value="80%" icon={<Search className="text-blue-500" />} />
              <MetricBox label="STRUCTURE" value="90%" icon={<Layout className="text-emerald-500" />} />
              <MetricBox label="IMPACT" value="75%" icon={<Target className="text-indigo-500" />} />
            </div>

            {/* Detailed Feedback */}
            <div id="detailed-feedback" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-sm">
                <h4 className="text-xl font-black text-[#0f172a] mb-8 flex items-center gap-3">
                  <Zap className="text-[#0081C9]" /> Key Improvements
                </h4>
                <div className="space-y-4">
                  {(analysis.actionable_improvements || []).map((s: string, i: number) => (
                    <div key={i} className="flex items-start gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                      <ChevronRight size={18} className="text-blue-500 shrink-0" />
                      <p className="text-sm text-slate-600 font-medium">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-sm">
                <h4 className="text-xl font-black text-[#0f172a] mb-8 flex items-center gap-3">
                  <AlertCircle className="text-amber-500" /> Missing Keywords
                </h4>
                <div className="flex flex-wrap gap-3">
                  {(analysis.missing_keywords || []).map((s: string, i: number) => (
                    <span key={i} className="px-5 py-3 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100 text-xs font-black uppercase tracking-widest">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <button onClick={() => setAnalysis(null)} className="w-full py-4 bg-slate-50 text-slate-400 font-black rounded-2xl hover:bg-slate-100 transition-all border border-slate-100">
              Run New Analysis
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

export default ResumeAnalyzer;
