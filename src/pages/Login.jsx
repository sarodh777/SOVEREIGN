import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Globe, KeyRound, CheckCircle2 } from 'lucide-react';
import api from '../api';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState('password'); // 'password' | 'otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.registered ? '✓ Account created! Please sign in.' : '');

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/api/auth/login', { email, password });
      storeAndRedirect(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed.';
      setError(msg);
    }
    setLoading(false);
  };

  const handleOtpRequest = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/api/auth/request-otp', { email });
      navigate('/otp', { state: { email, purpose: 'LOGIN' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    }
    setLoading(false);
  };

  const storeAndRedirect = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('userEmail', data.email);
    localStorage.setItem('userName', data.name || '');
    localStorage.setItem('userRole', data.role || 'ROLE_USER');
    localStorage.setItem('userId', data.userId || '');
    if (data.role === 'ROLE_ADMIN') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  const handleGoogleAuth = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    window.location.href = `${apiUrl}/oauth2/authorization/google`;
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0B0F14] via-[#1A1F2E] to-[#0D1117] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#00F0FF]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-[#FF006E]/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-[#00F0FF]/20 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-7">
            <div className="w-16 h-16 bg-gradient-to-br from-[#00F0FF] to-[#00B8CC] rounded-xl mx-auto mb-4 flex items-center justify-center">
              <Lock className="w-8 h-8 text-[#0B0F14] font-bold" />
            </div>
            <h1 className="text-3xl font-bold text-[#E8EEF7] tracking-tight">SOVEREIGN</h1>
            <p className="text-[#A0AEC0] text-sm mt-1">Enterprise Banking Platform</p>
          </div>

          {/* Mode Toggle */}
          <div className="flex bg-[#0B0F14] rounded-lg p-1 mb-6 border border-white/5">
            {[['password', 'Password Login'], ['otp', 'Email OTP']].map(([m, label]) => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2 rounded-md text-sm font-semibold transition ${mode === m ? 'bg-[#00F0FF] text-[#0B0F14]' : 'text-[#A0AEC0] hover:text-white'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Messages */}
          {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">{success}</div>}

          {/* Password Login */}
          {mode === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-[#A0AEC0] text-sm font-medium mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#00F0FF]" />
                  <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} required
                    className="w-full bg-[#0B0F14] border border-[#00F0FF]/20 rounded-lg py-3 pl-12 pr-4 text-[#E8EEF7] placeholder-[#718096] focus:outline-none focus:border-[#00F0FF] transition"
                    placeholder="you@company.com" />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[#A0AEC0] text-sm font-medium">Password</label>
                  <Link to="/forgot-password" className="text-[#00F0FF] text-xs hover:underline">Forgot password?</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#00F0FF]" />
                  <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => { setPassword(e.target.value); setError(''); }} required
                    className="w-full bg-[#0B0F14] border border-[#00F0FF]/20 rounded-lg py-3 pl-12 pr-10 text-[#E8EEF7] placeholder-[#718096] focus:outline-none focus:border-[#00F0FF] transition"
                    placeholder="Enter your password" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718096] hover:text-[#00F0FF]">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-[#00F0FF] to-[#00B8CC] text-[#0B0F14] font-bold py-3 rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <div className="w-5 h-5 border-2 border-[#0B0F14] border-t-transparent rounded-full animate-spin" /> : <>Sign In <ArrowRight className="w-5 h-5" /></>}
              </button>
            </form>
          )}

          {/* OTP Login */}
          {mode === 'otp' && (
            <form onSubmit={handleOtpRequest} className="space-y-4">
              <div>
                <label className="block text-[#A0AEC0] text-sm font-medium mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#00F0FF]" />
                  <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} required
                    className="w-full bg-[#0B0F14] border border-[#00F0FF]/20 rounded-lg py-3 pl-12 pr-4 text-[#E8EEF7] placeholder-[#718096] focus:outline-none focus:border-[#00F0FF] transition"
                    placeholder="you@company.com" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-[#00F0FF] to-[#00B8CC] text-[#0B0F14] font-bold py-3 rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <div className="w-5 h-5 border-2 border-[#0B0F14] border-t-transparent rounded-full animate-spin" /> : <>Send OTP to Email <KeyRound className="w-4 h-4" /></>}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#00F0FF]/10" />
            <span className="text-[#718096] text-sm">OR</span>
            <div className="flex-1 h-px bg-[#00F0FF]/10" />
          </div>

          {/* Google */}
          <button onClick={handleGoogleAuth}
            className="w-full bg-white hover:bg-gray-100 text-[#0B0F14] font-bold py-3 rounded-lg transition flex items-center justify-center gap-2 border border-gray-200">
            <Globe className="w-5 h-5" /> Sign In with Google
          </button>

          <p className="text-center text-[#718096] text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#00F0FF] hover:underline font-bold">Create Account</Link>
          </p>

          <div className="mt-5 p-3 bg-[#00F0FF]/5 border border-[#00F0FF]/10 rounded-lg">
            <p className="text-[#A0AEC0] text-xs">✓ Two-factor authentication &nbsp; ✓ BCrypt encryption &nbsp; ✓ JWT sessions</p>
          </div>
        </div>
      </div>
    </div>
  );
}
