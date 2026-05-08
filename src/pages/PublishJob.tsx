import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import PageShell from '../components/PageShell';
import { Briefcase, Send, Loader2, CheckCircle2, AlertCircle, Building2, MapPin, DollarSign, FileText, Zap, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const PublishJob = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    salary_range: '',
    type: 'Full-time',
    description: '',
    requirements: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Create requirements array from comma separated string
      const requirementsArray = formData.requirements.split(',').map(s => s.trim()).filter(s => s !== '');
      
      await axios.post('/api/jobs', {
        ...formData,
        requirements: JSON.stringify(requirementsArray),
        posted_by: user?.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(true);
      setFormData({
        title: '',
        company: '',
        location: '',
        salary_range: '',
        type: 'Full-time',
        description: '',
        requirements: ''
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to publish job.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell title="Publish Opportunity" subtitle="Post a new position to the PathForge talent network">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Zap size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#0f172a]">New Job Posting</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Enterprise Talent Acquisition</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex ml-1">Job Title</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Senior Frontend Engineer" 
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-[#0081C9] outline-none transition-all font-bold"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex ml-1">Company Name</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Acme Corp" 
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-[#0081C9] outline-none transition-all font-bold"
                    value={formData.company}
                    onChange={e => setFormData({...formData, company: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex ml-1">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Remote / New York" 
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-[#0081C9] outline-none transition-all font-bold"
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex ml-1">Salary Range</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. $120k - $160k" 
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-[#0081C9] outline-none transition-all font-bold"
                    value={formData.salary_range}
                    onChange={e => setFormData({...formData, salary_range: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex ml-1">Job Type</label>
              <div className="flex gap-4">
                {['Full-time', 'Contract', 'Internship'].map(t => (
                  <button 
                    key={t}
                    type="button"
                    onClick={() => setFormData({...formData, type: t})}
                    className={`flex-1 py-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${formData.type === t ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-600/30'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex ml-1">Description</label>
              <textarea 
                required
                rows={4}
                placeholder="Detailed job description and day-to-day responsibilities..." 
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-[#0081C9] outline-none transition-all font-bold resize-none"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex ml-1">Requirements (Comma Separated)</label>
              <input 
                type="text" 
                required
                placeholder="React, Node.js, AWS, TypeScript..." 
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-[#0081C9] outline-none transition-all font-bold"
                value={formData.requirements}
                onChange={e => setFormData({...formData, requirements: e.target.value})}
              />
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-5 bg-[#0081C9] text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 hover:bg-[#0070B0] transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                {loading ? 'Publishing...' : 'Publish Opportunity'}
              </button>
            </div>

            {success && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-emerald-50 border border-emerald-100 rounded-[24px] flex flex-col md:flex-row items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 text-emerald-600 font-bold text-sm">
                  <CheckCircle2 size={20} />
                  Job published successfully to the talent network!
                </div>
                <button 
                  type="button"
                  onClick={() => window.location.hash = '#jobs'}
                  className="px-6 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-2"
                >
                  View on Job Board <ArrowRight size={14} />
                </button>
              </motion.div>
            )}

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 font-bold text-sm">
                <AlertCircle size={20} />
                {error}
              </div>
            )}
          </form>
        </div>
      </div>
    </PageShell>
  );
};

export default PublishJob;
