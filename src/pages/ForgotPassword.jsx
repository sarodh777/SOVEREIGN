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
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0B0F14] via-[#1A1F2E] to-[#0D1117] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#00F0FF]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-[#FF006E]/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-[#00F0FF]/20 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-xl mx-auto mb-4 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-[#0B0F14]" />
            </div>
            <h1 className="text-2xl font-bold text-[#E8EEF7]">
              {step === 1 ? 'Forgot Password' : 'Set New Password'}
            </h1>
            <p className="text-[#A0AEC0] text-sm mt-1">
              {step === 1 ? 'Enter your email to receive a reset code' : 'Enter the code from your email'}
            </p>
          </div>

          {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">{success}</div>}

          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-[#A0AEC0] text-sm font-medium mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#F59E0B]" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    className="w-full bg-[#0B0F14] border border-[#F59E0B]/20 rounded-lg py-3 pl-12 pr-4 text-[#E8EEF7] placeholder-[#718096] focus:outline-none focus:border-[#F59E0B] transition"
                    placeholder="you@company.com" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F14] font-bold py-3 rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <div className="w-5 h-5 border-2 border-[#0B0F14] border-t-transparent rounded-full animate-spin" /> : <>Send Reset Code <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-[#A0AEC0] text-sm font-medium mb-2">Reset Code</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#F59E0B]" />
                  <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full bg-[#0B0F14] border border-[#F59E0B]/20 rounded-lg py-3 pl-12 pr-4 text-[#E8EEF7] text-center text-xl font-bold tracking-widest placeholder-[#718096] focus:outline-none focus:border-[#F59E0B] transition"
                    placeholder="000000" maxLength={6} />
                </div>
              </div>
              <div>
                <label className="block text-[#A0AEC0] text-sm font-medium mb-2">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#718096]" />
                  <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                    className="w-full bg-[#0B0F14] border border-white/10 rounded-lg py-3 pl-12 pr-10 text-[#E8EEF7] placeholder-[#718096] focus:outline-none focus:border-[#00F0FF] transition"
                    placeholder="Min 8 chars, 1 uppercase, 1 number" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718096]">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[#A0AEC0] text-sm font-medium mb-2">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#718096]" />
                  <input type={showPwd ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                    className="w-full bg-[#0B0F14] border border-white/10 rounded-lg py-3 pl-12 pr-4 text-[#E8EEF7] placeholder-[#718096] focus:outline-none focus:border-[#00F0FF] transition"
                    placeholder="Re-enter new password" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-bold py-3 rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Reset Password <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}

          <p className="text-center text-[#718096] text-sm mt-6">
            Remember it? <Link to="/login" className="text-[#00F0FF] hover:underline font-semibold">Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
