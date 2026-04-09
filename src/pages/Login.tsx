import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import { AlertCircle } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('✅ Login component mounted');
    console.log('📱 GoogleLogin component should be visible below');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^.+@.+\..+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setError('Invalid email format');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      if (isRegister) {
        const registerRes = await axios.post('/api/auth/register', { email, password, fullName, role });
        login(registerRes.data.token, registerRes.data.user);
      } else {
        const res = await axios.post('/api/auth/login', { email, password, role });
        login(res.data.token, res.data.user);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Something went wrong';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse: any) => {
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/google', {
        token: credentialResponse.credential || credentialResponse,
        role: role,
      });
      login(res.data.token, res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Google login failed. Please check your credentials.');
      console.error('Google login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginSuccess = (credentialResponse: any) => {
    handleGoogleLogin(credentialResponse);
  };

  const handleGoogleLoginError = () => {
    console.error('❌ Google login failed - check browser console for details');
    console.error('Possible issues:');
    console.error('1. Google Client ID is invalid or missing');
    console.error('2. Domain is not authorized in Google Console');
    console.error('3. Google API not enabled');
    setError('Google login failed. Please check the console for details or use email/password.');
  };

  const allRoles = [
    { id: 'student', label: 'Student' },
    { id: 'recruiter', label: 'Recruiter' },
    { id: 'admin', label: 'Admin' },
  ];

  // Show only Student and Recruiter for signup, all roles for login
  const roles = isRegister ? [
    { id: 'student', label: 'Student' },
    { id: 'recruiter', label: 'Recruiter' },
  ] : allRoles;

  // Reset to student if admin is selected during signup transition
  useEffect(() => {
    if (isRegister && role === 'admin') {
      setRole('student');
    }
  }, [isRegister]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-300 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary-100/50 dark:bg-primary-900/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-100/50 dark:bg-blue-900/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 border border-slate-200 dark:border-slate-700 transition-colors duration-300 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">P</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-primary-600">PathForge</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-3 font-medium">
            {isRegister ? 'Start your career journey' : `Welcome back, ${role.charAt(0).toUpperCase() + role.slice(1)}`}
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div className="flex p-1.5 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl mb-8 transition-all duration-300">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${
                role === r.id 
                  ? 'bg-primary-600 text-white shadow-lg' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl text-sm border border-red-200 dark:border-red-900/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          {isRegister && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2.5">Full Name</label>
              <input
                type="text"
                required
                disabled={loading}
                placeholder="John Doe"
                className="input-base"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2.5">Email Address</label>
            <input
              type="email"
              required
              disabled={loading}
              placeholder="your@email.com"
              className="input-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2.5">Password</label>
            <input
              type="password"
              required
              disabled={loading}
              placeholder="••••••••"
              className="input-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">At least 8 characters</p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-6"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </span>
            ) : (
              isRegister ? 'Create Account' : 'Sign In'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-500 font-medium">Or continue with</span>
          </div>
        </div>

        {/* Google OAuth Button */}
        <div className="w-full flex justify-center bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <GoogleLogin
              onSuccess={handleGoogleLoginSuccess}
              onError={handleGoogleLoginError}
              size="large"
              text="signin_with"
            />
          </div>
        </div>

        {/* Toggle Form */}
        <p className="text-center text-slate-600 dark:text-slate-400 mt-8 text-sm">
          {isRegister ? "Already have an account? " : "Don't have an account? "}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="font-bold text-primary-600 dark:text-primary-400 hover:underline transition-all"
          >
            {isRegister ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
