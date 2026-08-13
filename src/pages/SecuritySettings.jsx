import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, CheckCircle2, Eye, EyeOff, ShieldCheck, AlertTriangle } from 'lucide-react';
import api from '../api';

export default function SecuritySettings() {
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

  const inputClass = "w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-[#E8EEF7] text-sm focus:outline-none focus:border-[#00F0FF] transition placeholder-[#4A5568] font-mono tracking-widest";

  const PinInput = ({ label, value, onChange, showState, toggleShow, placeholder = '••••••••' }) => (
    <div>
      <label className="block text-[#A0AEC0] text-xs uppercase tracking-wider mb-2 font-semibold">{label}</label>
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
          className={inputClass}
        />
        <button type="button" onClick={toggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718096] hover:text-[#E8EEF7] transition">
          {showState ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      <p className="text-[#4A5568] text-xs mt-1">Numbers only, 4–15 digits</p>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-[#00F0FF] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-[#00F0FF]/20 to-[#00F0FF]/5 rounded-xl flex items-center justify-center border border-[#00F0FF]/20">
          <ShieldCheck className="w-6 h-6 text-[#00F0FF]" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#E8EEF7]">Security Settings</h1>
          <p className="text-[#A0AEC0] text-sm">Manage your transaction PIN for secure money transfers</p>
        </div>
      </div>

      {/* Notification */}
      {msg.text && (
        <div className={`mb-6 p-4 rounded-xl border text-sm font-medium ${
          msg.type === 'error'
            ? 'bg-[#FF006E]/10 border-[#FF006E]/30 text-[#FF006E]'
            : 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
        }`}>{msg.text}</div>
      )}

      {/* Status Card */}
      <div className={`bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border rounded-2xl p-5 mb-6 flex items-center gap-4 ${
        hasPinSet ? 'border-[#10B981]/30' : 'border-[#F59E0B]/30'
      }`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          hasPinSet ? 'bg-[#10B981]/10' : 'bg-[#F59E0B]/10'
        }`}>
          {hasPinSet
            ? <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
            : <AlertTriangle className="w-6 h-6 text-[#F59E0B]" />}
        </div>
        <div>
          <p className="text-[#E8EEF7] font-semibold">
            {hasPinSet ? 'Transaction PIN is Active' : 'Transaction PIN Not Set'}
          </p>
          <p className="text-[#A0AEC0] text-sm mt-0.5">
            {hasPinSet
              ? 'Your transfers are protected with PIN + Email OTP authentication'
              : 'Set a transaction PIN to enable secure money transfers'}
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-[#1A1F2E] border border-white/5 rounded-2xl p-5 mb-6">
        <h2 className="text-[#E8EEF7] font-bold mb-4 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-[#00F0FF]" /> How Transaction Security Works
        </h2>
        <div className="space-y-3">
          {[
            ['1', 'Enter transfer details (receiver, amount)', '#00F0FF'],
            ['2', 'Enter your Transaction PIN', '#F59E0B'],
            ['3', 'Receive OTP on your email', '#FF006E'],
            ['4', 'Enter OTP to authorize the transfer', '#10B981'],
            ['5', 'Transaction executes + both parties receive confirmation email', '#10B981'],
          ].map(([step, text, color]) => (
            <div key={step} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                style={{ background: color + '20', color }}>
                {step}
              </div>
              <p className="text-[#A0AEC0] text-sm">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Setup Form */}
      {(mode === 'setup' || mode === 'done') && !hasPinSet && (
        <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-[#00F0FF]/20 rounded-2xl p-6">
          <h2 className="text-[#E8EEF7] font-bold mb-5 flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#00F0FF]" /> Set Transaction PIN
          </h2>
          <form onSubmit={handleSetup} className="space-y-5">
            <PinInput
              label="Create PIN"
              value={form.pin}
              onChange={v => setForm(f => ({...f, pin: v}))}
              showState={showPin}
              toggleShow={() => setShowPin(s => !s)}
            />
            <PinInput
              label="Confirm PIN"
              value={form.confirmPin}
              onChange={v => setForm(f => ({...f, confirmPin: v}))}
              showState={showConfirm}
              toggleShow={() => setShowConfirm(s => !s)}
              placeholder="Confirm your PIN"
            />
            <button type="submit" disabled={busy}
              className="w-full py-3 bg-gradient-to-r from-[#00F0FF] to-[#00B8CC] text-[#0B0F14] font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50">
              {busy ? 'Setting PIN...' : 'Set Transaction PIN'}
            </button>
          </form>
        </div>
      )}

      {/* Change PIN */}
      {hasPinSet && mode !== 'change' && (
        <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-white/5 rounded-2xl p-6">
          <h2 className="text-[#E8EEF7] font-bold mb-2">Change Transaction PIN</h2>
          <p className="text-[#A0AEC0] text-sm mb-5">Update your transaction PIN periodically for better security.</p>
          <button onClick={() => setMode('change')}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#252C3C] border border-white/10 text-[#E8EEF7] rounded-xl text-sm font-semibold hover:border-[#00F0FF]/40 transition">
            <Lock className="w-4 h-4" /> Change PIN
          </button>
        </div>
      )}

      {hasPinSet && mode === 'change' && (
        <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-[#00F0FF]/20 rounded-2xl p-6">
          <h2 className="text-[#E8EEF7] font-bold mb-5 flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#00F0FF]" /> Change Transaction PIN
          </h2>
          <form onSubmit={handleChange} className="space-y-5">
            <div>
              <label className="block text-[#A0AEC0] text-xs uppercase tracking-wider mb-2 font-semibold">Current PIN</label>
              <input
                type="password"
                value={form.currentPin}
                onChange={e => setForm(f => ({...f, currentPin: e.target.value.replace(/\D/g,'').slice(0,15)}))}
                placeholder="Enter current PIN"
                maxLength={15}
                className={inputClass}
              />
            </div>
            <PinInput
              label="New PIN"
              value={form.newPin}
              onChange={v => setForm(f => ({...f, newPin: v}))}
              showState={showPin}
              toggleShow={() => setShowPin(s => !s)}
              placeholder="Enter new PIN"
            />
            <PinInput
              label="Confirm New PIN"
              value={form.confirmNewPin}
              onChange={v => setForm(f => ({...f, confirmNewPin: v}))}
              showState={showConfirm}
              toggleShow={() => setShowConfirm(s => !s)}
              placeholder="Confirm new PIN"
            />
            <div className="flex gap-3">
              <button type="button" onClick={() => setMode('check')}
                className="flex-1 py-3 bg-[#252C3C] text-[#A0AEC0] rounded-xl text-sm font-semibold hover:bg-[#2D3748] transition">
                Cancel
              </button>
              <button type="submit" disabled={busy}
                className="flex-1 py-3 bg-gradient-to-r from-[#00F0FF] to-[#00B8CC] text-[#0B0F14] font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50">
                {busy ? 'Changing...' : 'Change PIN'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
