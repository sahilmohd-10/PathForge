import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Search, ChevronRight, TrendingUp, DollarSign, Briefcase, Download, Plus, Target, Zap, Activity, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import PageShell from '../components/PageShell';

const DataMatch: React.FC = () => {
  const { user, token } = useAuth();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (token && user?.id) {
      fetchMatches();
    }
  }, [token, user?.id]);

  const getHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'x-user-id': user?.id.toString() || ''
  });

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/data-match', { headers: getHeaders() });
      if (Array.isArray(response.data)) {
        setMatches(response.data.map((match: any) => ({
          ...match,
          full_name: match.full_name || 'Unknown Student',
          career_path: match.career_path || 'Software Engineer',
          confidence_score: match.confidence_score ?? 75,
          market_fit_score: match.market_fit_score ?? 70,
          growth_potential: match.growth_potential ?? 75,
          churn_risk: match.churn_risk ?? 25,
          salary_min: match.salary_min ?? 65000,
          salary_max: match.salary_max ?? 120000
        })));
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMatches = matches.filter(match =>
    (match.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     match.career_path?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterRole === 'all' || match.career_path?.toLowerCase().includes(filterRole.toLowerCase()))
  );

  return (
    <PageShell title="Career Data Match" subtitle="AI-predicted student career metrics and performance signals">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Actions Row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex gap-3">
            <button onClick={fetchMatches} className="px-6 py-3 bg-[#0F172A] text-white font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all">
              <Plus size={14} /> Generate Scores
            </button>
            <button className="px-6 py-3 bg-slate-50 text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-100 transition-all border border-slate-100">
              <Download size={14} /> Export CSV
            </button>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Search students..." className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-xl font-bold text-sm outline-none focus:border-[#0081C9]" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard label="TOTAL ANALYZED" value={matches.length} icon={<Activity className="text-blue-500" />} />
          <MetricCard label="AVG MARKET FIT" value={`${Math.round(matches.reduce((acc, m) => acc + (m.market_fit_score || 0), 0) / (matches.length || 1))}%`} icon={<Target className="text-[#0081C9]" />} />
          <MetricCard label="AVG GROWTH" value={`${Math.round(matches.reduce((acc, m) => acc + (m.growth_potential || 0), 0) / (matches.length || 1))}%`} icon={<TrendingUp className="text-emerald-500" />} />
          <MetricCard label="HIGH RISK" value={matches.filter(m => m.churn_risk > 25).length} icon={<AlertCircle className="text-amber-500" />} />
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Profile</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Path</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Market Fit</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Confidence</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Salary Estimate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={5} className="px-8 py-20 text-center"><Loader2 className="animate-spin mx-auto text-slate-300" /></td></tr>
                ) : filteredMatches.map((match, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#0081C9] text-white rounded-xl flex items-center justify-center font-black text-sm">
                          {match.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-[#0f172a]">{match.full_name}</p>
                          <p className="text-[10px] font-bold text-slate-400">{match.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <Briefcase size={14} className="text-slate-400" />
                        <span className="text-xs font-black text-slate-600">{match.career_path}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                        match.market_fit_score > 80 ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-[#0081C9]'
                      }`}>
                        {match.market_fit_score}%
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className="text-xs font-black text-slate-900">{match.confidence_score}%</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-1 text-xs font-black text-slate-600">
                        <DollarSign size={12} className="text-slate-400" />
                        {Math.round(match.salary_min / 1000)}k - {Math.round(match.salary_max / 1000)}k
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

const MetricCard = ({ label, value, icon }: any) => (
  <div className="bg-white rounded-[24px] p-8 border border-slate-100 shadow-sm flex items-center gap-6">
    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-50">
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-[#0f172a]">{value}</p>
    </div>
  </div>
);

export default DataMatch;
