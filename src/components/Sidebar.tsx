import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Compass, 
  Route, 
  FileSearch, 
  Video, 
  Github, 
  Briefcase, 
  User, 
  LogOut,
  X,
  PlusSquare,
  Users,
  Database
} from 'lucide-react';

const Sidebar = ({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen,
}: {
  activeTab: string;
  setActiveTab: (t: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}) => {
  const { logout, user } = useAuth();

  const navItems = user?.role === 'admin' ? [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Manage Users', icon: Users },
    { id: 'adminjobs', label: 'Manage Jobs', icon: Briefcase },
    { id: 'database', label: 'Database Audit', icon: Database },
    { id: 'profile', label: 'Profile', icon: User },
  ] : user?.role === 'recruiter' ? [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'publishjob', label: 'Publish Job', icon: PlusSquare },
    { id: 'jobs', label: 'Job Board', icon: Briefcase },
    { id: 'profile', label: 'Profile', icon: User },
  ] : [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'career', label: 'Career Engine', icon: Compass },
    { id: 'roadmap', label: 'Roadmap', icon: Route },
    { id: 'resume', label: 'Resume Analyzer', icon: FileSearch },
    { id: 'mockinterview', label: 'Interviews', icon: Video },
    { id: 'portfolio', label: 'Portfolio', icon: Github },
    { id: 'jobs', label: 'Job Board', icon: Briefcase },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-500 md:hidden ${mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileOpen(false)}
      />

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}
      >
        {/* Header/Logo */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0081C9] rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20">
              P
            </div>
            <div>
              <h1 className="text-xl font-black text-[#0f172a] leading-none">PathForge</h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">AI CAREER ENGINE</p>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="md:hidden p-2 text-slate-400 hover:text-slate-900 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  window.location.hash = item.id;
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#EBF7FF] text-[#0081C9]'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Profile Card */}
        <div className="p-4 border-t border-slate-50">
          <div className="flex items-center gap-3 p-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                  <User size={20} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-slate-900 truncate">{user?.fullName || 'User Name'}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.role || 'Student'}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#FFF1F1] text-[#FF4D4D] text-sm font-black rounded-xl hover:bg-[#FFE4E4] transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;