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

  const calculateAge = (dobString) => {
    if (!dobString) return 0;
    const parts = dobString.split('-');
    if (parts.length !== 3) return 0;
    const birthYear = parseInt(parts[0], 10);
    const birthMonth = parseInt(parts[1], 10) - 1;
    const birthDay = parseInt(parts[2], 10);

    const today = new Date();
    let age = today.getFullYear() - birthYear;
    const monthDiff = today.getMonth() - birthMonth;
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDay)) {
      age--;
    }
    return age;
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.dateOfBirth || !form.address || !form.aadhaarNumber || !form.panNumber) {
      setError('All fields are required'); return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dob = new Date(form.dateOfBirth + 'T00:00:00');
    if (isNaN(dob.getTime())) {
      setError('Please provide a valid date of birth.'); return;
    }
    if (dob > today) {
      setError('Date of birth cannot be in the future.'); return;
    }

    const age = calculateAge(form.dateOfBirth);
    if (age < 14) {
      setError('You must be at least 14 years old to complete KYC.'); return;
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

  if (loading) return <div className="w-full min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-2 border-[#713BFF] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="page-root">
      <div className="page-content space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl flex items-center justify-center border shadow-lg"
                 style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <ShieldCheck className="w-7 h-7 text-[var(--accent-primary)]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
                KYC Verification
              </h1>
              <p className="text-[var(--text-secondary)] text-sm">
                Complete regulatory verification to unlock unlimited transfers, crypto settlements, and high-tier banking.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="px-3 py-1.5 rounded-full text-xs font-mono font-semibold border flex items-center gap-1.5"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              <span className={`w-2 h-2 rounded-full ${status?.status === 'VERIFIED' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
              Status: {status?.status ? status.status.replace('_', ' ') : 'NOT SUBMITTED'}
            </span>
          </div>
        </div>

        <StatusBanner status={status} />

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Responsive Grid Layout: Left = Main Form / Data (2 cols on desktop), Right = Compliance & Tier Benefits (1 col) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Form Column (8 of 12 cols on desktop) */}
          <div className="lg:col-span-8 space-y-6">
            {(status?.status === 'NOT_SUBMITTED' || status?.status === 'REJECTED' || !status) && (
              <form onSubmit={handleSubmit} 
                    className="glass-card rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                
                <div className="border-b border-[var(--border-color)] pb-4">
                  <h3 className="font-bold text-[var(--text-primary)] text-lg flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[var(--accent-primary)]" />
                    Government Identity Submission
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Please provide your authentic details matching your Aadhaar and PAN records.
                  </p>
                </div>

                {/* Responsive 2-column input grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[var(--text-secondary)] text-xs font-semibold mb-2 uppercase tracking-wider">
                      Full Legal Name (as on Aadhaar) *
                    </label>
                    <input
                      name="fullName"
                      type="text"
                      value={form.fullName}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Rahul Sharma"
                      className="w-full rounded-xl px-4 py-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                      style={{
                        background: 'var(--bg-input)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                        borderWidth: '1px'
                      }}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider">
                        Date of Birth *
                      </label>
                      {form.dateOfBirth && (
                        <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${
                          calculateAge(form.dateOfBirth) >= 14
                            ? 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/30'
                            : 'text-rose-400 bg-rose-500/15 border border-rose-500/30'
                        }`}>
                          Age: {calculateAge(form.dateOfBirth)} yrs {calculateAge(form.dateOfBirth) < 14 ? '(Min 14)' : '✓ Eligible'}
                        </span>
                      )}
                    </div>
                    <input
                      name="dateOfBirth"
                      type="date"
                      max={new Date().toISOString().split('T')[0]}
                      value={form.dateOfBirth}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl px-4 py-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                      style={{
                        background: 'var(--bg-input)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                        borderWidth: '1px'
                      }}
                    />
                    <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
                      Must be at least 14 years old as of today to complete regulatory KYC.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] text-xs font-semibold mb-2 uppercase tracking-wider">
                    Permanent Residential Address *
                  </label>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    required
                    rows={3}
                    placeholder="Flat/House No., Building Name, Street, Locality, City, State, PIN Code"
                    className="w-full rounded-xl px-4 py-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] resize-none"
                    style={{
                      background: 'var(--bg-input)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                      borderWidth: '1px'
                    }}
                  />
                </div>

                {/* Aadhaar & PAN in responsive 2 cols */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[var(--text-secondary)] text-xs font-semibold mb-2 uppercase tracking-wider">
                      12-Digit Aadhaar Number *
                    </label>
                    <input
                      name="aadhaarNumber"
                      value={form.aadhaarNumber}
                      onChange={e => setForm({ ...form, aadhaarNumber: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                      required
                      maxLength={12}
                      placeholder="123456789012"
                      className="w-full rounded-xl px-4 py-3 text-sm font-mono tracking-widest transition focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                      style={{
                        background: 'var(--bg-input)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                        borderWidth: '1px'
                      }}
                    />
                    <span className="text-[11px] text-[var(--text-muted)] mt-1 block">
                      {form.aadhaarNumber.length}/12 digits
                    </span>
                  </div>

                  <div>
                    <label className="block text-[var(--text-secondary)] text-xs font-semibold mb-2 uppercase tracking-wider">
                      PAN Card Identifier *
                    </label>
                    <input
                      name="panNumber"
                      value={form.panNumber}
                      onChange={e => setForm({ ...form, panNumber: e.target.value.toUpperCase().slice(0, 10) })}
                      required
                      maxLength={10}
                      placeholder="ABCDE1234F"
                      className="w-full rounded-xl px-4 py-3 text-sm font-mono tracking-widest transition focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                      style={{
                        background: 'var(--bg-input)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                        borderWidth: '1px'
                      }}
                    />
                    <span className="text-[11px] text-[var(--text-muted)] mt-1 block">
                      Standard 10-char alphanumeric format
                    </span>
                  </div>
                </div>

                {/* Document preview note */}
                <div className="p-4 rounded-xl flex items-start gap-3 border"
                     style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}>
                  <Upload className="w-5 h-5 text-[var(--accent-primary)] shrink-0 mt-0.5" />
                  <div className="text-xs text-[var(--text-secondary)] space-y-1">
                    <p className="font-semibold text-[var(--text-primary)]">Instant Digital Verification Enabled</p>
                    <p>Government database cross-verification takes under 2 minutes. Physical document photo upload is not mandatory for initial tier activation.</p>
                  </div>
                </div>

                {/* Consent checkbox */}
                <div className="flex items-start gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="consent"
                    required
                    className="mt-1 w-4 h-4 rounded cursor-pointer accent-[var(--accent-primary)]"
                  />
                  <label htmlFor="consent" className="text-xs text-[var(--text-secondary)] leading-relaxed cursor-pointer">
                    I declare and certify that all details submitted above are authentic and belong to me. I authorize VAULTCHAIN and its partner financial institutions to verify my identity records against official registries in compliance with RBI AML/KYC Master Directions.
                  </label>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full btn-primary-gradient py-4 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      <span>Submit KYC for Immediate Verification</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {status?.status === 'VERIFIED' && (
              <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl"
                   style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                  <div>
                    <h3 className="font-bold text-[var(--text-primary)] text-lg flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      Verified KYC Profile
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Identity verified and recorded onto the compliant ledger.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Tier 3 Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    ['Full Legal Name', status.fullName],
                    ['Date of Birth', status.dateOfBirth],
                    ['PAN Identification', status.panNumber],
                    ['Aadhaar UID', status.aadhaarNumber ? `•••• •••• ${status.aadhaarNumber.slice(-4)}` : '•••• 1234'],
                  ].map(([label, val]) => (
                    <div key={label} className="p-4 rounded-xl border"
                         style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}>
                      <span className="text-xs uppercase font-semibold text-[var(--text-muted)] block tracking-wider mb-1">
                        {label}
                      </span>
                      <span className="text-sm font-bold text-[var(--text-primary)] font-mono">
                        {val || '—'}
                      </span>
                    </div>
                  ))}
                </div>

                {status.address && (
                  <div className="p-4 rounded-xl border"
                       style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}>
                    <span className="text-xs uppercase font-semibold text-[var(--text-muted)] block tracking-wider mb-1">
                      Verified Residential Address
                    </span>
                    <span className="text-sm text-[var(--text-primary)]">
                      {status.address}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar Column: Compliance info, Tier Privileges, Help (4 of 12 cols on desktop) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Regulatory Compliance Card */}
            <div className="glass-card rounded-2xl p-6 shadow-xl space-y-4"
                 style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center border"
                     style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}>
                  <AlertTriangle className="w-5 h-5 text-[var(--accent-primary)]" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[var(--text-primary)]">RBI AML Compliance</h4>
                  <p className="text-[11px] text-[var(--text-secondary)]">Mandatory regulatory requirement</p>
                </div>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                As per Reserve Bank of India (RBI) Anti-Money Laundering standards, full KYC documentation is required for all banking accounts exceeding ₹50,000 in monthly throughput.
              </p>
              <div className="pt-2 border-t border-[var(--border-color)] text-xs text-[var(--text-muted)] space-y-1.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>256-Bit Hardware Security Module storage</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Zero-Knowledge credential matching</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Strict non-disclosure to third parties</span>
                </div>
              </div>
            </div>

            {/* Account Tier Unlocks Card */}
            <div className="glass-card rounded-2xl p-6 shadow-xl space-y-4"
                 style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h4 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[var(--accent-primary)]" />
                Tier Benefits Unlocked
              </h4>
              <ul className="space-y-3 text-xs">
                {[
                  { title: 'Unlimited Daily Transfers', desc: 'No ₹50,000 cap on IMPS/NEFT/RTGS' },
                  { title: 'Smart Recurring Rules', desc: 'AI agent & automated treasury triggers' },
                  { title: 'Cryptographic Signatures', desc: 'Hardware-verified ECDSA transfer proofs' },
                  { title: 'Priority EVM Settlement', desc: 'Direct blockchain ledger reconciliation' }
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 pb-2.5 border-b border-[var(--border-color)] last:border-0 last:pb-0">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                          style={{ background: 'var(--btn-secondary-bg)', color: 'var(--accent-primary)' }}>
                      ✓
                    </span>
                    <div>
                      <span className="font-semibold text-[var(--text-primary)] block">{item.title}</span>
                      <span className="text-[11px] text-[var(--text-secondary)]">{item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

function StatusBanner({ status }) {
  const configs = {
    PENDING: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      icon: <Clock className="w-5 h-5 text-amber-400 shrink-0" />,
      color: 'text-amber-400',
      msg: 'Your KYC application is currently under automated compliance review. Status will update automatically within 1–2 business days.'
    },
    VERIFIED: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
      color: 'text-emerald-400',
      msg: 'Identity verification complete! Your VAULTCHAIN account has achieved Tier 3 regulatory clearance with unlimited transaction limits.'
    },
    REJECTED: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      icon: <XCircle className="w-5 h-5 text-red-400 shrink-0" />,
      color: 'text-red-400',
      msg: `Verification Unsuccessful: ${status?.rejectionReason || 'The submitted details could not be matched against official database records.'}. Please verify your legal name, PAN, and Aadhaar, then resubmit.`
    },
  };

  const cfg = configs[status?.status];
  if (!cfg) return null;

  return (
    <div className={`p-4 ${cfg.bg} border ${cfg.border} rounded-2xl flex items-start gap-3 shadow-md`}>
      {cfg.icon}
      <p className={`text-sm ${cfg.color} leading-relaxed`}>{cfg.msg}</p>
    </div>
  );
}
