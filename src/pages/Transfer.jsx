import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, ArrowLeft, AlertCircle, Search, User, CreditCard, Lock, KeyRound, Eye, EyeOff, Mail } from 'lucide-react';
import api from '../api';

export default function Transfer() {
  const [step, setStep]           = useState(1); // 1=setup, 2=confirm, 3=pin, 4=otp, 5=receipt
  const [accounts, setAccounts]   = useState([]);
  const [fromId, setFromId]       = useState('');

  // Recipient lookup
  const [recipientEmail, setRecipientEmail] = useState('');
  const [lookingUp, setLookingUp]           = useState(false);
  const [recipient, setRecipient]           = useState(null); // { recipientName, accountId, accountNumberMasked, accountType }
  const [lookupError, setLookupError]       = useState('');

  const [amount, setAmount]       = useState('');
  const [reference, setReference] = useState('');
  const [loading, setLoading]     = useState(false);
  const [receipt, setReceipt]     = useState(null);
  const [error, setError]         = useState('');
  // PIN + OTP state
  const [pin, setPin]       = useState('');
  const [showPin, setShowPin] = useState(false);
  const [otp, setOtp]       = useState('');
  const [pinBusy, setPinBusy] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    api.get('/api/banking/accounts').then(res => {
      if (res.data.success && res.data.accounts.length) {
        setAccounts(res.data.accounts);
        setFromId(res.data.accounts[0].id);
      }
    }).catch(() => {});
  }, []);

  const selectedAccount = accounts.find(a => String(a.id) === String(fromId));
  const balance = Number(selectedAccount?.balance || 0);
  const fmt = (v) => '₹ ' + Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  // ── Lookup recipient by email ────────────────────────────────────
  const handleLookup = async () => {
    if (!recipientEmail.trim()) return;
    setLookingUp(true); setLookupError(''); setRecipient(null);
    try {
      const res = await api.get(`/api/banking/lookup/recipient?email=${encodeURIComponent(recipientEmail.trim())}`);
      if (res.data.success) {
        setRecipient(res.data);
      } else {
        setLookupError(res.data.message);
      }
    } catch (err) {
      setLookupError(err.response?.data?.message || 'Recipient not found. Check the email address.');
    }
    setLookingUp(false);
  };

  // ── Review step ────────────────────────────────────────────────
  const handleReview = (e) => {
    e.preventDefault();
    setError('');
    if (!recipient) { setError('Please look up a recipient first'); return; }
    if (!amount || parseFloat(amount) <= 0) { setError('Enter a valid amount'); return; }
    if (parseFloat(amount) > balance) { setError(`Insufficient balance. Available: ${fmt(balance)}`); return; }
    setStep(2);
  };

  // ── Step 2 → 3: go to PIN screen ──────────────────────────────
  const goToPinStep = () => {
    setError('');
    setPin('');
    setStep(3);
  };

  // ── Step 3: verify PIN then send OTP ───────────────────────
  const handlePinVerify = async (e) => {
    e.preventDefault();
    if (!pin.trim()) return setError('Please enter your transaction PIN');
    if (!/^\d{4,15}$/.test(pin)) return setError('PIN must be 4–15 digits');
    setPinBusy(true); setError('');
    try {
      await api.post('/api/security/pin/verify', { pin });
      await api.post('/api/security/transfer-otp/send');
      setOtp('');
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.message || 'PIN verification failed');
    }
    setPinBusy(false);
  };

  // ── Step 4: verify OTP then execute transfer ────────────────
  const handleOtpVerify = async (e) => {
    e.preventDefault();
    if (!otp.trim()) return setError('Please enter the OTP');
    setOtpBusy(true); setError('');
    try {
      await api.post('/api/security/transfer-otp/verify', { otp: otp.trim() });
      await confirmTransfer();
    } catch (err) {
      setError(err.response?.data?.message || 'Incorrect or expired OTP');
      setOtpBusy(false);
    }
  };

  // ── Execute transfer (called after OTP verified) ─────────────────
  const confirmTransfer = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.post('/api/banking/transfer', {
        fromAccountId: String(fromId),
        toAccountId:   String(recipient.accountId),
        amount:        String(amount),
        reference:     reference || 'Transfer'
      });
      if (res.data.success) { setReceipt(res.data); setStep(5); }
      else { setError(res.data.message || 'Transfer failed'); setStep(1); }
    } catch (err) {
      setError(err.response?.data?.message || 'Transfer failed. Please try again.');
      setStep(1);
    }
    setLoading(false);
    setOtpBusy(false);
  };

  const reset = () => {
    setStep(1); setAmount(''); setReference(''); setRecipient(null);
    setRecipientEmail(''); setReceipt(null); setError(''); setLookupError('');
    setPin(''); setOtp(''); setOtpSent(false);
  };

  // Progress indicator labels
  const stepLabels = ['Details', 'Review', 'PIN', 'OTP', 'Done'];

  return (
    <div className="w-full min-h-screen p-6 md:p-8">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-[#00F0FF]/10 rounded-xl flex items-center justify-center border border-[#00F0FF]/20">
            <Send className="w-6 h-6 text-[#00F0FF]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#E8EEF7]">Send Money</h1>
            <p className="text-[#A0AEC0] text-sm mt-0.5">Transfer funds to another Sovereign account</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        {/* Progress Stepper */}
        {step < 5 && (
          <div className="flex items-center gap-1 mb-7">
            {stepLabels.map((label, i) => (
              <React.Fragment key={label}>
                <div className={`flex items-center gap-1.5 ${i < stepLabels.length - 1 ? 'flex-shrink-0' : ''}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    i + 1 < step ? 'bg-[#10B981] text-white' :
                    i + 1 === step ? 'bg-[#00F0FF] text-[#0B0F14]' :
                    'bg-[#252C3C] text-[#718096]'
                  }`}>{i + 1 < step ? '✓' : i + 1}</div>
                  <span className={`text-xs font-medium ${i + 1 === step ? 'text-[#00F0FF]' : 'text-[#718096]'}`}>{label}</span>
                </div>
                {i < stepLabels.length - 1 && <div className={`flex-1 h-px ${i + 1 < step ? 'bg-[#10B981]/50' : 'bg-white/5'}`} />}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* ── STEP 1: Setup ── */}
        {step === 1 && (
          <form onSubmit={handleReview} className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-[#00F0FF]/20 rounded-2xl p-6 space-y-5">

            {/* From Account */}
            <div>
              <label className="block text-[#A0AEC0] text-xs font-semibold mb-2 uppercase tracking-wider">From Account</label>
              <select value={fromId} onChange={e => setFromId(e.target.value)}
                className="w-full bg-[#0B0F14] border border-white/10 rounded-lg px-4 py-3 text-sm text-[#E8EEF7] focus:outline-none focus:border-[#00F0FF] transition">
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.accountNumber} — {a.accountType} ({fmt(a.balance)})
                  </option>
                ))}
              </select>
            </div>

            {/* Recipient Email Lookup */}
            <div>
              <label className="block text-[#A0AEC0] text-xs font-semibold mb-2 uppercase tracking-wider">
                Recipient Email Address
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#718096]" />
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={e => { setRecipientEmail(e.target.value); setRecipient(null); setLookupError(''); }}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleLookup())}
                    className="w-full bg-[#0B0F14] border border-white/10 rounded-lg pl-9 pr-4 py-3 text-sm text-[#E8EEF7] placeholder-[#718096] focus:outline-none focus:border-[#00F0FF] transition"
                    placeholder="recipient@email.com"
                  />
                </div>
                <button type="button" onClick={handleLookup} disabled={lookingUp || !recipientEmail}
                  className="bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] px-4 py-3 rounded-lg text-sm font-semibold hover:bg-[#00F0FF]/20 transition disabled:opacity-40 whitespace-nowrap">
                  {lookingUp ? <div className="w-4 h-4 border-2 border-[#00F0FF] border-t-transparent rounded-full animate-spin" /> : 'Look Up'}
                </button>
              </div>

              {/* Lookup Error */}
              {lookupError && (
                <p className="mt-2 text-red-400 text-xs flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />{lookupError}
                </p>
              )}

              {/* Recipient Card */}
              {recipient && (
                <div className="mt-3 p-4 bg-[#10B981]/5 border border-[#10B981]/30 rounded-xl flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#00F0FF] to-[#FF006E] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {recipient.recipientName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#E8EEF7] font-semibold">{recipient.recipientName}</p>
                    <p className="text-[#A0AEC0] text-xs font-mono">{recipient.accountNumberMasked}</p>
                    <p className="text-[#718096] text-xs">{recipient.accountType} Account</p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />
                </div>
              )}

              {/* No account tip */}
              {!recipient && !lookupError && (
                <p className="text-[#718096] text-xs mt-2">
                  Enter the recipient's registered email to find their Sovereign account
                </p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-[#A0AEC0] text-xs font-semibold mb-2 uppercase tracking-wider">Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00F0FF] font-bold text-lg">₹</span>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} min="1"
                  className="w-full bg-[#0B0F14] border border-white/10 rounded-lg pl-9 pr-4 py-3 text-[#E8EEF7] text-xl font-bold focus:outline-none focus:border-[#00F0FF] transition"
                  placeholder="0.00" />
              </div>
              {selectedAccount && (
                <p className="text-xs text-[#A0AEC0] mt-1.5">
                  Available: <span className="text-[#00F0FF] font-semibold">{fmt(balance)}</span>
                </p>
              )}
            </div>

            {/* Reference */}
            <div>
              <label className="block text-[#A0AEC0] text-xs font-semibold mb-2 uppercase tracking-wider">Reference (Optional)</label>
              <input value={reference} onChange={e => setReference(e.target.value)}
                className="w-full bg-[#0B0F14] border border-white/10 rounded-lg px-4 py-3 text-sm text-[#E8EEF7] focus:outline-none focus:border-[#00F0FF] transition"
                placeholder="e.g. Rent, Loan repayment..." />
            </div>

            <button type="submit" disabled={!recipient}
              className="w-full bg-gradient-to-r from-[#00F0FF] to-[#00B8CC] text-[#0B0F14] font-bold py-3.5 rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-40">
              Review Transfer <Send className="w-4 h-4" />
            </button>

            {!recipient && (
              <p className="text-center text-[#718096] text-xs">Look up a recipient above to continue</p>
            )}
          </form>
        )}

        {/* ── STEP 2: Confirm ── */}
        {step === 2 && (
          <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-[#00F0FF]/20 rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-bold text-[#E8EEF7]">Confirm Transfer</h2>

            {/* Recipient summary */}
            <div className="flex items-center gap-4 p-4 bg-[#0B0F14]/50 rounded-xl border border-white/5">
              <div className="w-12 h-12 bg-gradient-to-br from-[#00F0FF] to-[#FF006E] rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
                {recipient?.recipientName?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-[#E8EEF7] font-bold">{recipient?.recipientName}</p>
                <p className="text-[#A0AEC0] text-sm font-mono">{recipient?.accountNumberMasked}</p>
                <p className="text-[#718096] text-xs">{recipient?.accountType} Account</p>
              </div>
            </div>

            <div className="bg-[#0B0F14] rounded-xl p-5 border border-white/5 space-y-3">
              {[
                ['From',            selectedAccount?.accountNumber],
                ['Amount',          fmt(amount)],
                ['Reference',       reference || 'Transfer'],
                ['Balance After',   fmt(balance - Number(amount))],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1.5 border-b border-white/5 last:border-0">
                  <span className="text-[#A0AEC0] text-sm">{k}</span>
                  <span className={`font-semibold text-sm ${k === 'Amount' ? 'text-[#00F0FF]' : 'text-[#E8EEF7]'}`}>{v}</span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-[#F59E0B]/5 border border-[#F59E0B]/20 rounded-lg text-xs text-[#F59E0B]">
              ⚠️ Transfers are final and cannot be reversed. Verify recipient details carefully.
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)}
                className="flex-1 bg-[#252C3C] text-[#A0AEC0] py-3 rounded-xl font-semibold hover:bg-[#2D3548] transition flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={goToPinStep}
                className="flex-1 bg-gradient-to-r from-[#00F0FF] to-[#00B8CC] text-[#0B0F14] font-bold py-3 rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2">
                Continue <Lock className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Transaction PIN ── */}
        {step === 3 && (
          <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-[#F59E0B]/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-[#F59E0B]/10 rounded-xl flex items-center justify-center">
                <Lock className="w-5 h-5 text-[#F59E0B]" />
              </div>
              <div>
                <h2 className="text-[#E8EEF7] font-bold">Enter Transaction PIN</h2>
                <p className="text-[#A0AEC0] text-xs mt-0.5">Your secure PIN to authorize this transfer</p>
              </div>
            </div>

            <div className="bg-[#0B0F14]/60 rounded-xl p-4 mb-5 border border-white/5">
              <p className="text-[#718096] text-xs">Transferring</p>
              <p className="text-[#00F0FF] font-bold text-xl">₹{Number(amount).toLocaleString('en-IN', {minimumFractionDigits:2})}</p>
              <p className="text-[#A0AEC0] text-sm">to {recipient?.recipientName}</p>
            </div>

            <form onSubmit={handlePinVerify} className="space-y-4">
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g,'').slice(0,15))}
                  placeholder="Enter your Transaction PIN"
                  maxLength={15}
                  autoFocus
                  className="w-full bg-[#0B0F14] border border-[#F59E0B]/30 focus:border-[#F59E0B] rounded-xl px-4 py-3.5 text-[#E8EEF7] text-center text-2xl tracking-[0.5em] font-mono focus:outline-none transition placeholder:text-sm placeholder:tracking-normal"
                />
                <button type="button" onClick={() => setShowPin(s=>!s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718096] hover:text-[#E8EEF7]">
                  {showPin ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              </div>
              <p className="text-[#718096] text-xs text-center">Numbers only, 4–15 digits</p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)}
                  className="flex-1 bg-[#252C3C] text-[#A0AEC0] py-3 rounded-xl font-semibold">
                  <ArrowLeft className="w-4 h-4 inline mr-1" /> Back
                </button>
                <button type="submit" disabled={pinBusy}
                  className="flex-1 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F14] font-bold py-3 rounded-xl disabled:opacity-50">
                  {pinBusy ? 'Verifying...' : 'Verify PIN'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── STEP 4: OTP Verification ── */}
        {step === 4 && (
          <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-[#FF006E]/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-[#FF006E]/10 rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5 text-[#FF006E]" />
              </div>
              <div>
                <h2 className="text-[#E8EEF7] font-bold">Email OTP Verification</h2>
                <p className="text-[#A0AEC0] text-xs mt-0.5">OTP sent to your registered email address</p>
              </div>
            </div>

            <div className="bg-[#FF006E]/5 border border-[#FF006E]/20 rounded-xl p-4 mb-5 text-center">
              <p className="text-[#A0AEC0] text-sm">Check your email for the 6-digit OTP</p>
              <p className="text-[#718096] text-xs mt-1">⚠️ OTP expires in 10 minutes</p>
            </div>

            <form onSubmit={handleOtpVerify} className="space-y-4">
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                autoFocus
                className="w-full bg-[#0B0F14] border border-[#FF006E]/30 focus:border-[#FF006E] rounded-xl px-4 py-4 text-[#E8EEF7] text-center text-3xl tracking-[0.7em] font-mono focus:outline-none transition"
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(3)}
                  className="flex-1 bg-[#252C3C] text-[#A0AEC0] py-3 rounded-xl font-semibold">
                  <ArrowLeft className="w-4 h-4 inline mr-1" /> Back
                </button>
                <button type="submit" disabled={otpBusy || loading}
                  className="flex-1 bg-gradient-to-r from-[#FF006E] to-[#E0005E] text-white font-bold py-3 rounded-xl disabled:opacity-50">
                  {otpBusy || loading ? 'Processing...' : 'Confirm Transfer'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── STEP 5: Receipt ── */}
        {step === 5 && receipt && (
          <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-[#10B981]/40 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-[#10B981]/10 rounded-full flex items-center justify-center mx-auto mb-5 border-2 border-[#10B981]/30">
              <CheckCircle2 className="w-10 h-10 text-[#10B981]" />
            </div>
            <h2 className="text-2xl font-bold text-[#E8EEF7] mb-1">Transfer Successful!</h2>
            <p className="text-[#A0AEC0] mb-6">Money sent to <span className="text-[#00F0FF] font-semibold">{recipient?.recipientName}</span></p>

            <div className="bg-[#0B0F14] rounded-xl p-5 border border-white/5 text-left space-y-2 mb-6">
              {[
                ['Transaction ID', receipt.transactionId || '—'],
                ['Amount Sent',    fmt(amount)],
                ['Recipient',      recipient?.recipientName],
                ['New Balance',    fmt(receipt.fromBalance ?? receipt.newBalance)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-[#A0AEC0] text-sm">{k}</span>
                  <span className="text-[#E8EEF7] font-semibold text-sm">{v}</span>
                </div>
              ))}
            </div>
            <button onClick={reset}
              className="w-full bg-gradient-to-r from-[#00F0FF] to-[#00B8CC] text-[#0B0F14] font-bold py-3 rounded-xl hover:opacity-90 transition">
              Make Another Transfer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
