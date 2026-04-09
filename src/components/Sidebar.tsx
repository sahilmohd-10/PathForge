import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Briefcase, User, MessageSquare, LogOut, TrendingUp, Users, Database, Table, X, Newspaper } from 'lucide-react';

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

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['student', 'recruiter', 'admin'] },
    { id: 'career', label: 'Career Engine', icon: TrendingUp, roles: ['student'] },
    { id: 'jobs', label: 'Job Board', icon: Briefcase, roles: ['student', 'recruiter', 'admin'] },
    { id: 'posts', label: 'Posts', icon: Newspaper, roles: ['student', 'recruiter'] },
    { id: 'network', label: 'Network', icon: MessageSquare, roles: ['student', 'recruiter'] },
    { id: 'users', label: 'User Management', icon: Users, roles: ['admin'] },
    { id: 'database', label: 'Database', icon: Database, roles: ['admin'] },
    { id: 'datamatch', label: 'Data Match', icon: Table, roles: ['admin'] },
    { id: 'profile', label: 'Profile', icon: User, roles: ['student', 'recruiter', 'admin'] },
  ].filter(item => item.roles.includes(user?.role || 'student'));

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileOpen(false)}
      />

      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-full transform overflow-y-auto bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out md:static md:w-64 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 shadow-xl md:shadow-none`}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg text-white font-bold text-xl">
              P
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">PathForge</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">AI Career Engine</p>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="md:hidden p-2 text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 space-y-1.5 py-6">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  window.location.hash = item.id;
                  setMobileOpen(false);
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                  isActive 
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 shadow-sm border border-primary-100 dark:border-primary-800' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 group-hover:text-primary-500'} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="mt-auto p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3 p-2 mb-4">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="avatar" className="h-10 w-10 rounded-lg object-cover shadow-sm border border-slate-200 dark:border-slate-700" />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 flex items-center justify-center font-bold">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.fullName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 rounded-xl transition-all"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
