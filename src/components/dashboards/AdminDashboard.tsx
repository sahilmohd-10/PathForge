import React from 'react';
import { Users, Briefcase, TrendingUp, ShieldAlert, Activity, Globe, Zap, Database } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { motion } from 'framer-motion';

const AdminDashboard = ({ stats }: any) => {
  const userDist = [
    { name: 'Students', value: stats?.students || 0, color: '#6366f1' },
    { name: 'Recruiters', value: stats?.recruiters || 0, color: '#f59e0b' },
    { name: 'Admins', value: stats?.admins || 0, color: '#10b981' },
  ];

  return (
    <div className="space-y-10 pb-20">
      <header>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">System Infrastructure</h2>
        <p className="text-slate-500 font-medium mt-1">Global platform monitoring and administrative control.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Registry" value={(stats?.students || 0) + (stats?.recruiters || 0) + (stats?.admins || 0)} icon={<Users size={20} />} color="indigo" />
        <StatCard title="Active Requisitions" value={stats?.jobs || 0} icon={<Briefcase size={20} />} color="amber" />
        <StatCard title="Transmission Flow" value={stats?.applications || 0} icon={<Activity size={20} />} color="emerald" />
        <StatCard title="System Integrity" value={stats?.systemAlerts || 0} icon={<ShieldAlert size={20} />} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Distribution */}
        <div className="glass-card p-8">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10 flex items-center gap-2">
             <Globe size={14} /> Global User Distribution
          </h3>
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {userDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">{userDist.reduce((a, b) => a + b.value, 0)}</span>
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Profiles</span>
            </div>
          </div>
          <div className="flex justify-center gap-8 mt-8">
            {userDist.map((item) => (
              <div key={item.name} className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* System Load / Activity */}
        <div className="glass-card p-8">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10 flex items-center gap-2">
             <Zap size={14} /> Platform Latency & Activity
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.platformActivity || [
                { name: 'Mon', users: 0 }, { name: 'Tue', users: 0 }, { name: 'Wed', users: 0 },
                { name: 'Thu', users: 0 }, { name: 'Fri', users: 0 }, { name: 'Sat', users: 0 },
                { name: 'Sun', users: 0 },
              ]}>
                <defs>
                   <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                   </linearGradient>
                </defs>
                <Tooltip 
                   contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={4} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg"><Database size={14} /></div>
                <p className="text-[10px] font-bold text-slate-500">Database Cluster: <span className="text-emerald-600">Optimal</span></p>
             </div>
             <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Live Feed</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: any) => {
  const colors: any = {
    indigo: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 ring-indigo-500/20',
    amber: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 ring-amber-500/20',
    emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 ring-emerald-500/20',
    rose: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 ring-rose-500/20',
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="glass-card p-6 flex items-center group transition-all"
    >
      <div className={`p-4 rounded-2xl mr-5 ring-1 ${colors[color]} group-hover:scale-110 transition-transform duration-500`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{value}</p>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;