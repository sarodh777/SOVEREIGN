import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Lock, ShieldCheck, CheckCircle2, Clock, XCircle, Sparkles } from 'lucide-react';
import api from '../api';

export default function Profile() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');
  const [kycStatus, setKycStatus] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meRes, kycRes] = await Promise.all([
          api.get('/api/auth/me'),
          api.get('/api/kyc/status').catch(() => null)
        ]);
        setUser(meRes.data);
        setEditName(meRes.data.name || '');
        setEditPhone(meRes.data.phone || '');
        if (kycRes) setKycStatus(kycRes.data);
      } catch (e) {
        if (e.response?.status === 401) window.location.href = '/login';
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      localStorage.setItem('userName', editName);
      setMsg('Profile updated successfully!');
      setUser(prev => ({ ...prev, name: editName, phone: editPhone }));
    } catch { setMsg('Update failed.'); }
    setSaving(false);
  };

  const kycBadge = () => {
    if (!kycStatus || kycStatus.status === 'NOT_SUBMITTED')
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#8B92FF]/10 text-[#B8C5F2] border border-[#8B92FF]/20">Not Submitted</span>;
    if (kycStatus.status === 'PENDING')
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25 flex items-center gap-1 w-max"><Clock className="w-3 h-3" />Under Review</span>;
    if (kycStatus.status === 'VERIFIED')
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center gap-1 w-max"><CheckCircle2 className="w-3 h-3" />Verified</span>;
    return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/25 flex items-center gap-1 w-max"><XCircle className="w-3 h-3" />Rejected</span>;
  };

  if (loading) return (
    <div className="w-full min-h-[60vh] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-[#713BFF] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="page-root">
      <div className="page-content space-y-6 text-[var(--text-primary)]">
        
        {/* 1. Page Header */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-gradient-to-br from-[#356BFF]/20 to-[#713BFF]/20 rounded-xl flex items-center justify-center border border-[#8B92FF]/25 shrink-0 shadow-[0_0_15px_rgba(113,59,255,0.15)]">
            <User className="w-5 h-5 text-[#356BFF]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F8FAFC] leading-tight">My Profile</h1>
            <p className="text-[#B8C5F2] text-xs sm:text-sm mt-0.5">Manage your digital banking credentials and security settings</p>
          </div>
        </div>

        {/* 2. User Profile Card */}
        <div className="bg-[#111B57]/80 backdrop-blur-md border border-[#8B92FF]/22 rounded-2xl p-6 shadow-[0_8px_32px_rgba(5,11,46,0.5)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-[#713BFF]/15 to-transparent blur-2xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 pb-6 mb-6 border-b border-[#8B92FF]/15 relative z-10">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#356BFF] via-[#713BFF] to-[#EC4899] p-[2px] shrink-0 shadow-[0_0_20px_rgba(113,59,255,0.35)]">
              <div className="w-full h-full bg-[#0B1550] rounded-full flex items-center justify-center">
                <User className="w-7 h-7 text-[#F8FAFC]" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-bold text-[#F8FAFC] leading-tight truncate">{user?.name || 'User'}</h2>
              <p className="text-[#B8C5F2] text-xs sm:text-sm mt-1 truncate">{user?.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium h-7 border ${
                  user?.emailVerified 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' 
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                }`}>
                  {user?.emailVerified ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  {user?.emailVerified ? 'Email Verified' : 'Email Not Verified'}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium h-7 border ${
                  user?.isActive 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' 
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${user?.isActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  {user?.isActive ? 'Active' : 'Frozen'}
                </span>
                {user?.role === 'ROLE_ADMIN' && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold h-7 border bg-[#713BFF]/15 text-[#A855F7] border-[#713BFF]/30">
                    Administrator
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 4 Information Boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 relative z-10">
            {[
              { icon: Mail, label: 'Email Address', value: user?.email || '—' },
              { icon: Phone, label: 'Phone Number', value: user?.phone || 'Not provided' },
              { icon: Clock, label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—' },
              { icon: ShieldCheck, label: 'Last Login', value: user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Active session' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3.5 bg-[#0B1550]/70 p-3.5 sm:p-4 rounded-xl border border-[#8B92FF]/15 min-h-[68px]">
                <div className="w-9 h-9 rounded-lg bg-[#356BFF]/10 border border-[#356BFF]/20 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-[#356BFF]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[#B8C5F2]/70 text-[11px] font-semibold uppercase tracking-wider leading-none">{label}</p>
                  <p className="text-[#F8FAFC] text-xs sm:text-sm font-semibold truncate mt-1 leading-tight">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. KYC Status Card */}
        <div className="bg-[#111B57]/80 backdrop-blur-md border border-[#8B92FF]/22 rounded-2xl p-6 shadow-[0_8px_32px_rgba(5,11,46,0.5)]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#713BFF]/15 border border-[#713BFF]/30 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-[#A855F7]" />
              </div>
              <div>
                <h3 className="font-bold text-[#F8FAFC] text-sm sm:text-base leading-tight">KYC Verification Status</h3>
                <p className="text-[#B8C5F2] text-xs mt-0.5">Identity & regulatory verification level</p>
              </div>
            </div>
            <div className="shrink-0">
              {kycBadge()}
            </div>
          </div>
          
          <div className="mt-4 pt-3.5 border-t border-[#8B92FF]/15 text-xs sm:text-sm text-[#B8C5F2]">
            {(!kycStatus || kycStatus.status === 'NOT_SUBMITTED') && (
              <p>You haven't submitted your KYC documents yet. <a href="/kyc" className="text-[#356BFF] hover:text-[#713BFF] font-semibold hover:underline inline-flex items-center gap-1 ml-1 transition">Complete KYC →</a></p>
            )}
            {kycStatus?.status === 'PENDING' && (
              <p>Your documents are currently under review. Compliance checks usually complete within 24 hours.</p>
            )}
            {kycStatus?.status === 'REJECTED' && (
              <p className="text-rose-400">Verification rejected: {kycStatus.rejectionReason}. <a href="/kyc" className="text-[#356BFF] hover:text-[#713BFF] font-semibold hover:underline ml-1 transition">Resubmit Documents →</a></p>
            )}
            {kycStatus?.status === 'VERIFIED' && (
              <p className="text-emerald-400">Identity verified with Tier-1 compliance. All banking and smart contract features are active.</p>
            )}
          </div>
        </div>

        {/* 4. Edit Profile Card */}
        <div className="bg-[#111B57]/80 backdrop-blur-md border border-[#8B92FF]/22 rounded-2xl p-6 shadow-[0_8px_32px_rgba(5,11,46,0.5)]">
          <div className="mb-5">
            <h3 className="font-bold text-[#F8FAFC] text-base leading-tight">Edit Profile</h3>
            <p className="text-[#B8C5F2] text-xs mt-1">Update your personal contact details</p>
          </div>

          {msg && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-400 text-xs sm:text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{msg}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[#B8C5F2] text-xs font-semibold uppercase tracking-wider">Full Name</label>
              <input 
                type="text"
                value={editName} 
                onChange={e => setEditName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full h-11 bg-[#0B1550] border border-[#8B92FF]/25 rounded-xl px-4 text-sm text-[#F8FAFC] placeholder-[#8B92FF]/40 focus:outline-none focus:border-[#713BFF] focus:ring-1 focus:ring-[#713BFF] transition" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[#B8C5F2] text-xs font-semibold uppercase tracking-wider">Phone Number</label>
              <input 
                type="tel"
                value={editPhone} 
                onChange={e => setEditPhone(e.target.value)} 
                maxLength={10}
                placeholder="10-digit phone number"
                className="w-full h-11 bg-[#0B1550] border border-[#8B92FF]/25 rounded-xl px-4 text-sm text-[#F8FAFC] placeholder-[#8B92FF]/40 focus:outline-none focus:border-[#713BFF] focus:ring-1 focus:ring-[#713BFF] transition" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[#B8C5F2] text-xs font-semibold uppercase tracking-wider">Email Address</label>
              <input 
                type="email"
                value={user?.email || ''} 
                disabled
                className="w-full h-11 bg-[#0B1550]/40 border border-[#8B92FF]/15 rounded-xl px-4 text-sm text-[#B8C5F2]/50 cursor-not-allowed" 
              />
              <p className="text-xs text-[#B8C5F2]/60 mt-1.5">Email cannot be changed for security reasons.</p>
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={saving}
                className="h-11 px-6 rounded-xl font-semibold bg-gradient-to-r from-[#356BFF] to-[#713BFF] text-white hover:opacity-95 transition flex items-center justify-center gap-2 text-sm shadow-[0_0_20px_rgba(113,59,255,0.3)] disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                {saving ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* 5. Security / Change Password Card */}
        <div className="bg-[#111B57]/80 backdrop-blur-md border border-[#8B92FF]/22 rounded-2xl p-6 shadow-[0_8px_32px_rgba(5,11,46,0.5)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#713BFF]/15 border border-[#713BFF]/30 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-[#A855F7]" />
            </div>
            <h3 className="font-bold text-[#F8FAFC] text-base leading-tight">Security & Credentials</h3>
          </div>
          <p className="text-[#B8C5F2] text-xs sm:text-sm mb-4">Password resets require two-factor confirmation sent to your registered email address.</p>
          <a 
            href="/forgot-password"
            className="inline-flex items-center gap-2 bg-[#0B1550] border border-[#8B92FF]/30 text-[#F8FAFC] hover:text-white font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm hover:border-[#713BFF] transition"
          >
            <Lock className="w-3.5 h-3.5 text-[#356BFF]" /> Reset Password via Email
          </a>
        </div>

      </div>
    </div>
  );
}
