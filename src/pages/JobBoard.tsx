import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Briefcase, MapPin, DollarSign, Search, Globe, ChevronLeft, ChevronRight, ExternalLink, AlertCircle, Building2, Timer, Bookmark, ArrowRight, Filter, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import PageShell from '../components/PageShell';

const JobBoard = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== 'undefined') {
      const match = window.location.hash.match(/[?&]search=([^&]*)/);
      if (match) return decodeURIComponent(match[1]);
    }
    return '';
  });
  const [country, setCountry] = useState('us');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchType, setSearchType] = useState<'browse' | 'search'>(() => {
    if (typeof window !== 'undefined') {
      const match = window.location.hash.match(/[?&]search=([^&]*)/);
      if (match && match[1]) return 'search';
    }
    return 'browse';
  });

  const COUNTRIES = [
    { code: 'us', name: 'United States' },
    { code: 'gb', name: 'United Kingdom' },
    { code: 'in', name: 'India' },
    { code: 'ca', name: 'Canada' },
    { code: 'au', name: 'Australia' },
    { code: 'de', name: 'Germany' },
    { code: 'fr', name: 'France' },
    { code: 'br', name: 'Brazil' },
    { code: 'it', name: 'Italy' },
    { code: 'mx', name: 'Mexico' },
    { code: 'nl', name: 'Netherlands' },
    { code: 'nz', name: 'New Zealand' },
    { code: 'pl', name: 'Poland' },
    { code: 'sg', name: 'Singapore' },
    { code: 'za', name: 'South Africa' },
    { code: 'at', name: 'Austria' },
    { code: 'be', name: 'Belgium' },
    { code: 'ch', name: 'Switzerland' },
  ];

  const pageSize = 12;

  const fetchJobs = async (page: number = 1, isSearch: boolean = false) => {
    try {
      setLoading(true);
      setError('');
      let url = `/api/jobs?source=all&country=${country}&page=${page}&limit=${pageSize}`;
      if (isSearch && searchQuery.trim()) {
        url = `/api/jobs/search?source=all&keywords=${encodeURIComponent(searchQuery)}&country=${country}&page=${page}&limit=${pageSize}`;
      }
      const res = await axios.get(url);
      setJobs(res.data.jobs || []);
      setTotalJobs(res.data.total || res.data.jobs?.length || 0);
      setCurrentPage(page);
    } catch (err: any) {
      setError('Failed to load jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchType === 'search' && searchQuery.trim()) {
      fetchJobs(1, true);
    } else {
      fetchJobs(1, false);
    }
  }, [country, searchType]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchType('search');
    fetchJobs(1, true);
  };

  const handleApply = async (job: any) => {
    if (!user?.id) {
      setError('Please log in to apply for jobs');
      return;
    }

    try {
      if (job.external_id && !job.is_local) {
        try {
          const syncRes = await axios.post('/api/jobs/sync-to-db', { jobs: [job] });
          const rawId = syncRes.data.ids?.[0];
          const savedId = typeof rawId === 'object' ? (rawId.id || rawId.rowid) : rawId;
          const applyId = savedId || job.external_id;
          await axios.post(`/api/jobs/${applyId}/apply`, { userId: user.id });
        } catch (syncErr: any) {
          await axios.post(`/api/jobs/${job.external_id}/apply`, { userId: user.id });
        }
      } else {
        const jobId = job.id;
        await axios.post(`/api/jobs/${jobId}/apply`, { userId: user.id });
      }

      setSuccessMessage('Application recorded! Redirecting...');
      setTimeout(() => {
        if (job.external_url) {
          window.open(job.external_url, '_blank');
        }
        setSuccessMessage('');
      }, 1000);
    } catch (err: any) {
      console.error('Failed to apply:', err);
      if (job.external_url) {
        window.open(job.external_url, '_blank');
      }
    }
  };

  return (
    <PageShell title="Job Board" subtitle="Discover high-impact opportunities worldwide">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Search Interface */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 p-10">
          <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input type="text" placeholder="Job title or keywords..." className="w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-[#0081C9] outline-none font-bold" value={searchQuery} onChange={e => {
                setSearchQuery(e.target.value);
                if (!e.target.value.trim()) setSearchType('browse');
              }} />
            </div>
            <div className="lg:w-48 relative">
              <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select value={country} onChange={e => setCountry(e.target.value)} className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold appearance-none">
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
            <button type="submit" className="px-10 py-4 bg-[#0081C9] text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-[#0070B0] transition-all">
              Find Jobs
            </button>
          </form>
          <div className="mt-6 flex items-center justify-between">
            <span className="px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {totalJobs.toLocaleString()} POSITIONS AVAILABLE
            </span>
            {successMessage && <span className="text-emerald-500 text-xs font-bold animate-pulse">{successMessage}</span>}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 text-xs font-bold flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-[32px] border border-slate-100 p-8 h-64 animate-pulse">
                <div className="h-6 w-2/3 bg-slate-100 rounded-full mb-4"></div>
                <div className="h-4 w-1/2 bg-slate-50 rounded-full mb-10"></div>
                <div className="h-12 bg-slate-50 rounded-2xl"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job: any, i: number) => (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} key={i} className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 hover:border-[#0081C9]/30 transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2 py-0.5 bg-blue-50 text-[#0081C9] text-[8px] font-black uppercase tracking-widest rounded">
                      {job.is_local ? 'Partner Posting' : 'Adzuna Verified'}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-[#0f172a] mb-2 group-hover:text-[#0081C9] transition-colors line-clamp-2">{job.title}</h3>
                  <div className="flex items-center gap-2 text-slate-400 mb-6">
                    <Building2 size={14} />
                    <span className="text-xs font-bold">{job.company}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-8">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl text-[10px] font-bold text-slate-500">
                      <MapPin size={12} /> {job.location}
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl text-[10px] font-bold text-slate-500">
                      <DollarSign size={12} /> {job.salary_range || 'Competitive'}
                    </div>
                  </div>
                </div>
                <button onClick={() => handleApply(job)} className="w-full py-4 bg-[#0F172A] text-white font-black rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all">
                  Initialize Application
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalJobs > pageSize && (
          <div className="flex justify-center items-center gap-4 pt-10">
            <button onClick={() => fetchJobs(currentPage - 1, searchType === 'search')} disabled={currentPage === 1} className="p-4 bg-white border border-slate-100 rounded-2xl disabled:opacity-30">
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-black text-[#0f172a]">Page {currentPage}</span>
            <button onClick={() => fetchJobs(currentPage + 1, searchType === 'search')} disabled={currentPage * pageSize >= totalJobs} className="p-4 bg-white border border-slate-100 rounded-2xl disabled:opacity-30">
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default JobBoard;
