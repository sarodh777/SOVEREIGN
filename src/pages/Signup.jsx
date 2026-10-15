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
  const strengthColor = ['', '#EC4899', '#A855F7', '#356BFF', '#713BFF'][strength];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/api/auth/register', form);
      if (res.data.devOtp) {
        setSuccess(`Verification code: ${res.data.devOtp}`);
        setOtp(res.data.devOtp);
      } else {
        setSuccess(res.data.message || ('Verification code sent to ' + form.email));
      }
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
      const res = await api.post('/api/auth/request-otp', { email: form.email, purpose: 'REGISTER' });
      if (res.data.devOtp) {
        setSuccess(`New verification code: ${res.data.devOtp}`);
        setOtp(res.data.devOtp);
      } else {
        setSuccess('New code sent to ' + form.email);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resend code.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050B2E] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#713BFF]/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#356BFF]/20 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        <div className="bg-[#111B57]/90 backdrop-blur-xl border border-[#8B92FF]/22 rounded-2xl shadow-[0_16px_50px_rgba(5,11,46,0.8)] overflow-hidden">
          {/* Header */}
          <div className="p-8 pb-6 text-center border-b border-[#8B92FF]/15">
            <div className="w-14 h-14 bg-gradient-to-tr from-[#356BFF] via-[#713BFF] to-[#EC4899] rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-[0_0_25px_rgba(113,59,255,0.4)]">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#F8FAFC]">Create Your Account</h1>
            <p className="text-[#B8C5F2] text-sm mt-1">VAULTCHAIN — Enterprise Banking Platform</p>
          </div>

          {/* Step indicator */}
          <div className="flex px-8 py-4 gap-2 bg-[#0B1550]/40 border-b border-[#8B92FF]/15">
            {['Your Details', 'Verify Email'].map((label, i) => (
              <div key={i} className="flex-1 flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > i + 1
                    ? 'bg-gradient-to-r from-[#356BFF] to-[#713BFF] text-white'
                    : step === i + 1
                    ? 'bg-gradient-to-r from-[#356BFF] to-[#713BFF] text-white shadow-[0_0_10px_rgba(113,59,255,0.4)]'
                    : 'border border-[#8B92FF]/25 text-[#B8C5F2]/50'
                }`}>
                  {step > i + 1 ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-xs font-medium ${step === i + 1 ? 'text-[#F8FAFC] font-semibold' : 'text-[#B8C5F2]/60'}`}>{label}</span>
                {i < 1 && <div className={`flex-1 h-px ${step > 1 ? 'bg-[#713BFF]' : 'bg-[#8B92FF]/15'}`} />}
              </div>
            ))}
          </div>

          <div className="px-8 py-6">
            {/* Error / Success */}
            {error && <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs sm:text-sm">{error}</div>}
            {success && <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs sm:text-sm">{success}</div>}

            {/* STEP 1: Registration Form */}
            {step === 1 && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-[#B8C5F2] text-xs font-semibold mb-1.5 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#356BFF]" />
                    <input
                      name="name"
                      required
                      value={form.name}
                      onChange={handleChange}
                      className="w-full bg-[#0B1550] border border-[#8B92FF]/25 rounded-xl pl-11 pr-4 py-3 text-sm text-[#F8FAFC] placeholder-[#8B92FF]/40 focus:outline-none focus:border-[#713BFF] focus:ring-1 focus:ring-[#713BFF] transition"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#B8C5F2] text-xs font-semibold mb-1.5 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#356BFF]" />
                    <input
                      name="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      className="w-full bg-[#0B1550] border border-[#8B92FF]/25 rounded-xl pl-11 pr-4 py-3 text-sm text-[#F8FAFC] placeholder-[#8B92FF]/40 focus:outline-none focus:border-[#713BFF] focus:ring-1 focus:ring-[#713BFF] transition"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#B8C5F2] text-xs font-semibold mb-1.5 uppercase tracking-wider">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#356BFF]" />
                    <input
                      name="phone"
                      required
                      value={form.phone}
                      onChange={handleChange}
                      className="w-full bg-[#0B1550] border border-[#8B92FF]/25 rounded-xl pl-11 pr-4 py-3 text-sm text-[#F8FAFC] placeholder-[#8B92FF]/40 focus:outline-none focus:border-[#713BFF] focus:ring-1 focus:ring-[#713BFF] transition"
                      placeholder="9876543210"
                      maxLength={10}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#B8C5F2] text-xs font-semibold mb-1.5 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#356BFF]" />
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={form.password}
                      onChange={handleChange}
                      className="w-full bg-[#0B1550] border border-[#8B92FF]/25 rounded-xl pl-11 pr-10 py-3 text-sm text-[#F8FAFC] placeholder-[#8B92FF]/40 focus:outline-none focus:border-[#713BFF] focus:ring-1 focus:ring-[#713BFF] transition"
                      placeholder="Min 8 chars, 1 uppercase, 1 number"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8B92FF]/60 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="flex-1 h-1 rounded-full transition-all" style={{ background: i <= strength ? strengthColor : '#111B57' }} />
                        ))}
                      </div>
                      <p className="text-xs font-medium" style={{ color: strengthColor }}>{strengthLabel}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[#B8C5F2] text-xs font-semibold mb-1.5 uppercase tracking-wider">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#356BFF]" />
                    <input
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={form.confirmPassword}
                      onChange={handleChange}
                      className={`w-full bg-[#0B1550] border rounded-xl pl-11 pr-4 py-3 text-sm text-[#F8FAFC] placeholder-[#8B92FF]/40 focus:outline-none transition ${
                        form.confirmPassword && form.password !== form.confirmPassword ? 'border-rose-500/50' : 'border-[#8B92FF]/25 focus:border-[#713BFF]'
                      }`}
                      placeholder="Re-enter your password"
                    />
                  </div>
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <p className="text-rose-400 text-xs mt-1">Passwords do not match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#356BFF] to-[#713BFF] text-white font-bold py-3 rounded-xl hover:opacity-95 transition flex items-center justify-center gap-2 mt-2 shadow-[0_0_20px_rgba(113,59,255,0.35)] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Send Verification Code <ArrowRight className="w-4 h-4" /></>}
                </button>

                <p className="text-center text-[#B8C5F2] text-xs sm:text-sm pt-2">
                  Already have an account? <Link to="/login" className="text-[#356BFF] hover:text-[#713BFF] hover:underline font-semibold transition">Sign In</Link>
                </p>
              </form>
            )}

            {/* STEP 2: OTP Verification */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-[#713BFF]/15 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#713BFF]/30 shadow-[0_0_20px_rgba(113,59,255,0.2)]">
                    <KeyRound className="w-8 h-8 text-[#A855F7]" />
                  </div>
                  <p className="text-[#B8C5F2] text-sm">We sent a 6-digit code to</p>
                  <p className="text-[#356BFF] font-semibold mt-1">{form.email}</p>
                </div>

                <div>
                  <label className="block text-[#B8C5F2] text-xs font-semibold mb-1.5 uppercase tracking-wider text-center">Enter Verification Code</label>
                  <input
                    value={otp}
                    onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                    className="w-full bg-[#0B1550] border border-[#8B92FF]/25 rounded-xl py-4 px-4 text-center text-3xl font-bold text-[#F8FAFC] tracking-widest focus:outline-none focus:border-[#713BFF] focus:ring-1 focus:ring-[#713BFF] transition"
                    placeholder="000000"
                    maxLength={6}
                  />
                  <p className="text-[#B8C5F2]/60 text-xs text-center mt-2">Code expires in 10 minutes (or test code: <span className="text-[#356BFF] font-mono font-semibold">123456</span>)</p>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full bg-gradient-to-r from-[#356BFF] to-[#713BFF] text-white font-bold py-3 rounded-xl hover:opacity-95 transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(113,59,255,0.35)] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Verify & Create Account <CheckCircle2 className="w-4 h-4" /></>}
                </button>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-[#0B1550] border border-[#8B92FF]/25 text-[#B8C5F2] hover:text-white py-2.5 rounded-xl text-xs sm:text-sm transition cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    className="flex-1 bg-[#0B1550] border border-[#8B92FF]/25 text-[#356BFF] hover:text-[#713BFF] py-2.5 rounded-xl text-xs sm:text-sm hover:border-[#713BFF] transition disabled:opacity-50 cursor-pointer"
                  >
                    Resend Code
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
