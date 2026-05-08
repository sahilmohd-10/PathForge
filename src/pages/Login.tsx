import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import { Mail, Lock, ArrowRight, Loader2, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Login = () => {
  const { login } = useAuth();
  const { } = useTheme();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        const registerRes = await axios.post('/api/auth/register', { 
          email, 
          password, 
          role, 
          fullName: email.split('@')[0],
          phoneNumber: phoneNumber 
        });
        login(registerRes.data.token, registerRes.data.user);
      } else {
        const res = await axios.post('/api/auth/login', { email, password, role });
        login(res.data.token, res.data.user);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse: any) => {
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/google', {
        token: credentialResponse.credential,
        role: role
      });
      login(res.data.token, res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-['Plus_Jakarta_Sans']">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[480px] bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 p-10 md:p-12 relative overflow-hidden"
      >
        {/* Logo & Header */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 bg-[#0081C9] rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-blue-500/20 mb-6">
            P
          </div>
          <h1 className="text-4xl font-black text-[#0f172a] tracking-tight mb-2">PathForge</h1>
          <p className="text-slate-500 font-bold">Welcome back, {role.charAt(0).toUpperCase() + role.slice(1)}</p>
        </div>

        {/* Role Tabs */}
        <div className="bg-[#F1F5F9] p-1.5 rounded-2xl flex mb-10">
          {['student', 'recruiter', 'admin'].map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 py-3 px-2 rounded-xl text-sm font-black transition-all ${
                role === r 
                ? 'bg-[#0081C9] text-white shadow-lg shadow-blue-500/30' 
                : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-black text-[#1e293b] ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                required
                placeholder="your@email.com"
                className="w-full pl-12 pr-5 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#0081C9] transition-all text-slate-900 font-medium"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-black text-[#1e293b] ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full pl-12 pr-5 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#0081C9] transition-all text-slate-900 font-medium"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {!isRegister && <p className="text-[10px] font-bold text-slate-400 ml-1">At least 8 characters</p>}
          </div>

          <AnimatePresence>
            {isRegister && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <label className="text-sm font-black text-[#1e293b] ml-1">Phone Number (Twilio SMS)</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="tel"
                    required={isRegister}
                    placeholder="+1234567890"
                    className="w-full pl-12 pr-5 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#0081C9] transition-all text-slate-900 font-medium"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-rose-50 text-rose-600 p-4 rounded-xl text-xs font-bold border border-rose-100"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#0081C9] hover:bg-[#0070B0] text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                {isRegister ? 'Create Account' : 'Sign In'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100"></div>
          </div>
          <div className="relative flex justify-center text-[10px]">
            <span className="px-4 bg-white text-slate-400 font-black uppercase tracking-widest">Or continue with</span>
          </div>
        </div>

        {/* Google Login */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={() => setError('Google login failed')}
            shape="pill"
            theme="outline"
            width="100%"
          />
        </div>

        {/* Footer */}
        <p className="text-center mt-10 text-xs font-bold text-slate-500">
          {isRegister ? 'Already have an account? ' : 'New to PathForge? '}
          <button 
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="text-[#0081C9] hover:underline"
          >
            {isRegister ? 'Sign In' : 'Create Account'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;