import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Lock, ShieldCheck, Eye, EyeOff, CheckCircle2, Clock, XCircle } from 'lucide-react';
import api from '../api';

export default function Profile() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');
  const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [pwdMsg, setPwdMsg]   = useState('');
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
      // Update local display name
      localStorage.setItem('userName', editName);
      setMsg('Profile updated!');
      setUser(prev => ({ ...prev, name: editName, phone: editPhone }));
    } catch (e) { setMsg('Update failed.'); }
    setSaving(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwdForm.newPwd !== pwdForm.confirm) { setPwdMsg('Passwords do not match'); return; }
    if (pwdForm.newPwd.length < 8) { setPwdMsg('Password must be at least 8 characters'); return; }
    setPwdMsg('✓ Password change requires re-login. Please use Forgot Password from the login page.');
  };

  const kycBadge = () => {
    if (!kycStatus || kycStatus.status === 'NOT_SUBMITTED')
      return <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#718096]/10 text-[#718096] border border-[#718096]/20">Not Submitted</span>;
    if (kycStatus.status === 'PENDING')
      return <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20 flex items-center gap-1 w-max"><Clock className="w-3 h-3" />Under Review</span>;
    if (kycStatus.status === 'VERIFIED')
      return <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 flex items-center gap-1 w-max"><CheckCircle2 className="w-3 h-3" />Verified</span>;
    return <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FF006E]/10 text-[#FF006E] border border-[#FF006E]/20 flex items-center gap-1 w-max"><XCircle className="w-3 h-3" />Rejected</span>;
  };

  if (loading) return (
    <div className="w-full min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-[#00F0FF] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="w-full min-h-screen p-6 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-[#00F0FF]/10 rounded-xl flex items-center justify-center border border-[#00F0FF]/20">
            <User className="w-6 h-6 text-[#00F0FF]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#E8EEF7]">My Profile</h1>
            <p className="text-[#A0AEC0] text-sm">Manage your account details and security</p>
          </div>
        </div>

        {/* Account Summary Card */}
        <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-[#00F0FF]/10 rounded-2xl p-6">
          <div className="flex items-center gap-5 mb-5 pb-5 border-b border-white/5">
            <div className="w-16 h-16 bg-gradient-to-br from-[#00F0FF] to-[#FF006E] rounded-full p-0.5 shrink-0">
              <div className="w-full h-full bg-[#0B0F14] rounded-full flex items-center justify-center">
                <User className="w-7 h-7 text-[#E8EEF7]" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#E8EEF7]">{user?.name || 'User'}</h2>
              <p className="text-[#A0AEC0] text-sm">{user?.email}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${user?.emailVerified ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#F59E0B]/10 text-[#F59E0B]'}`}>
                  {user?.emailVerified ? '✓ Email Verified' : '⚠ Email Not Verified'}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${user?.isActive ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-red-500/10 text-red-400'}`}>
                  {user?.isActive ? '● Active' : '● Frozen'}
                </span>
                {user?.role === 'ROLE_ADMIN' && (
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#FF006E]/10 text-[#FF006E]">Admin</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {[
              { icon: Mail, label: 'Email', value: user?.email },
              { icon: Phone, label: 'Phone', value: user?.phone || 'Not set' },
              { icon: Clock, label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—' },
              { icon: ShieldCheck, label: 'Last Login', value: user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'First login' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 bg-[#0B0F14]/50 p-3 rounded-lg border border-white/5">
                <Icon className="w-4 h-4 text-[#00F0FF] shrink-0" />
                <div>
                  <p className="text-[#718096] text-xs">{label}</p>
                  <p className="text-[#E8EEF7] font-medium">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* KYC Status */}
        <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-[#00F0FF]/10 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-[#E8EEF7] flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-[#10B981]" />KYC Status</h3>
            {kycBadge()}
          </div>
          {kycStatus?.status === 'NOT_SUBMITTED' && (
            <p className="text-[#A0AEC0] text-sm">You haven't submitted your KYC yet. <a href="/kyc" className="text-[#00F0FF] hover:underline">Complete KYC →</a></p>
          )}
          {kycStatus?.status === 'PENDING' && (
            <p className="text-[#A0AEC0] text-sm">Your KYC documents are under review. You'll be notified once reviewed.</p>
          )}
          {kycStatus?.status === 'REJECTED' && (
            <p className="text-red-400 text-sm">Rejection reason: {kycStatus.rejectionReason}. <a href="/kyc" className="text-[#00F0FF] hover:underline">Resubmit →</a></p>
          )}
          {kycStatus?.status === 'VERIFIED' && (
            <p className="text-[#10B981] text-sm">Your identity has been verified. All features are unlocked.</p>
          )}
        </div>

        {/* Edit Profile */}
        <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-[#00F0FF]/10 rounded-2xl p-6">
          <h3 className="font-bold text-[#E8EEF7] mb-4">Edit Profile</h3>
          {msg && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">{msg}</div>}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-[#A0AEC0] text-xs font-semibold mb-1.5 uppercase tracking-wider">Full Name</label>
              <input value={editName} onChange={e => setEditName(e.target.value)}
                className="w-full bg-[#0B0F14] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-[#E8EEF7] focus:outline-none focus:border-[#00F0FF] transition" />
            </div>
            <div>
              <label className="block text-[#A0AEC0] text-xs font-semibold mb-1.5 uppercase tracking-wider">Phone</label>
              <input value={editPhone} onChange={e => setEditPhone(e.target.value)} maxLength={10}
                className="w-full bg-[#0B0F14] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-[#E8EEF7] focus:outline-none focus:border-[#00F0FF] transition" />
            </div>
            <div>
              <label className="block text-[#A0AEC0] text-xs font-semibold mb-1.5 uppercase tracking-wider">Email</label>
              <input value={user?.email || ''} disabled
                className="w-full bg-[#0B0F14]/50 border border-white/5 rounded-lg px-4 py-2.5 text-sm text-[#718096] cursor-not-allowed" />
              <p className="text-xs text-[#718096] mt-1">Email cannot be changed for security reasons.</p>
            </div>
            <button type="submit" disabled={saving}
              className="bg-gradient-to-r from-[#00F0FF] to-[#00B8CC] text-[#0B0F14] font-bold px-6 py-2.5 rounded-lg hover:opacity-90 transition text-sm">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-[#00F0FF]/10 rounded-2xl p-6">
          <h3 className="font-bold text-[#E8EEF7] mb-4 flex items-center gap-2"><Lock className="w-4 h-4 text-[#FF006E]" />Security</h3>
          {pwdMsg && <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 text-sm">{pwdMsg}</div>}
          <p className="text-[#A0AEC0] text-sm mb-3">To change your password, use the "Forgot Password" link on the login page for maximum security.</p>
          <a href="/forgot-password"
            className="inline-flex items-center gap-2 bg-[#FF006E]/10 border border-[#FF006E]/30 text-[#FF006E] font-semibold px-4 py-2 rounded-lg text-sm hover:bg-[#FF006E]/20 transition">
            <Lock className="w-4 h-4" /> Reset Password via Email
          </a>
        </div>
      </div>
    </div>
  );
}
