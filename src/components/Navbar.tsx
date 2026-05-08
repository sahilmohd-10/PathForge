import React from 'react';
import { Search, Bell, User, Settings, LogOut, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const Navbar = () => {
  const { user, logout, token } = useAuth();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);

  const fetchNotifications = async () => {
    if (!user?.id || !token) return;
    try {
      const res = await axios.get(`/api/notifications/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n: any) => !n.is_read).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  React.useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [user?.id, token]);

  const deleteNotification = async (id: number) => {
    try {
      await axios.delete(`/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const markAllRead = async () => {
    try {
      await axios.put(`/api/notifications/user/${user?.id}/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="px-6 h-16 flex items-center justify-between">
        {/* Search Bar */}
        <div className="flex-1 max-w-xl relative group hidden md:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search careers, skills, roadmaps..." 
            className="w-full pl-12 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-600/20 transition-all"
          />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all relative"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-4 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
                >
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Notifications</h3>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllRead}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((n: any) => (
                        <div 
                          key={n.id} 
                          className={`p-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${!n.is_read ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}
                          onClick={() => {
                            deleteNotification(n.id);
                            setShowNotifications(false);
                            const title = n.title.toLowerCase();
                            if (title.includes('interview')) window.location.hash = '#mockinterview';
                            else if (title.includes('ats') || title.includes('resume')) window.location.hash = '#resume';
                            else if (title.includes('talent') || title.includes('career engine')) window.location.hash = '#career';
                            else if (title.includes('roadmap') || title.includes('acceleration')) window.location.hash = '#roadmap';
                            else if (title.includes('asset') || title.includes('portfolio') || title.includes('project')) window.location.hash = '#portfolio';
                          }}
                        >
                          <div className="flex gap-3">
                            <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                              n.type === 'success' ? 'bg-emerald-500' : 
                              n.type === 'warning' ? 'bg-amber-500' :
                              n.type === 'error' ? 'bg-rose-500' : 'bg-indigo-500'
                            }`} />
                            <div className="flex-1">
                              <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">{n.title}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{n.message}</p>
                              <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-2 font-medium uppercase tracking-tighter">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-10 text-center">
                        <Bell className="mx-auto h-8 w-8 text-slate-200 dark:text-slate-700 mb-3" />
                        <p className="text-xs font-bold text-slate-400">All caught up!</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>

          <div className="flex items-center gap-3 pl-2 group cursor-pointer relative">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">{user?.fullName || 'User'}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.15em]">{user?.role || 'Member'}</p>
            </div>
            
            <div className="relative">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="h-10 w-10 rounded-xl object-cover ring-2 ring-indigo-500/10 group-hover:ring-indigo-500/30 transition-all" />
              ) : (
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-500/20">
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
