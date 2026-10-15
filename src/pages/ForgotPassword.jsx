import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, KeyRound, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import api from '../api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=email, 2=otp+newpwd
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/api/auth/forgot-password', { email });
      if (res.data.devOtp) {
        setOtp(res.data.devOtp);
      }
      setSuccess(res.data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset code.');
    }
    setLoading(false);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.post('/api/auth/reset-password', { email, otp, password, confirmPassword });
      setSuccess(res.data.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. Check your code.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-[#050B2E] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#713BFF]/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#356BFF]/20 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-[#111B57]/90 backdrop-blur-xl border border-[#8B92FF]/22 rounded-2xl p-8 shadow-[0_16px_50px_rgba(5,11,46,0.8)]">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-[#356BFF] via-[#713BFF] to-[#EC4899] rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-[0_0_25px_rgba(113,59,255,0.4)]">
              <ShieldCheck className="w-8 h-8 text-white font-bold" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#F8FAFC]">
              {step === 1 ? 'Forgot Password' : 'Set New Password'}
            </h1>
            <p className="text-[#B8C5F2] text-sm mt-1">
              {step === 1 ? 'Enter your email to receive a reset code' : 'Enter the code from your email'}
            </p>
          </div>

          {error && <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs sm:text-sm">{error}</div>}
          {success && <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs sm:text-sm">{success}</div>}

          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-[#B8C5F2] text-xs font-semibold uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#356BFF]" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
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
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Send Reset Code <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-[#B8C5F2] text-xs font-semibold uppercase tracking-wider mb-2">Reset Code</label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#356BFF]" />
                  <input
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full bg-[#0B1550] border border-[#8B92FF]/25 rounded-xl py-3 pl-11 pr-4 text-[#F8FAFC] text-center text-xl font-bold tracking-widest placeholder-[#8B92FF]/40 focus:outline-none focus:border-[#713BFF] focus:ring-1 focus:ring-[#713BFF] transition"
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>
                <p className="text-[#B8C5F2]/70 text-xs text-center mt-2">Enter code from email (or test code: <span className="text-[#356BFF] font-mono font-semibold">123456</span>)</p>
              </div>
              <div>
                <label className="block text-[#B8C5F2] text-xs font-semibold uppercase tracking-wider mb-2">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#356BFF]" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full bg-[#0B1550] border border-[#8B92FF]/25 rounded-xl py-3 pl-11 pr-10 text-[#F8FAFC] placeholder-[#8B92FF]/40 text-sm focus:outline-none focus:border-[#713BFF] focus:ring-1 focus:ring-[#713BFF] transition"
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8B92FF]/60 hover:text-white cursor-pointer">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[#B8C5F2] text-xs font-semibold uppercase tracking-wider mb-2">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#356BFF]" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    className="w-full bg-[#0B1550] border border-[#8B92FF]/25 rounded-xl py-3 pl-11 pr-4 text-[#F8FAFC] placeholder-[#8B92FF]/40 text-sm focus:outline-none focus:border-[#713BFF] focus:ring-1 focus:ring-[#713BFF] transition"
                    placeholder="Re-enter new password"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#356BFF] to-[#713BFF] text-white font-bold py-3 rounded-xl hover:opacity-95 transition flex items-center justify-center gap-2 text-sm shadow-[0_0_20px_rgba(113,59,255,0.35)] disabled:opacity-50 cursor-pointer"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Reset Password <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}

          <p className="text-center text-[#B8C5F2] text-xs sm:text-sm mt-6">
            Remember it? <Link to="/login" className="text-[#356BFF] hover:text-[#713BFF] hover:underline font-semibold transition">Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
