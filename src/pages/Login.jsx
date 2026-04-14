import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Globe, ArrowRight } from 'lucide-react';
import axios from 'axios';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSecureLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Backend should send OTP to email
      const response = await axios.post('http://localhost:8080/api/auth/request-otp', { email });
      localStorage.setItem('userEmail', email);
      navigate('/otp', { state: { email } });
    } catch (error) {
      setError('Failed to send OTP. Ensure backend is running.');
      console.error(error);
    }
    setLoading(false);
  };

  const handleGoogleAuth = () => {
    // Redirect to Spring Boot OAuth2 endpoint
    window.location.href = "http://localhost:8080/oauth2/authorization/google";
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0B0F14] via-[#1A1F2E] to-[#0D1117] flex items-center justify-center p-4">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#00F0FF]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-[#FF006E]/10 rounded-full blur-3xl"></div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-[#00F0FF]/20 rounded-2xl p-8 shadow-2xl">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#00F0FF] to-[#00B8CC] rounded-xl mx-auto mb-4 flex items-center justify-center">
              <Lock className="w-8 h-8 text-[#0B0F14] font-bold" />
            </div>
            <h1 className="text-3xl font-bold text-[#E8EEF7] tracking-tight">SOVEREIGN</h1>
            <p className="text-[#A0AEC0] text-sm mt-1">Enterprise Banking Platform</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Email Login Form */}
          <form onSubmit={handleSecureLogin} className="space-y-4 mb-6">
            <div>
              <label className="block text-[#A0AEC0] text-sm font-medium mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#00F0FF]" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="you@company.com"
                  className="w-full bg-[#0B0F14] border border-[#00F0FF]/20 rounded-lg py-3 pl-12 pr-4 text-[#E8EEF7] placeholder-[#718096] focus:outline-none focus:border-[#00F0FF] focus:shadow-lg focus:shadow-[#00F0FF]/20 transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#00F0FF] to-[#00B8CC] hover:from-[#00D4E0] hover:to-[#00A8BC] text-[#0B0F14] font-bold py-3 rounded-lg transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#0B0F14] border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                <>
                  Sign In with Email
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

          {/* Google OAuth Button */}
          <button
            onClick={handleGoogleAuth}
            className="w-full bg-white hover:bg-gray-100 text-[#0B0F14] font-bold py-3 rounded-lg transition flex items-center justify-center gap-2 border border-gray-200"
          >
            <Globe className="w-5 h-5" />
            Sign In with Google
          </button>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-[#718096] text-sm mb-2">
              Don't have an account? <Link to="/signup" className="text-[#00F0FF] hover:underline font-bold">Sign Up & Initialize Wallet</Link>
            </p>
            <p className="text-[#718096] text-xs opacity-75">
              🔒 Secure authentication with email verification and Google OAuth2
            </p>
          </div>

          {/* Security Info */}
          <div className="mt-6 p-3 bg-[#00F0FF]/5 border border-[#00F0FF]/10 rounded-lg">
            <p className="text-[#A0AEC0] text-xs">
              ✓ Two-factor authentication enabled
              <br />
              ✓ Enterprise-grade security
              <br />
              ✓ AES-256 encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
