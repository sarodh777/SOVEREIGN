import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { KeyRound, ArrowRight, ArrowLeft, Mail } from 'lucide-react';
import api from '../api';

export default function OTPVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState(() => location.state?.devOtp || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendStatus, setResendStatus] = useState(() => location.state?.devOtp ? `Verification code: ${location.state.devOtp}` : '');
  const [resendCooldown, setResendCooldown] = useState(0);
  const email = location.state?.email || localStorage.getItem('userEmail') || '';

  useEffect(() => {
    if (resendCooldown > 0) {
      const timerId = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [resendCooldown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length < 4) {
      setError('Please enter a valid OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const purpose = location.state?.purpose || 'LOGIN';
      const response = await api.post('/api/auth/verify-otp', { email, otp, purpose });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', response.data.name || '');
        localStorage.setItem('userRole', response.data.role || 'ROLE_USER');
        localStorage.setItem('userId', response.data.userId || '');
        
        if (response.data.role === 'ROLE_ADMIN' || response.data.role === 'ROLE_SUPER_ADMIN') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        navigate('/login', { state: { registered: true } });
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid or expired OTP. Please try again.');
      console.error(error);
    }
    setLoading(false);
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;

    try {
      setResendStatus('Sending...');
      const purpose = location.state?.purpose || 'LOGIN';
      const res = await api.post('/api/auth/request-otp', { email, purpose });
      if (res.data.devOtp) {
        setOtp(res.data.devOtp);
        setResendStatus(`✓ Code: ${res.data.devOtp}`);
      } else {
        setResendStatus('✓ OTP sent to your email!');
      }
      setResendCooldown(60);
      setTimeout(() => setResendStatus(''), 7000);
    } catch (error) {
      setResendStatus('✗ Failed to resend OTP');
      console.error(error);
      setTimeout(() => setResendStatus(''), 5000);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050B2E] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#713BFF]/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#356BFF]/20 rounded-full blur-[120px]" />
      </div>

      {/* OTP Verification Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-[#111B57]/90 backdrop-blur-xl border border-[#8B92FF]/22 rounded-2xl p-8 shadow-[0_16px_50px_rgba(5,11,46,0.8)]">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-[#356BFF] via-[#713BFF] to-[#EC4899] rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-[0_0_25px_rgba(113,59,255,0.4)]">
              <KeyRound className="w-8 h-8 text-white font-bold" />
            </div>
            <h1 className="text-3xl font-extrabold text-[#F8FAFC]">Verify Code</h1>
            <p className="text-[#B8C5F2] text-sm mt-2">
              We sent a verification code to<br />
              <span className="font-semibold text-[#356BFF]">{email}</span>
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl">
              <p className="text-rose-400 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {resendStatus && (
            <div className={`mb-6 p-4 rounded-xl ${
              resendStatus.includes('✓') 
                ? 'bg-emerald-500/10 border border-emerald-500/30' 
                : 'bg-amber-500/10 border border-amber-500/30'
            }`}>
              <p className={`text-sm ${
                resendStatus.includes('✓') 
                  ? 'text-emerald-400' 
                  : 'text-amber-400'
              }`}>
                {resendStatus}
              </p>
            </div>
          )}

          {/* OTP Input Form */}
          <form onSubmit={handleVerify} className="space-y-4 mb-6">
            <div>
              <label className="block text-[#B8C5F2] text-xs font-semibold uppercase tracking-wider mb-2 text-center">Verification Code</label>
              <input 
                type="text" 
                value={otp}
                onChange={(e) => {
                  const numOnly = e.target.value.replace(/[^0-9]/g, '');
                  setOtp(numOnly.slice(0, 6));
                  setError('');
                }}
                placeholder="000000"
                maxLength="6"
                className="w-full bg-[#0B1550] border border-[#8B92FF]/25 rounded-xl py-4 px-4 text-center text-3xl font-bold text-[#F8FAFC] tracking-widest placeholder-[#8B92FF]/40 focus:outline-none focus:border-[#713BFF] focus:ring-1 focus:ring-[#713BFF] transition"
              />
              <p className="text-[#B8C5F2]/70 text-xs text-center mt-2">
                Enter 6-digit code from your email (or click test code:{" "}
                <button
                  type="button"
                  onClick={() => { setOtp('123456'); setError(''); }}
                  className="text-[#356BFF] font-mono font-semibold underline hover:text-[#713BFF] inline bg-transparent p-0 border-none cursor-pointer"
                >
                  123456
                </button>
                )
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 4}
              className="w-full bg-gradient-to-r from-[#356BFF] to-[#713BFF] text-white font-bold py-3 rounded-xl hover:opacity-95 transition shadow-[0_0_20px_rgba(113,59,255,0.35)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify & Continue
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-[#8B92FF]/15" />
            <span className="text-[#B8C5F2]/60 text-xs font-semibold">OR</span>
            <div className="flex-1 h-px bg-[#8B92FF]/15" />
          </div>

          {/* Resend & Back Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/login')}
              className="flex-1 bg-[#0B1550] hover:bg-[#0B1550]/80 text-[#F8FAFC] font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 border border-[#8B92FF]/25 cursor-pointer text-xs sm:text-sm"
            >
              <ArrowLeft className="w-4 h-4 text-[#B8C5F2]" />
              Back
            </button>
            
            <button
              onClick={handleResendOTP}
              disabled={resendCooldown > 0}
              className={`flex-1 font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer ${
                resendCooldown > 0
                  ? 'bg-[#0B1550] text-[#B8C5F2]/50 border border-[#8B92FF]/15 cursor-not-allowed'
                  : 'bg-[#0B1550] hover:bg-[#0B1550]/80 text-[#356BFF] hover:text-[#713BFF] border border-[#8B92FF]/30'
              }`}
            >
              <Mail className="w-4 h-4 text-[#356BFF]" />
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
            </button>
          </div>

          {/* Security Info */}
          <div className="mt-6 p-3 bg-[#0B1550]/60 border border-[#8B92FF]/20 rounded-xl text-center">
            <p className="text-[#B8C5F2]/80 text-xs font-medium">
              ✓ OTP expires in 10 minutes &nbsp;•&nbsp; Check your spam folder &nbsp;•&nbsp; 256-bit encrypted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
