import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Lock, KeyRound, CheckCircle2, Eye, EyeOff, ShieldCheck, AlertTriangle, Palette, Sparkles, Smartphone, ShieldAlert } from 'lucide-react';
import api from '../api';
import AppearanceSettings from '../components/AppearanceSettings';

const inputStyle = {
  background: 'var(--bg-input)',
  borderColor: 'var(--border-color)',
  color: 'var(--text-primary)',
  borderWidth: '1px'
};

function PinInput({ label, value, onChange, showState, toggleShow, placeholder = '••••••••' }) {
  return (
    <div>
      <label className="block text-[var(--text-secondary)] text-xs uppercase tracking-wider mb-2 font-semibold">{label}</label>
      <div className="relative">
        <input
          type={showState ? 'text' : 'password'}
          value={value}
          onChange={e => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 15);
            onChange(v);
          }}
          placeholder={placeholder}
          maxLength={15}
          style={inputStyle}
          className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition font-mono tracking-widest placeholder-[var(--text-muted)]"
        />
        <button type="button" onClick={toggleShow}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition cursor-pointer">
          {showState ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      <p className="text-[var(--text-muted)] text-xs mt-1.5">Numeric only, 4–15 digits</p>
    </div>
  );
}

export default function SecuritySettings({ defaultTab = 'security' }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if navigation requested tab=appearance or defaultTab
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || (location.pathname === '/settings' ? 'appearance' : defaultTab);
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [hasPinSet, setHasPinSet] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [mode, setMode]           = useState('check'); // check | setup | change | done
  const [showPin, setShowPin]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [msg, setMsg]             = useState({ text: '', type: 'success' });
  const [busy, setBusy]           = useState(false);

  const [form, setForm] = useState({ pin: '', confirmPin: '', currentPin: '', newPin: '', confirmNewPin: '' });

  useEffect(() => {
    api.get('/api/security/pin/status')
      .then(r => { setHasPinSet(r.data.hasPinSet); setMode(r.data.hasPinSet ? 'check' : 'setup'); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const notify = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: 'success' }), 4000);
  };

  const validatePin = (pin) => {
    if (!pin) return 'PIN is required';
    if (!/^\d+$/.test(pin)) return 'PIN must contain numbers only';
    if (pin.length < 4) return 'PIN must be at least 4 digits';
    if (pin.length > 15) return 'PIN must be at most 15 digits';
    return null;
  };

  const handleSetup = async (e) => {
    e.preventDefault();
    const err = validatePin(form.pin);
    if (err) return notify(err, 'error');
    if (form.pin !== form.confirmPin) return notify('PINs do not match', 'error');
    setBusy(true);
    try {
      await api.post('/api/security/pin/setup', { pin: form.pin });
      setHasPinSet(true);
      setMode('done');
      notify('Transaction PIN set successfully! ✓');
      setForm({ pin: '', confirmPin: '', currentPin: '', newPin: '', confirmNewPin: '' });
    } catch (e) { notify(e.response?.data?.message || 'Failed to set PIN', 'error'); }
    setBusy(false);
  };

  const handleChange = async (e) => {
    e.preventDefault();
    if (!form.currentPin) return notify('Current PIN is required', 'error');
    const err = validatePin(form.newPin);
    if (err) return notify(err, 'error');
    if (form.newPin !== form.confirmNewPin) return notify('New PINs do not match', 'error');
    if (form.currentPin === form.newPin) return notify('New PIN must be different from current PIN', 'error');
    setBusy(true);
    try {
      await api.post('/api/security/pin/change', { currentPin: form.currentPin, newPin: form.newPin });
      notify('Transaction PIN changed successfully! ✓');
      setMode('check');
      setForm({ pin: '', confirmPin: '', currentPin: '', newPin: '', confirmNewPin: '' });
    } catch (e) { notify(e.response?.data?.message || 'Failed to change PIN', 'error'); }
    setBusy(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-[#713BFF] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="page-root">
      <div className="page-content space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl flex items-center justify-center border shadow-lg"
                 style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              {activeTab === 'appearance' ? (
                <Palette className="w-7 h-7 text-[var(--accent-primary)]" />
              ) : (
                <ShieldCheck className="w-7 h-7 text-[var(--accent-primary)]" />
              )}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
                {activeTab === 'appearance' ? 'Appearance & Personalization' : 'Security & PIN Settings'}
              </h1>
              <p className="text-[var(--text-secondary)] text-sm">
                {activeTab === 'appearance'
                  ? 'Customize application visual theme, color palette, and interface typography'
                  : 'Manage your high-entropy transaction PIN and multi-layer transfer authorization'}
              </p>
            </div>
          </div>

          {/* Tab Switcher Pills */}
          <div className="flex items-center p-1 rounded-2xl border self-start md:self-auto shadow-inner"
               style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'security'
                  ? 'btn-primary-gradient text-white shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Security & PIN</span>
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'appearance'
                  ? 'btn-primary-gradient text-white shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Appearance & Themes</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Appearance & Personalization */}
        {activeTab === 'appearance' && (
          <div className="animate-in fade-in duration-200">
            <AppearanceSettings />
          </div>
        )}

        {/* Tab 2: Security & PIN Management */}
        {activeTab === 'security' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Notification alert */}
            {msg.text && (
              <div className={`p-4 rounded-xl border text-sm font-medium flex items-center gap-2 ${
                msg.type === 'error'
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}>
                {msg.type === 'error' ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                <span>{msg.text}</span>
              </div>
            )}

            {/* Responsive Grid Layout: Left = PIN Actions (7 cols), Right = Security Guide & Hardware 2FA (5 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column (7 of 12 cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Active PIN Status Card */}
                <div className="glass-card rounded-2xl p-6 shadow-xl border flex items-center justify-between gap-4"
                     style={{ background: 'var(--bg-card)', borderColor: hasPinSet ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)' }}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      hasPinSet ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                    }`}>
                      {hasPinSet ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[var(--text-primary)]">
                        {hasPinSet ? 'Transaction PIN is Configured' : 'Transaction PIN Required'}
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        {hasPinSet
                          ? 'Outbound fund transfers require your secret PIN and secondary Email OTP.'
                          : 'Set your secret transaction PIN to enable outbound transfers and token swaps.'}
                      </p>
                    </div>
                  </div>
                  
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold border shrink-0 ${
                    hasPinSet
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>
                    {hasPinSet ? 'Active' : 'Unset'}
                  </span>
                </div>

                {/* PIN Setup Form */}
                {(!hasPinSet || mode === 'setup') && (
                  <div className="glass-card rounded-2xl p-6 sm:p-8 shadow-xl space-y-5"
                       style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                    <div className="border-b border-[var(--border-color)] pb-4">
                      <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <Lock className="w-5 h-5 text-[var(--accent-primary)]" />
                        Set Transaction PIN
                      </h2>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        Choose a memorable 4–15 digit numeric code known only to you.
                      </p>
                    </div>

                    <form onSubmit={handleSetup} className="space-y-5">
                      <PinInput
                        label="Create Secret PIN *"
                        value={form.pin}
                        onChange={v => setForm(f => ({ ...f, pin: v }))}
                        showState={showPin}
                        toggleShow={() => setShowPin(s => !s)}
                      />
                      <PinInput
                        label="Confirm Secret PIN *"
                        value={form.confirmPin}
                        onChange={v => setForm(f => ({ ...f, confirmPin: v }))}
                        showState={showConfirm}
                        toggleShow={() => setShowConfirm(s => !s)}
                        placeholder="Re-enter your PIN"
                      />
                      <button
                        type="submit"
                        disabled={busy}
                        className="w-full btn-primary-gradient py-3.5 rounded-xl text-sm font-bold tracking-wide shadow-lg disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                      >
                        {busy ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            <span>Activate Transaction PIN</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}

                {/* Change PIN Trigger Card */}
                {hasPinSet && mode !== 'change' && (
                  <div className="glass-card rounded-2xl p-6 shadow-xl space-y-4"
                       style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                    <div>
                      <h2 className="text-base font-bold text-[var(--text-primary)]">Rotate Transaction PIN</h2>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        We recommend changing your transaction PIN periodically or if you suspect it has been observed.
                      </p>
                    </div>
                    <button
                      onClick={() => setMode('change')}
                      className="btn-secondary-gradient px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Change Current PIN</span>
                    </button>
                  </div>
                )}

                {/* Change PIN Form */}
                {hasPinSet && mode === 'change' && (
                  <div className="glass-card rounded-2xl p-6 sm:p-8 shadow-xl space-y-5"
                       style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                    <div className="border-b border-[var(--border-color)] pb-4 flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                          <Lock className="w-5 h-5 text-[var(--accent-primary)]" />
                          Update Transaction PIN
                        </h2>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                          Authorize rotation with your current PIN.
                        </p>
                      </div>
                      <button
                        onClick={() => setMode('check')}
                        className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <form onSubmit={handleChange} className="space-y-5">
                      <div>
                        <label className="block text-[var(--text-secondary)] text-xs uppercase tracking-wider mb-2 font-semibold">
                          Current PIN *
                        </label>
                        <input
                          type="password"
                          value={form.currentPin}
                          onChange={e => setForm(f => ({ ...f, currentPin: e.target.value.replace(/\D/g, '').slice(0, 15) }))}
                          placeholder="Enter current PIN"
                          maxLength={15}
                          style={inputStyle}
                          className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition font-mono tracking-widest placeholder-[var(--text-muted)]"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <PinInput
                          label="New Secret PIN *"
                          value={form.newPin}
                          onChange={v => setForm(f => ({ ...f, newPin: v }))}
                          showState={showPin}
                          toggleShow={() => setShowPin(s => !s)}
                          placeholder="New PIN"
                        />
                        <PinInput
                          label="Confirm New PIN *"
                          value={form.confirmNewPin}
                          onChange={v => setForm(f => ({ ...f, confirmNewPin: v }))}
                          showState={showConfirm}
                          toggleShow={() => setShowConfirm(s => !s)}
                          placeholder="Confirm PIN"
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setMode('check')}
                          className="btn-secondary-gradient flex-1 py-3 rounded-xl text-xs font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={busy}
                          className="btn-primary-gradient flex-1 py-3 rounded-xl text-xs font-bold shadow-lg disabled:opacity-50 cursor-pointer"
                        >
                          {busy ? 'Updating...' : 'Save New PIN'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

              </div>

              {/* Right Column (5 of 12 cols): How it works + Defense in depth */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* How Transaction Security Works */}
                <div className="glass-card rounded-2xl p-6 shadow-xl space-y-4"
                     style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-[var(--accent-primary)]" />
                    How Multi-Layer Security Works
                  </h3>
                  <div className="space-y-3">
                    {[
                      { step: '1', title: 'Initiate Transfer', desc: 'Specify beneficiary, amount, and payment reference' },
                      { step: '2', title: 'Validate Transaction PIN', desc: 'Hardware-hashed zero-knowledge verification' },
                      { step: '3', title: 'Email One-Time Password', desc: '6-digit cryptographic token dispatched to your email' },
                      { step: '4', title: 'ECDSA Digital Signature', desc: 'Client-side private key signs the transaction payload' },
                      { step: '5', title: 'Blockchain Consensus & Receipt', desc: 'Immutably logged onto the VaultChain EVM ledger' },
                    ].map(({ step, title, desc }) => (
                      <div key={step} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                             style={{ background: 'var(--btn-secondary-bg)', color: 'var(--accent-primary)' }}>
                          {step}
                        </div>
                        <div className="text-xs">
                          <p className="font-semibold text-[var(--text-primary)]">{title}</p>
                          <p className="text-[var(--text-muted)] text-[11px] leading-snug">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Best Practices & Guidelines */}
                <div className="glass-card rounded-2xl p-6 shadow-xl space-y-3"
                     style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-[var(--accent-primary)]" />
                    PIN Safety Guidelines
                  </h3>
                  <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Never share your PIN with anyone, including bank representatives.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Avoid sequential digits (1234) or predictable dates (birth years).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Lock your session or sign out when accessing on shared computers.</span>
                    </li>
                  </ul>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
