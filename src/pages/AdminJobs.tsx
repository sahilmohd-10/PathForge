import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PageShell from '../components/PageShell';
import { Briefcase, Trash2, Search, Filter, AlertCircle, Loader2, CheckCircle2, Building2, MapPin, ExternalLink, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminJobs = () => {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState<'all' | 'local' | 'adzuna'>('all');

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/jobs?source=all&limit=100');
      setJobs(res.data.jobs || []);
    } catch (err: any) {
      setError('Failed to load jobs for management.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDelete = async (jobId: string) => {
    if (!window.confirm('Are you absolutely sure you want to delete this job? This will also delete all associated applications.')) return;
    
    try {
      await axios.delete(`/api/admin/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobs(jobs.filter(j => j.id !== jobId && j.external_id !== jobId));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete job.');
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         job.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterSource === 'local') return matchesSearch && job.is_local;
    if (filterSource === 'adzuna') return matchesSearch && !job.is_local;
    return matchesSearch;
  });

  return (
    <PageShell title="Job Infrastructure Management" subtitle="Administrative control over global and local job listings">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Admin Controls */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 p-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Search jobs by title or company..." 
                className="w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-[#0081C9] outline-none font-bold"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="lg:w-64 flex gap-2">
              <select 
                value={filterSource} 
                onChange={e => setFilterSource(e.target.value as any)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold appearance-none"
              >
                <option value="all">All Sources</option>
                <option value="local">Local Only</option>
                <option value="adzuna">Adzuna Only</option>
              </select>
            </div>
            <button 
              onClick={fetchJobs}
              className="px-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 text-xs font-bold flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-[#0081C9]" size={48} />
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Auditing Job Tables...</p>
          </div>
        ) : (
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Job Details</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Source</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredJobs.map((job) => (
                  <tr key={job.id || job.external_id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-6">
                      <div>
                        <p className="text-sm font-black text-[#0f172a]">{job.title}</p>
                        <p className="text-xs font-bold text-slate-400 flex items-center gap-1 mt-1">
                          <Building2 size={12} /> {job.company}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${job.is_local ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                        {job.is_local ? 'Local DB' : 'External'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
                        <MapPin size={12} /> {job.location}
                      </p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        {job.external_url && (
                          <a 
                            href={job.external_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
                          >
                            <ExternalLink size={16} />
                          </a>
                        )}
                        <button 
                          onClick={() => handleDelete(job.id || job.external_id)}
                          className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredJobs.length === 0 && (
              <div className="py-20 text-center">
                <ShieldAlert className="mx-auto text-slate-200 mb-4" size={48} />
                <p className="text-slate-400 font-bold">No jobs found matching your criteria.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default AdminJobs;
