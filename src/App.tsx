import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import CareerEngine from './pages/CareerEngine';
import JobBoard from './pages/JobBoard';

import Profile from './pages/Profile';
import AdminUsers from './pages/AdminUsers';
import AdminDatabase from './pages/AdminDatabase';
import DataMatch from './pages/DataMatch';
import Login from './pages/Login';
import PublicProfile from './pages/PublicProfile';
import MockInterview from './pages/MockInterview';
import Roadmap from './pages/Roadmap';
import ProjectAnalysis from './pages/ProjectAnalysis';
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import PublishJob from './pages/PublishJob';
import AdminJobs from './pages/AdminJobs';

const AppContent = () => {
  const { isAuthenticated, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      return hash || 'dashboard';
    }
    return 'dashboard';
  });

  useEffect(() => {
    const titleMap: Record<string, string> = {
      dashboard: 'Dashboard',
      career: 'Career Engine',
      jobs: 'Job Board',

      users: 'User Management',
      database: 'Database Management',
      datamatch: 'Career Data Match',
      mockinterview: 'AI Mock Interview',
      roadmap: 'Learning Roadmap',
      portfolio: 'Project Evaluation',
      publishjob: 'Publish Opportunity',
      profile: 'Profile',
      user: 'User Profile',
    };

    if (!isAuthenticated) {
      document.title = 'PathForge · Sign In';
      return;
    }

    document.title = `PathForge · ${titleMap[activeTab] || 'Dashboard'}`;
  }, [activeTab, isAuthenticated]);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '') || 'dashboard';
      setActiveTab(hash);
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  if (!isAuthenticated) return <Login />;

  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 md:flex transition-colors duration-300">
      <Sidebar
        activeTab={activeTab.split('?')[0]}
        setActiveTab={setActiveTab}
        mobileOpen={sidebarOpen}
        setMobileOpen={setSidebarOpen}
      />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Navbar />
        
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
          {/* Mobile Overlay Toggle */}
          <div className="md:hidden flex items-center p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <Menu size={20} />
            </button>
          </div>

          {activeTab.split('?')[0] === 'dashboard' && <Dashboard />}
          {activeTab.split('?')[0] === 'career' && (user?.role === 'student' ? <CareerEngine /> : <Dashboard />)}
          {activeTab.split('?')[0] === 'jobs' && <JobBoard />}

          {activeTab.split('?')[0] === 'users' && (isAdmin ? <AdminUsers /> : <Dashboard />)}
          {activeTab.split('?')[0] === 'database' && (isAdmin ? <AdminDatabase /> : <Dashboard />)}
          {activeTab.split('?')[0] === 'datamatch' && (isAdmin ? <DataMatch /> : <Dashboard />)}
          {activeTab.split('?')[0] === 'mockinterview' && (user?.role === 'student' ? <MockInterview /> : <Dashboard />)}
          {activeTab.split('?')[0] === 'roadmap' && (user?.role === 'student' ? <Roadmap /> : <Dashboard />)}
          {activeTab.split('?')[0] === 'portfolio' && (user?.role === 'student' ? <ProjectAnalysis /> : <Dashboard />)}
          {activeTab.split('?')[0] === 'resume' && (user?.role === 'student' ? <ResumeAnalyzer /> : <Dashboard />)}
          {activeTab.split('?')[0] === 'publishjob' && (user?.role === 'recruiter' ? <PublishJob /> : <Dashboard />)}
          {activeTab.split('?')[0] === 'adminjobs' && (isAdmin ? <AdminJobs /> : <Dashboard />)}
          {activeTab.split('?')[0] === 'profile' && <Profile />}
          {activeTab.split('?')[0] === 'user' && <PublicProfile />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    console.warn('⚠️ VITE_GOOGLE_CLIENT_ID not found in environment variables');
    console.warn('📍 Add VITE_GOOGLE_CLIENT_ID to your .env file');
  } else {
    console.log('✅ Google Client ID loaded:', googleClientId.substring(0, 20) + '...');
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId || 'placeholder'}>
      <ThemeProvider>
        <AuthProvider>
          <Toaster position="top-right" reverseOrder={false} />
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}