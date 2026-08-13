import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2, KeyRound } from 'lucide-react';
import api from '../api';

const passwordStrength = (pwd) => {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
};

export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=form, 2=otp
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const strength = passwordStrength(form.password);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', '#FF006E', '#F59E0B', '#00F0FF', '#10B981'][strength];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/api/auth/register', form);
      setSuccess('Verification code sent to ' + form.email);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/api/auth/verify-otp', { email: form.email, otp, purpose: 'REGISTER' });
      setSuccess('Email verified! Redirecting to login...');
      setTimeout(() => navigate('/login', { state: { registered: true } }), 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired code.');
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setLoading(true); setError('');
    try {
      await api.post('/api/auth/register', form);
      setSuccess('New code sent!');
    } catch (err) {
      setError('Could not resend code.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F14] via-[#1A1F2E] to-[#0D1117] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-80 h-80 bg-[#00F0FF]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#FF006E]/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-[#00F0FF]/20 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-8 pb-6 text-center border-b border-white/5">
            <div className="w-14 h-14 bg-gradient-to-br from-[#00F0FF] to-[#00B8CC] rounded-xl mx-auto mb-4 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-[#0B0F14]" />
            </div>
            <h1 className="text-2xl font-bold text-[#E8EEF7]">Create Your Account</h1>
            <p className="text-[#A0AEC0] text-sm mt-1">Sovereign Ledger — Secure Banking Platform</p>
          </div>

          {/* Step indicator */}
          <div className="flex px-8 py-4 gap-2">
            {['Your Details', 'Verify Email'].map((label, i) => (
              <div key={i} className="flex-1 flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${step > i + 1 ? 'bg-[#10B981] border-[#10B981] text-white' : step === i + 1 ? 'bg-[#00F0FF] border-[#00F0FF] text-[#0B0F14]' : 'border-white/20 text-[#718096]'}`}>
                  {step > i + 1 ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-xs font-medium ${step === i + 1 ? 'text-[#00F0FF]' : 'text-[#718096]'}`}>{label}</span>
                {i < 1 && <div className={`flex-1 h-px ${step > 1 ? 'bg-[#10B981]' : 'bg-white/10'}`} />}
              </div>
            ))}
          </div>

          <div className="px-8 pb-8">
            {/* Error / Success */}
            {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">{success}</div>}

            {/* STEP 1: Registration Form */}
            {step === 1 && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-[#A0AEC0] text-xs font-semibold mb-1.5 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718096]" />
                    <input name="name" required value={form.name} onChange={handleChange}
                      className="w-full bg-[#0B0F14] border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-[#E8EEF7] placeholder-[#4A5568] focus:outline-none focus:border-[#00F0FF] transition"
                      placeholder="John Doe" />
                  </div>
                </div>

                <div>
                  <label className="block text-[#A0AEC0] text-xs font-semibold mb-1.5 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718096]" />
                    <input name="email" type="email" required value={form.email} onChange={handleChange}
                      className="w-full bg-[#0B0F14] border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-[#E8EEF7] placeholder-[#4A5568] focus:outline-none focus:border-[#00F0FF] transition"
                      placeholder="you@example.com" />
                  </div>
                </div>

                <div>
                  <label className="block text-[#A0AEC0] text-xs font-semibold mb-1.5 uppercase tracking-wider">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718096]" />
                    <input name="phone" required value={form.phone} onChange={handleChange}
                      className="w-full bg-[#0B0F14] border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-[#E8EEF7] placeholder-[#4A5568] focus:outline-none focus:border-[#00F0FF] transition"
                      placeholder="9876543210" maxLength={10} />
                  </div>
                </div>

                <div>
                  <label className="block text-[#A0AEC0] text-xs font-semibold mb-1.5 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718096]" />
                    <input name="password" type={showPassword ? 'text' : 'password'} required value={form.password} onChange={handleChange}
                      className="w-full bg-[#0B0F14] border border-white/10 rounded-lg pl-10 pr-10 py-3 text-sm text-[#E8EEF7] placeholder-[#4A5568] focus:outline-none focus:border-[#00F0FF] transition"
                      placeholder="Min 8 chars, 1 uppercase, 1 number" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718096] hover:text-[#00F0FF]">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="flex-1 h-1 rounded-full transition-all" style={{ background: i <= strength ? strengthColor : '#252C3C' }} />
                        ))}
                      </div>
                      <p className="text-xs" style={{ color: strengthColor }}>{strengthLabel}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[#A0AEC0] text-xs font-semibold mb-1.5 uppercase tracking-wider">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718096]" />
                    <input name="confirmPassword" type={showPassword ? 'text' : 'password'} required value={form.confirmPassword} onChange={handleChange}
                      className={`w-full bg-[#0B0F14] border rounded-lg pl-10 pr-4 py-3 text-sm text-[#E8EEF7] placeholder-[#4A5568] focus:outline-none transition ${form.confirmPassword && form.password !== form.confirmPassword ? 'border-red-500/50' : 'border-white/10 focus:border-[#00F0FF]'}`}
                      placeholder="Re-enter your password" />
                  </div>
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                  )}
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-gradient-to-r from-[#00F0FF] to-[#00B8CC] text-[#0B0F14] font-bold py-3 rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2 mt-2 disabled:opacity-50">
                  {loading ? <div className="w-5 h-5 border-2 border-[#0B0F14] border-t-transparent rounded-full animate-spin" /> : <>Send Verification Code <ArrowRight className="w-4 h-4" /></>}
                </button>

                <p className="text-center text-[#718096] text-sm pt-2">
                  Already have an account? <Link to="/login" className="text-[#00F0FF] hover:underline font-semibold">Sign In</Link>
                </p>
              </form>
            )}

            {/* STEP 2: OTP Verification */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-[#00F0FF]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#00F0FF]/30">
                    <KeyRound className="w-8 h-8 text-[#00F0FF]" />
                  </div>
                  <p className="text-[#A0AEC0] text-sm">We sent a 6-digit code to</p>
                  <p className="text-[#00F0FF] font-semibold mt-1">{form.email}</p>
                </div>

                <div>
                  <label className="block text-[#A0AEC0] text-xs font-semibold mb-1.5 uppercase tracking-wider text-center">Enter Verification Code</label>
                  <input value={otp} onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                    className="w-full bg-[#0B0F14] border border-[#00F0FF]/20 rounded-xl py-4 px-4 text-center text-3xl font-bold text-[#E8EEF7] tracking-widest focus:outline-none focus:border-[#00F0FF] transition"
                    placeholder="000000" maxLength={6} />
                  <p className="text-[#718096] text-xs text-center mt-2">Code expires in 10 minutes</p>
                </div>

                <button type="submit" disabled={loading || otp.length < 6}
                  className="w-full bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-bold py-3 rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Verify & Create Account <CheckCircle2 className="w-4 h-4" /></>}
                </button>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 bg-[#252C3C] text-[#A0AEC0] py-2.5 rounded-lg text-sm hover:bg-[#2D3548] transition">← Back</button>
                  <button type="button" onClick={handleResend} disabled={loading} className="flex-1 bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] py-2.5 rounded-lg text-sm hover:bg-[#00F0FF]/20 transition disabled:opacity-50">Resend Code</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
