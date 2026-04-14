import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { KeyRound, ArrowRight, ArrowLeft, Mail } from 'lucide-react';
import axios from 'axios';

export default function OTPVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendStatus, setResendStatus] = useState('');
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
      const response = await axios.post('http://localhost:8080/api/auth/verify-otp', { email, otp });
      localStorage.setItem('userEmail', email);
      localStorage.setItem('token', response.data.token || '');
      navigate('/dashboard');
    } catch (error) {
      setError('Invalid or expired OTP. Please try again.');
      console.error(error);
    }
    setLoading(false);
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;

    try {
      setResendStatus('Sending...');
      await axios.post('http://localhost:8080/api/auth/request-otp', { email });
      setResendStatus('✓ OTP sent to your email!');
      setResendCooldown(60);
      setTimeout(() => setResendStatus(''), 5000);
    } catch (error) {
      setResendStatus('✗ Failed to resend OTP');
      console.error(error);
      setTimeout(() => setResendStatus(''), 5000);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0B0F14] via-[#1A1F2E] to-[#0D1117] flex items-center justify-center p-4">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#00F0FF]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-[#FF006E]/10 rounded-full blur-3xl"></div>
      </div>

      {/* OTP Verification Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-[#00F0FF]/20 rounded-2xl p-8 shadow-2xl">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#00F0FF] to-[#00B8CC] rounded-xl mx-auto mb-4 flex items-center justify-center">
              <KeyRound className="w-8 h-8 text-[#0B0F14]" />
            </div>
            <h1 className="text-3xl font-bold text-[#E8EEF7]">Verify Code</h1>
            <p className="text-[#A0AEC0] text-sm mt-2">
              We sent a verification code to<br />
              <span className="font-semibold text-[#00F0FF]">{email}</span>
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {resendStatus && (
            <div className={`mb-6 p-4 rounded-lg ${
              resendStatus.includes('✓') 
                ? 'bg-green-500/10 border border-green-500/30' 
                : 'bg-amber-500/10 border border-amber-500/30'
            }`}>
              <p className={`text-sm ${
                resendStatus.includes('✓') 
                  ? 'text-green-400' 
                  : 'text-amber-400'
              }`}>
                {resendStatus}
              </p>
            </div>
          )}

          {/* OTP Input Form */}
          <form onSubmit={handleVerify} className="space-y-4 mb-6">
            <div>
              <label className="block text-[#A0AEC0] text-sm font-medium mb-2">Verification Code</label>
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
                className="w-full bg-[#0B0F14] border border-[#00F0FF]/20 rounded-lg py-4 px-4 text-center text-2xl font-bold text-[#E8EEF7] letter-spacing-3 tracking-widest placeholder-[#718096] focus:outline-none focus:border-[#00F0FF] focus:shadow-lg focus:shadow-[#00F0FF]/20 transition"
              />
              <p className="text-[#718096] text-xs mt-2">Enter 6-digit code from your email</p>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 4}
              className="w-full bg-gradient-to-r from-[#00F0FF] to-[#00B8CC] hover:from-[#00D4E0] hover:to-[#00A8BC] text-[#0B0F14] font-bold py-3 rounded-lg transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#0B0F14] border-t-transparent rounded-full animate-spin"></div>
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
            <div className="flex-1 h-px bg-[#00F0FF]/10"></div>
            <span className="text-[#718096] text-sm">OR</span>
            <div className="flex-1 h-px bg-[#00F0FF]/10"></div>
          </div>

          {/* Resend & Back Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/login')}
              className="flex-1 bg-[#252C3C] hover:bg-[#2D3548] text-[#E8EEF7] font-bold py-3 rounded-lg transition flex items-center justify-center gap-2 border border-[#00F0FF]/10"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            
            <button
              onClick={handleResendOTP}
              disabled={resendCooldown > 0}
              className={`flex-1 font-bold py-3 rounded-lg transition flex items-center justify-center gap-2 ${
                resendCooldown > 0
                  ? 'bg-[#252C3C] text-[#718096] cursor-not-allowed'
                  : 'bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/30'
              }`}
            >
              <Mail className="w-5 h-5" />
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
            </button>
          </div>

          {/* Security Info */}
          <div className="mt-6 p-3 bg-[#00F0FF]/5 border border-[#00F0FF]/10 rounded-lg">
            <p className="text-[#A0AEC0] text-xs">
              ✓ OTP expires in 10 minutes<br />
              ✓ Check your spam folder<br />
              ✓ Enterprise security verified
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
