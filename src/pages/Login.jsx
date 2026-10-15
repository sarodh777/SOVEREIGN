import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Globe, KeyRound, ShieldCheck } from 'lucide-react';
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
  const [success, setSuccess] = useState(location.state?.registered ? 'Account created! Please sign in.' : '');

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
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
      const res = await api.post('/api/auth/request-otp', { email, purpose: 'LOGIN' });
      navigate('/otp', { state: { email, purpose: 'LOGIN', devOtp: res.data.devOtp } });
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
    if (data.role === 'ROLE_ADMIN' || data.role === 'ROLE_SUPER_ADMIN') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  const handleGoogleAuth = () => {
    const apiUrl = import.meta.env.VITE_API_URL ?? '';
    window.location.href = `${apiUrl}/oauth2/authorization/google`;
  };

  return (
    <div className="min-h-screen w-full bg-[#050B2E] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#713BFF]/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#356BFF]/20 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-[#111B57]/90 backdrop-blur-xl border border-[#8B92FF]/22 rounded-2xl p-8 shadow-[0_16px_50px_rgba(5,11,46,0.8)]">
          {/* Header */}
          <div className="text-center mb-7">
            <div className="w-16 h-16 bg-gradient-to-tr from-[#356BFF] via-[#713BFF] to-[#EC4899] rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-[0_0_25px_rgba(113,59,255,0.4)]">
              <ShieldCheck className="w-8 h-8 text-white font-bold" />
            </div>
            <h1 className="text-3xl font-extrabold text-[#F8FAFC] tracking-tight">VAULTCHAIN</h1>
            <p className="text-[#B8C5F2] text-sm mt-1">Enterprise Blockchain Banking</p>
          </div>

          {/* Mode Toggle */}
          <div className="flex bg-[#0B1550] rounded-xl p-1 mb-6 border border-[#8B92FF]/20">
            {[['password', 'Password Login'], ['otp', 'Email OTP']].map(([m, label]) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  mode === m
                    ? 'bg-gradient-to-r from-[#356BFF] to-[#713BFF] text-white shadow-[0_0_15px_rgba(113,59,255,0.3)]'
                    : 'text-[#B8C5F2] hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Messages */}
          {error && <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs sm:text-sm">{error}</div>}
          {success && <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs sm:text-sm">{success}</div>}

          {/* Password Login */}
          {mode === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-[#B8C5F2] text-xs font-semibold uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#356BFF]" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    required
                    className="w-full bg-[#0B1550] border border-[#8B92FF]/25 rounded-xl py-3 pl-11 pr-4 text-[#F8FAFC] placeholder-[#8B92FF]/40 text-sm focus:outline-none focus:border-[#713BFF] focus:ring-1 focus:ring-[#713BFF] transition"
                    placeholder="you@company.com"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[#B8C5F2] text-xs font-semibold uppercase tracking-wider">Password</label>
                  <Link to="/forgot-password" className="text-[#356BFF] hover:text-[#713BFF] text-xs font-medium hover:underline transition">Forgot password?</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#356BFF]" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    required
                    className="w-full bg-[#0B1550] border border-[#8B92FF]/25 rounded-xl py-3 pl-11 pr-10 text-[#F8FAFC] placeholder-[#8B92FF]/40 text-sm focus:outline-none focus:border-[#713BFF] focus:ring-1 focus:ring-[#713BFF] transition"
                    placeholder="Enter your password"
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8B92FF]/60 hover:text-white cursor-pointer">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#356BFF] to-[#713BFF] text-white font-bold py-3 rounded-xl hover:opacity-95 transition flex items-center justify-center gap-2 text-sm shadow-[0_0_20px_rgba(113,59,255,0.35)] disabled:opacity-50 cursor-pointer"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}

          {/* OTP Login */}
          {mode === 'otp' && (
            <form onSubmit={handleOtpRequest} className="space-y-4">
              <div>
                <label className="block text-[#B8C5F2] text-xs font-semibold uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#356BFF]" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    required
                    className="w-full bg-[#0B1550] border border-[#8B92FF]/25 rounded-xl py-3 pl-11 pr-4 text-[#F8FAFC] placeholder-[#8B92FF]/40 text-sm focus:outline-none focus:border-[#713BFF] focus:ring-1 focus:ring-[#713BFF] transition"
                    placeholder="you@company.com"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#356BFF] to-[#713BFF] text-white font-bold py-3 rounded-xl hover:opacity-95 transition flex items-center justify-center gap-2 text-sm shadow-[0_0_20px_rgba(113,59,255,0.35)] disabled:opacity-50 cursor-pointer"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Send OTP to Email <KeyRound className="w-4 h-4" /></>}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#8B92FF]/15" />
            <span className="text-[#B8C5F2]/60 text-xs font-semibold">OR</span>
            <div className="flex-1 h-px bg-[#8B92FF]/15" />
          </div>

          {/* Google */}
          <button
            onClick={handleGoogleAuth}
            className="w-full bg-[#0B1550] hover:bg-[#0B1550]/80 text-[#F8FAFC] font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 border border-[#8B92FF]/25 hover:border-[#713BFF] text-sm cursor-pointer"
          >
            <Globe className="w-4 h-4 text-[#356BFF]" /> Sign In with Google
          </button>

          <p className="text-center text-[#B8C5F2] text-xs sm:text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#356BFF] hover:text-[#713BFF] hover:underline font-bold transition">Create Account</Link>
          </p>

          <div className="mt-5 p-3 bg-[#0B1550]/60 border border-[#8B92FF]/20 rounded-xl text-center">
            <p className="text-[#B8C5F2]/80 text-xs font-medium">Two-Factor Authentication &nbsp;•&nbsp; ECDSA Digital Signing &nbsp;•&nbsp; JWT Sessions</p>
          </div>
        </div>
      </div>
    </div>
  );
}
