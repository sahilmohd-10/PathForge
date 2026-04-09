import React, { useState, useEffect } from 'react';
import { Target, Zap, CheckCircle, Clock, Briefcase, MapPin, Bell, MessageSquare, BookOpen, Brain, Rocket, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const StudentDashboard = ({ profile }: any) => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const unreadNotifications = notifications.filter((notif) => !notif.is_read);
  const unreadCount = unreadNotifications.length;

  const fetchNotifications = async () => {
    if (!user?.id) return;
    try {
      const res = await axios.get(`/api/chat/notifications/${user.id}`);
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const markNotificationsAsRead = async () => {
    if (!user?.id) return;
    try {
      await axios.put(`/api/chat/notifications/${user.id}/read`);
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to mark notifications as read:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appsRes] = await Promise.all([
          axios.get(`/api/jobs/applications/student/${user?.id}`)
        ]);
        setApplications(appsRes.data);
        await fetchNotifications();
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchData();
  }, [user]);

  const readinessScore = profile?.job_readiness_score ?? 0;
  const readinessData = [
    { name: 'Jan', score: Math.max(10, readinessScore - 30) },
    { name: 'Feb', score: Math.max(15, readinessScore - 20) },
    { name: 'Mar', score: Math.max(25, readinessScore - 10) },
    { name: 'Apr', score: readinessScore },
  ];

  const skillData = profile?.skills?.map((s: any) => ({
    name: s.name,
    level: Math.min(100, (s.proficiency_level || 1) * 20)
  })) || [
    { name: 'JavaScript', level: 80 },
    { name: 'React', level: 70 },
    { name: 'SQL', level: 60 },
  ];

  // Personalized recommendations based on readiness score
  const [learningSeconds, setLearningSeconds] = useState(() => {
    if (typeof window !== 'undefined' && user?.id) {
      const stored = localStorage.getItem(`learning_seconds_${user.id}`);
      return stored ? parseInt(stored, 10) : 0;
    }
    return 0;
  });

  useEffect(() => {
    if (!user?.id) return;
    const interval = setInterval(() => {
      setLearningSeconds((prev) => {
        const next = prev + 1;
        localStorage.setItem(`learning_seconds_${user.id}`, next.toString());
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [user?.id]);

  const formatLearningTime = (seconds: number) => {
    if (seconds === 0) return '0 min';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
  };

  const getRecommendations = () => {
    if (readinessScore < 30) {
      return ['Start with Career Engine assessment', 'Complete at least 3 skills', 'Update your profile completely'];
    } else if (readinessScore < 60) {
      return ['Practice interview questions', 'Build a portfolio project', 'Connect with mentors'];
    } else {
      return ['Apply to 5 jobs this week', 'Network with recruiters', 'Polish your resume'];
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-neon-cyan dark:to-neon-teal bg-clip-text text-transparent">Student Dashboard</h2>
        <p className="text-gray-600 dark:text-neon-light/80 font-medium text-lg">
          {profile?.target_career
            ? `Your ${profile.target_career} readiness at a glance.`
            : 'Track your learning progress and job readiness.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Job Readiness" value={`${profile?.job_readiness_score || 0}%`} icon={<Target className="text-primary-600" />} color="primary" />
        <StatCard title="Skills Tracked" value={profile?.skills?.length || 0} icon={<Zap className="text-warning-600" />} color="warning" />
        <StatCard title="Applications" value={applications.length} icon={<CheckCircle className="text-success-600" />} color="success" />
        <StatCard title="Time Learned" value={formatLearningTime(learningSeconds)} icon={<Clock className="text-accent-600" />} color="accent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="card-base card-hover p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-neon-cyan flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary-600 dark:text-neon-cyan" />
                  My Applications
                </h3>
                <p className="text-sm text-gray-500 dark:text-neon-light/60 mt-1">Track your job applications and status</p>
              </div>
              {applications.length > 0 && (
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary-600 dark:text-neon-cyan">{applications.length}</p>
                  <p className="text-xs text-gray-500 dark:text-neon-light/60">total</p>
                </div>
              )}
            </div>
            <div className="space-y-3">
              {applications.map((app) => (
                <div key={app.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white dark:from-neon-teal/5 dark:to-neon-gray rounded-xl border border-gray-200 dark:border-neon-teal/30 hover:shadow-md dark:hover:shadow-neon-cyan/10 transition-all duration-300 group">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2.5 bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-500/20 dark:to-primary-500/10 rounded-lg group-hover:shadow-md transition-all">
                      <Briefcase className="h-5 w-5 text-primary-600 dark:text-primary-300" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-neon-light">{app.job_title}</h4>
                      <p className="text-sm text-gray-600 dark:text-neon-light/60 flex items-center gap-1">
                        <span>{app.company_name}</span>
                        <span>•</span>
                        <MapPin className="h-3 w-3" /> 
                        <span>{app.job_location}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-bold ${
                      app.status === 'shortlisted' 
                        ? 'bg-gradient-to-r from-success-100 to-success-50 dark:from-success-500/20 dark:to-success-500/10 text-success-700 dark:text-success-300 border border-success-200 dark:border-success-500/30' 
                        : app.status === 'rejected'
                        ? 'bg-gradient-to-r from-red-100 to-red-50 dark:from-red-500/20 dark:to-red-500/10 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/30'
                        : 'bg-gradient-to-r from-warning-100 to-warning-50 dark:from-warning-500/20 dark:to-warning-500/10 text-warning-700 dark:text-warning-300 border border-warning-200 dark:border-warning-500/30'
                    }`}>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-neon-light/50 mt-2 font-medium">
                      {new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
              {applications.length === 0 && (
                <div className="text-center py-12 text-gray-400 dark:text-neon-light/40">
                  <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No applications yet</p>
                  <p className="text-sm">Start applying to jobs to see them here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="card-base card-hover p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-primary-600 dark:text-neon-cyan" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-neon-cyan">Messages</h3>
              </div>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-accent-100 to-accent-50 dark:from-accent-500/20 dark:to-accent-500/10 text-accent-700 dark:text-accent-300 text-xs font-bold px-2.5 py-1 border border-accent-200 dark:border-accent-500/30">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="space-y-3">
              {unreadNotifications.length > 0 ? (
                <>
                  {unreadNotifications.map((notif) => (
                    <div key={notif.id} className="p-4 bg-gradient-to-r from-primary-50 to-primary-50/50 dark:from-primary-500/10 dark:to-primary-500/5 rounded-lg border border-primary-200 dark:border-primary-500/30 hover:shadow-md dark:hover:shadow-primary-500/10 transition-all">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 pt-0.5">
                          <div className="w-2 h-2 rounded-full bg-primary-600 dark:bg-primary-400 animate-pulse"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 dark:text-neon-light leading-relaxed">{notif.content}</p>
                          <p className="text-xs text-gray-500 dark:text-neon-light/50 mt-2 font-medium">
                            {new Date(notif.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {unreadNotifications.length > 0 && (
                    <button
                      onClick={markNotificationsAsRead}
                      className="w-full mt-3 px-3 py-2 rounded-lg text-sm font-semibold bg-gray-100 dark:bg-neon-teal/20 text-gray-700 dark:text-neon-cyan hover:bg-gray-200 dark:hover:bg-neon-teal/30 transition-all"
                    >
                      Mark all as read
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-400 dark:text-neon-light/40">
                  <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">No new messages</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: any) => {
  const colorMap: Record<string, {bg: string, icon: string}> = {
    primary: { bg: 'from-primary-50 to-primary-50/50 dark:from-primary-500/10 dark:to-primary-500/5 dark:border-primary-500/30', icon: 'text-primary-600 dark:text-primary-400' },
    warning: { bg: 'from-warning-50 to-warning-50/50 dark:from-warning-500/10 dark:to-warning-500/5 dark:border-warning-500/30', icon: 'text-warning-600 dark:text-warning-400' },
    success: { bg: 'from-success-50 to-success-50/50 dark:from-success-500/10 dark:to-success-500/5 dark:border-success-500/30', icon: 'text-success-600 dark:text-success-400' },
    accent: { bg: 'from-accent-50 to-accent-50/50 dark:from-accent-500/10 dark:to-accent-500/5 dark:border-accent-500/30', icon: 'text-accent-600 dark:text-accent-400' },
  };

  const colorStyle = colorMap[color] || colorMap.primary;

  return (
    <div className={`p-6 lg:p-7 rounded-2xl bg-white dark:bg-neon-gray border border-gray-200 dark:border-neon-teal/30 shadow-sm dark:shadow-neon-teal/10 group overflow-hidden relative transition-all duration-300`}>
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-neon-light/70">{title}</p>
          <p className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-neon-cyan mt-2">{value}</p>
        </div>
        <div className={`p-4 rounded-2xl bg-${color}-50 dark:bg-${color}-500/20 shadow-md ${colorStyle.icon}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
