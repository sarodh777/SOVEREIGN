import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock, CheckCircle2, XCircle, Upload, AlertTriangle } from 'lucide-react';
import api from '../api';

export default function KYC() {
  const [status, setStatus]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm]       = useState({
    fullName: '', dateOfBirth: '', address: '',
    aadhaarNumber: '', panNumber: ''
  });

  useEffect(() => {
    api.get('/api/kyc/status').then(res => {
      setStatus(res.data);
      if (res.data.status !== 'NOT_SUBMITTED') {
        setForm(prev => ({
          ...prev,
          fullName: res.data.fullName || '',
          dateOfBirth: res.data.dateOfBirth || '',
          address: res.data.address || '',
          panNumber: res.data.panNumber || '',
        }));
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.dateOfBirth || !form.address || !form.aadhaarNumber || !form.panNumber) {
      setError('All fields are required'); return;
    }
    if (!/^\d{12}$/.test(form.aadhaarNumber)) { setError('Aadhaar must be 12 digits'); return; }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.panNumber.toUpperCase())) { setError('Invalid PAN format (e.g. ABCDE1234F)'); return; }

    setSubmitting(true); setError('');
    try {
      const res = await api.post('/api/kyc/submit', { ...form, panNumber: form.panNumber.toUpperCase() });
      setSuccess(res.data.message);
      setStatus({ status: 'PENDING', ...form });
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.');
    }
    setSubmitting(false);
  };

  const StatusBanner = () => {
    const configs = {
      PENDING:      { bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/30', icon: <Clock className="w-5 h-5 text-[#F59E0B]" />, color: 'text-[#F59E0B]', msg: 'Your KYC is under review. Our team will verify your documents within 1-2 business days.' },
      VERIFIED:     { bg: 'bg-[#10B981]/10', border: 'border-[#10B981]/30', icon: <CheckCircle2 className="w-5 h-5 text-[#10B981]" />, color: 'text-[#10B981]', msg: 'Your identity has been verified. All banking features are fully unlocked.' },
      REJECTED:     { bg: 'bg-red-500/10', border: 'border-red-500/30', icon: <XCircle className="w-5 h-5 text-red-400" />, color: 'text-red-400', msg: `Rejected: ${status?.rejectionReason || 'Does not meet requirements'}. Please resubmit with correct information.` },
    };
    const cfg = configs[status?.status];
    if (!cfg) return null;
    return (
      <div className={`p-4 ${cfg.bg} border ${cfg.border} rounded-xl flex items-start gap-3 mb-6`}>
        {cfg.icon}
        <p className={`text-sm ${cfg.color}`}>{cfg.msg}</p>
      </div>
    );
  };

  if (loading) return <div className="w-full min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-2 border-[#00F0FF] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="w-full min-h-screen p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-[#10B981]/10 rounded-xl flex items-center justify-center border border-[#10B981]/20">
            <ShieldCheck className="w-6 h-6 text-[#10B981]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#E8EEF7]">KYC Verification</h1>
            <p className="text-[#A0AEC0] text-sm">Verify your identity to unlock all banking features</p>
          </div>
        </div>

        <StatusBanner />

        {error && <div className="mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}
        {success && <div className="mb-5 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">{success}</div>}

        {/* Info Banner */}
        <div className="mb-6 p-4 bg-[#00F0FF]/5 border border-[#00F0FF]/15 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-[#00F0FF] mt-0.5 shrink-0" />
          <div className="text-xs text-[#A0AEC0] space-y-1">
            <p><strong className="text-[#E8EEF7]">Why KYC?</strong> As per RBI guidelines, KYC is mandatory for accounts with transactions above ₹50,000.</p>
            <p>Your data is encrypted and stored securely. We never share it with third parties.</p>
          </div>
        </div>

        {/* Form — allow resubmit if rejected */}
        {(status?.status === 'NOT_SUBMITTED' || status?.status === 'REJECTED' || !status) && (
          <form onSubmit={handleSubmit} className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-[#10B981]/20 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-[#E8EEF7] mb-2">Personal Information</h3>

            {[
              { name: 'fullName', label: 'Full Name (as per Aadhaar)', placeholder: 'John Michael Doe' },
              { name: 'dateOfBirth', label: 'Date of Birth', placeholder: '', type: 'date' },
            ].map(({ name, label, placeholder, type }) => (
              <div key={name}>
                <label className="block text-[#A0AEC0] text-xs font-semibold mb-1.5 uppercase tracking-wider">{label}</label>
                <input name={name} type={type || 'text'} value={form[name]} onChange={handleChange} required placeholder={placeholder}
                  className="w-full bg-[#0B0F14] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-[#E8EEF7] focus:outline-none focus:border-[#10B981] transition" />
              </div>
            ))}

            <div>
              <label className="block text-[#A0AEC0] text-xs font-semibold mb-1.5 uppercase tracking-wider">Residential Address</label>
              <textarea name="address" value={form.address} onChange={handleChange} required rows={3}
                className="w-full bg-[#0B0F14] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-[#E8EEF7] focus:outline-none focus:border-[#10B981] transition resize-none"
                placeholder="House No, Street, City, State, PIN" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#A0AEC0] text-xs font-semibold mb-1.5 uppercase tracking-wider">Aadhaar Number</label>
                <input name="aadhaarNumber" value={form.aadhaarNumber} onChange={e => setForm({...form, aadhaarNumber: e.target.value.replace(/\D/g, '').slice(0,12)})}
                  required maxLength={12} placeholder="12-digit Aadhaar"
                  className="w-full bg-[#0B0F14] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-[#E8EEF7] font-mono focus:outline-none focus:border-[#10B981] transition" />
              </div>
              <div>
                <label className="block text-[#A0AEC0] text-xs font-semibold mb-1.5 uppercase tracking-wider">PAN Number</label>
                <input name="panNumber" value={form.panNumber} onChange={e => setForm({...form, panNumber: e.target.value.toUpperCase()})}
                  required maxLength={10} placeholder="ABCDE1234F"
                  className="w-full bg-[#0B0F14] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-[#E8EEF7] font-mono focus:outline-none focus:border-[#10B981] transition" />
              </div>
            </div>

            <div className="p-3 bg-[#0B0F14]/50 border border-white/5 rounded-lg flex items-center gap-3">
              <Upload className="w-4 h-4 text-[#718096]" />
              <p className="text-xs text-[#718096]">Document upload (Aadhaar photo, selfie) — coming in next release. Text submission is sufficient for verification.</p>
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input type="checkbox" id="consent" required className="mt-0.5 accent-[#10B981]" />
              <label htmlFor="consent" className="text-xs text-[#A0AEC0]">I confirm that the information provided is accurate and I consent to identity verification as per applicable regulations.</label>
            </div>

            <button type="submit" disabled={submitting}
              className="w-full bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50">
              {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><ShieldCheck className="w-4 h-4" />Submit KYC for Verification</>}
            </button>
          </form>
        )}

        {status?.status === 'VERIFIED' && (
          <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-[#10B981]/20 rounded-2xl p-6">
            <h3 className="font-bold text-[#E8EEF7] mb-4">Verified Information</h3>
            <div className="space-y-3">
              {[
                ['Full Name', status.fullName],
                ['Date of Birth', status.dateOfBirth],
                ['PAN Number', status.panNumber],
                ['Aadhaar', status.aadhaarNumber],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-white/5 last:border-0">
                  <span className="text-[#A0AEC0] text-sm">{k}</span>
                  <span className="text-[#E8EEF7] font-medium text-sm">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
