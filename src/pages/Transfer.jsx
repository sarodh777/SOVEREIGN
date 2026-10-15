import React, { useState, useEffect } from 'react';
import {
  Send, CheckCircle2, ArrowLeft, AlertCircle, Search, User, CreditCard,
  Lock, KeyRound, Eye, EyeOff, Mail, ArrowRight, ShieldCheck, AlertTriangle,
  AlertOctagon, Clock, Cpu, ShieldAlert, Fingerprint, Key, Copy, Check, Bug
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { signTransaction } from '../utils/cryptoSigner';

export default function Transfer() {
  const navigate = useNavigate();
  const [step, setStep]           = useState(1); // 1=setup, 2=confirm, 3=pin, 4=otp, 5=receipt, 6=held
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

  // AI Fraud Detection pre-check and held state
  const [riskEval, setRiskEval]             = useState(null);
  const [_evaluatingRisk, setEvaluatingRisk] = useState(false);
  const [heldInfo, setHeldInfo]             = useState(null);

  // Digital Signature state
  const [signedTxData, setSignedTxData]     = useState(null);
  const [_signingBusy, setSigningBusy]       = useState(false);
  const [tamperMode, setTamperMode]         = useState(false);
  const [tamperType, setTamperType]         = useState('amount'); // 'amount' | 'signature'
  const [copiedHash, setCopiedHash]         = useState(false);

  useEffect(() => {
    api.get('/api/banking/accounts').then(res => {
      if (res.data?.success && res.data.accounts?.length) {
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
      if (res.data?.success) {
        setRecipient(res.data);
      } else {
        setLookupError(res.data?.message || 'Recipient not found. Check the email address.');
      }
    } catch (err) {
      setLookupError(err.response?.data?.message || 'Recipient not found. Check the email address.');
    }
    setLookingUp(false);
  };

  // ── Review step (with real-time AI Fraud Pre-check + ECDSA P-256 Digital Signing) ─────────────
  const handleReview = async (e) => {
    e.preventDefault();
    setError('');
    if (!recipient) { setError('Please look up and select a recipient first'); return; }
    if (!amount || parseFloat(amount) <= 0) { setError('Enter a valid transfer amount'); return; }
    if (parseFloat(amount) > balance) { setError(`Insufficient balance. Available: ${fmt(balance)}`); return; }

    setEvaluatingRisk(true);
    setSigningBusy(true);
    try {
      // 1. AI Fraud Telemetry Pre-check
      const checkRes = await api.post('/api/banking/transfer/pre-check', {
        fromAccountId: String(fromId),
        toAccountId:   String(recipient.accountId),
        amount:        String(amount)
      });
      if (checkRes.data?.success) {
        setRiskEval(checkRes.data);
      }

      // 2. Client-Side Cryptographic Digital Signing (Web Crypto ECDSA P-256)
      const toAccNum = recipient.accountNumber || recipient.accountNumberMasked;
      const fromAccNum = selectedAccount?.accountNumber;
      const txId = `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const nonce = `nonce_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const timestamp = Math.floor(Date.now() / 1000);

      const sigResult = await signTransaction({
        transactionId: txId,
        fromAccount: fromAccNum,
        toAccount: toAccNum,
        amount: String(amount),
        timestamp,
        nonce,
        userEmail: localStorage.getItem('userEmail') || ''
      });
      setSignedTxData(sigResult);
    } catch (err) {
      console.warn('Pre-check / signing notice:', err);
    } finally {
      setEvaluatingRisk(false);
      setSigningBusy(false);
      setStep(2);
    }
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
      const res = await api.post('/api/security/transfer-otp/send');
      if (res.data?.devOtp) {
        setOtp(res.data.devOtp);
      } else {
        setOtp('');
      }
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.message || 'PIN verification failed. Please try again.');
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
      let payloadAmount = String(amount);
      let payloadSig = signedTxData?.digitalSignature;
      let payloadHash = signedTxData?.transactionHash;

      // Tamper Simulation for security testing
      if (tamperMode) {
        if (tamperType === 'amount') {
          // Send modified amount while preserving the signature of original amount
          payloadAmount = String(Number(amount) * 10 || 99999);
        } else {
          // Corrupt the signature hex
          payloadSig = payloadSig ? payloadSig.substring(0, payloadSig.length - 8) + 'deadbeef' : 'invalid_sig';
        }
      }

      const res = await api.post('/api/banking/transfer', {
        fromAccountId: String(fromId),
        toAccountId:   String(recipient.accountId),
        amount:        payloadAmount,
        reference:     reference || 'Transfer',
        verificationConfirmed: 'true',
        // Digital Signature payload
        transactionId:    signedTxData?.transactionId,
        transactionHash:  payloadHash,
        digitalSignature: payloadSig,
        publicKey:        signedTxData?.publicKey,
        nonce:            signedTxData?.nonce,
        timestamp:        String(signedTxData?.timestamp || Math.floor(Date.now() / 1000))
      });

      if (res.data?.held) {
        setHeldInfo(res.data);
        setStep(6);
      } else if (res.data?.success) {
        setReceipt({
          ...res.data,
          digitalSignature: payloadSig,
          transactionHash: payloadHash,
          publicKey: signedTxData?.publicKey,
          algorithm: 'ECDSA-P256-SHA256',
          nonce: signedTxData?.nonce,
          timestamp: signedTxData?.timestamp
        });
        setStep(5);
      } else {
        setError(res.data?.message || 'Transfer failed');
        setStep(1);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data?.reason || 'Transfer failed. Verification rejected.';
      setError(errMsg);
      // Stay on step 2 so user can see why verification failed
      setStep(2);
    }
    setLoading(false);
    setOtpBusy(false);
  };

  const reset = () => {
    setStep(1); setAmount(''); setReference(''); setRecipient(null);
    setRecipientEmail(''); setReceipt(null); setHeldInfo(null); setRiskEval(null);
    setSignedTxData(null); setTamperMode(false);
    setError(''); setLookupError(''); setPin(''); setOtp('');
  };

  // Progress indicator labels
  const stepLabels = ['Details', 'Review', 'PIN', 'OTP', 'Done'];

  // Preset amounts
  const presetAmounts = [500, 1000, 2500, 5000, 10000];

  return (
    <div className="page-root">
      <div className="page-content-sm">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-13 h-13 sm:w-14 sm:h-14 bg-[#0B1550] rounded-2xl flex items-center justify-center border border-[rgba(139,146,255,0.25)] shadow-lg shadow-[#356BFF]/10 shrink-0">
            <Send className="w-6 h-6 sm:w-7 sm:h-7 text-[#356BFF]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight">Send Money</h1>
            <p className="text-[#B8C5F2] text-sm sm:text-base mt-0.5">Transfer funds instantly to any registered VAULTCHAIN account</p>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm sm:text-base flex items-center gap-3 shadow-[0_4px_16px_rgba(239,68,68,0.15)]">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Progress Stepper */}
        {step < 5 && (
          <div className="w-full mb-7 px-1">
            <div className="flex items-center justify-between w-full">
              {stepLabels.map((label, i) => {
                const isCompleted = i + 1 < step;
                const isCurrent = i + 1 === step;
                return (
                  <React.Fragment key={label}>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        isCompleted
                          ? 'bg-gradient-to-r from-[#356BFF] to-[#713BFF] text-white shadow-[0_0_12px_rgba(113,59,255,0.35)]'
                          : isCurrent
                          ? 'bg-gradient-to-r from-[#356BFF] to-[#713BFF] text-white ring-4 ring-[#713BFF]/25 font-black shadow-[0_0_15px_rgba(113,59,255,0.4)]'
                          : 'bg-[#050B2E] text-[#B8C5F2]/50 border border-[rgba(139,146,255,0.18)]'
                      }`}>
                        {isCompleted ? '✓' : i + 1}
                      </div>
                      <span className={`text-xs sm:text-[13px] font-semibold transition-colors duration-200 hidden sm:inline ${
                        isCurrent ? 'text-[#713BFF]' : isCompleted ? 'text-[#F8FAFC]' : 'text-[#B8C5F2]/50'
                      }`}>
                        {label}
                      </span>
                    </div>

                    {/* Connector line between steps */}
                    {i < stepLabels.length - 1 && (
                      <div className={`flex-1 h-[2px] mx-2 sm:mx-3 rounded-full transition-colors duration-300 ${
                        i + 1 < step ? 'bg-gradient-to-r from-[#356BFF] to-[#713BFF]' : 'bg-[rgba(139,146,255,0.15)]'
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 1: Setup Transfer ── */}
        {step === 1 && (
          <form onSubmit={handleReview} className="bg-[#111B57] bg-gradient-to-br from-[#111B57] via-[#0B1550] to-[#111B57] border border-[rgba(139,146,255,0.22)] rounded-2xl p-7 sm:p-9 space-y-6 shadow-2xl">

            {/* From Account */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[#B8C5F2] text-xs sm:text-[13px] font-bold uppercase tracking-wider">
                  From Account
                </label>
                {selectedAccount && (
                  <span className="text-xs sm:text-sm text-[#B8C5F2]">
                    Available: <span className="text-[#356BFF] font-bold">{fmt(balance)}</span>
                  </span>
                )}
              </div>
              <div className="relative">
                <select
                  value={fromId}
                  onChange={e => setFromId(e.target.value)}
                  className="w-full h-13 bg-[#050B2E] border border-[rgba(139,146,255,0.22)] rounded-xl px-4 text-base text-[#F8FAFC] font-medium focus:outline-none focus:border-[#713BFF] focus:ring-1 focus:ring-[#713BFF] transition cursor-pointer appearance-none pr-10"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id} className="bg-[#050B2E] text-[#F8FAFC] py-2">
                      {a.accountNumber} — {a.accountType} ({fmt(a.balance)})
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#B8C5F2]">
                  <CreditCard className="w-5 h-5 text-[#713BFF]" />
                </div>
              </div>
            </div>

            {/* Recipient Email Lookup */}
            <div>
              <label className="block text-[#B8C5F2] text-xs sm:text-[13px] font-bold uppercase tracking-wider mb-2">
                Recipient Email Address
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B8C5F2]/50" />
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={e => { setRecipientEmail(e.target.value); setRecipient(null); setLookupError(''); }}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleLookup())}
                    className="w-full h-13 bg-[#050B2E] border border-[rgba(139,146,255,0.22)] rounded-xl pl-12 pr-4 text-base text-[#F8FAFC] placeholder-[#B8C5F2]/40 focus:outline-none focus:border-[#713BFF] focus:ring-1 focus:ring-[#713BFF] transition"
                    placeholder="Enter recipient's registered email"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleLookup}
                  disabled={lookingUp || !recipientEmail.trim()}
                  className="h-13 px-7 rounded-xl font-bold text-sm bg-gradient-to-r from-[#356BFF] to-[#713BFF] text-white hover:opacity-95 active:scale-[0.98] shadow-lg shadow-[#713BFF]/25 transition disabled:opacity-40 whitespace-nowrap flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  {lookingUp ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Checking...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 text-white" />
                      <span>Look Up</span>
                    </>
                  )}
                </button>
              </div>

              {/* Lookup Error */}
              {lookupError && (
                <div className="mt-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/25 flex items-center gap-2 text-red-400 text-xs sm:text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{lookupError}</span>
                </div>
              )}

              {/* Verified Recipient Card */}
              {recipient && (
                <div className="mt-3.5 p-4 rounded-xl bg-[#050B2E] border border-[rgba(139,146,255,0.25)] flex items-center justify-between gap-4 shadow-md">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#356BFF] to-[#713BFF] flex items-center justify-center text-white font-black text-lg shrink-0 shadow-md">
                      {recipient.recipientName?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[#F8FAFC] font-bold text-base truncate">{recipient.recipientName}</p>
                        <span className="text-[11px] font-bold text-[#356BFF] bg-[#356BFF]/15 border border-[#356BFF]/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Verified
                        </span>
                      </div>
                      <p className="text-[#B8C5F2] text-xs sm:text-sm font-mono mt-0.5">{recipient.accountNumberMasked} • {recipient.accountType} Account</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                </div>
              )}

              {/* Helper tip when not looked up */}
              {!recipient && !lookupError && (
                <p className="text-[#B8C5F2]/60 text-xs sm:text-[13px] mt-2 flex items-center gap-1.5">
                  <span>💡</span> Enter recipient's registered email address and click <strong>Look Up</strong> to verify recipient account details before sending.
                </p>
              )}
            </div>

            {/* Amount */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[#B8C5F2] text-xs sm:text-[13px] font-bold uppercase tracking-wider">
                  Amount (₹)
                </label>
                {balance > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmount(String(balance))}
                    className="text-xs font-bold text-[#356BFF] hover:underline cursor-pointer"
                  >
                    Use Max Balance
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#356BFF] font-black text-2xl">₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  min="1"
                  step="any"
                  className="w-full h-14 bg-[#050B2E] border border-[rgba(139,146,255,0.22)] rounded-xl pl-12 pr-4 text-[#F8FAFC] text-2xl font-bold focus:outline-none focus:border-[#713BFF] focus:ring-1 focus:ring-[#713BFF] transition placeholder-[#B8C5F2]/40"
                  placeholder="0.00"
                />
              </div>

              {/* Quick Amount Presets */}
              <div className="flex flex-wrap gap-2 mt-2.5">
                {presetAmounts.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setAmount(String(p))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                      Number(amount) === p
                        ? 'bg-gradient-to-r from-[#356BFF] to-[#713BFF] text-white border-[#713BFF] font-bold'
                        : 'bg-[#050B2E] text-[#B8C5F2] border-[rgba(139,146,255,0.18)] hover:border-[#713BFF]/50 hover:text-[#F8FAFC]'
                    }`}
                  >
                    +₹{p.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            {/* Reference */}
            <div>
              <label className="block text-[#B8C5F2] text-xs sm:text-[13px] font-bold uppercase tracking-wider mb-2">
                Reference / Note (Optional)
              </label>
              <input
                value={reference}
                onChange={e => setReference(e.target.value)}
                maxLength={60}
                className="w-full h-13 bg-[#050B2E] border border-[rgba(139,146,255,0.22)] rounded-xl px-4 text-base text-[#F8FAFC] placeholder-[#B8C5F2]/40 focus:outline-none focus:border-[#713BFF] focus:ring-1 focus:ring-[#713BFF] transition"
                placeholder="e.g. Rent payment, Invoice #1042, Family support"
              />
            </div>

            {/* CTA Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!recipient}
                className="w-full h-14 bg-gradient-to-r from-[#356BFF] to-[#713BFF] text-white font-black text-base rounded-xl hover:opacity-95 active:scale-[0.99] transition shadow-lg shadow-[#713BFF]/30 flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Review Transfer</span>
                <Send className="w-5 h-5 text-white" />
              </button>

              {!recipient && (
                <p className="text-center text-[#B8C5F2]/60 text-xs sm:text-sm mt-3">
                  Please look up and verify a recipient above to proceed
                </p>
              )}
            </div>
          </form>
        )}

        {/* ── STEP 2: Confirm ── */}
        {step === 2 && (
          <div className="bg-[#111B57] bg-gradient-to-br from-[#111B57] via-[#0B1550] to-[#111B57] border border-[rgba(139,146,255,0.22)] rounded-2xl p-7 sm:p-9 space-y-6 shadow-2xl">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#F8FAFC]">Confirm Transfer Details</h2>
              <p className="text-[#B8C5F2] text-sm mt-1">Review the transaction parameters carefully before authorizing.</p>
            </div>

            {/* Recipient summary */}
            <div className="flex items-center gap-4 p-5 bg-[#050B2E] rounded-xl border border-[rgba(139,146,255,0.2)]">
              <div className="w-14 h-14 bg-gradient-to-br from-[#356BFF] to-[#713BFF] rounded-2xl flex items-center justify-center text-white font-black text-xl shrink-0 shadow-md">
                {recipient?.recipientName?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#F8FAFC] font-bold text-lg truncate">{recipient?.recipientName}</p>
                <p className="text-[#B8C5F2] text-sm font-mono">{recipient?.accountNumberMasked}</p>
                <p className="text-[#B8C5F2]/60 text-xs mt-0.5">{recipient?.accountType} Account</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-[#A855F7] bg-[#713BFF]/15 border border-[#713BFF]/30 px-2.5 py-1 rounded-full">
                  Target Account
                </span>
              </div>
            </div>

            {/* Transaction breakdown table */}
            <div className="bg-[#050B2E] rounded-xl p-5 border border-[rgba(139,146,255,0.2)] space-y-3.5">
              {[
                ['From Account',      selectedAccount?.accountNumber + ` (${selectedAccount?.accountType})`],
                ['Transfer Amount',   fmt(amount)],
                ['Network Fee',       '₹ 0.00 (Zero Fee)'],
                ['Reference Note',    reference || 'Transfer'],
                ['Est. Balance After', fmt(balance - Number(amount))],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center py-2 border-b border-[rgba(139,146,255,0.1)] last:border-0">
                  <span className="text-[#B8C5F2] text-sm sm:text-base">{k}</span>
                  <span className={`font-bold text-sm sm:text-base ${
                    k === 'Transfer Amount' ? 'text-emerald-400 font-mono text-lg' :
                    k === 'Network Fee' ? 'text-[#356BFF]' : 'text-[#F8FAFC]'
                  }`}>
                    {v}
                  </span>
                </div>
              ))}
            </div>

            {/* AI Fraud Telemetry Banner */}
            {riskEval && (
              <div className={`p-4 rounded-xl border transition-all ${
                riskEval.riskLevel === 'HIGH'
                  ? 'bg-rose-950/30 border-rose-500/50 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                  : riskEval.riskLevel === 'MEDIUM'
                  ? 'bg-amber-950/30 border-amber-500/50 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                  : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Cpu className={`w-4 h-4 ${
                      riskEval.riskLevel === 'HIGH' ? 'text-rose-400 animate-pulse' :
                      riskEval.riskLevel === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
                    }`} />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      AI Fraud Risk Evaluation: {riskEval.riskLevel} ({riskEval.riskScore}/100)
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    riskEval.riskLevel === 'HIGH'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : riskEval.riskLevel === 'MEDIUM'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {riskEval.riskLevel === 'HIGH' ? 'TEMPORARY HOLD REQUIRED' : riskEval.riskLevel === 'MEDIUM' ? 'STEP-UP 2FA REQUIRED' : 'NORMAL CLEARANCE'}
                  </span>
                </div>

                {riskEval.reasons && riskEval.reasons.length > 0 && (
                  <div className="space-y-1 mt-2 text-xs">
                    {riskEval.reasons.map((r, i) => (
                      <div key={i} className="flex items-start gap-1.5 opacity-90">
                        <span className="text-xs mt-0.5">•</span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                )}

                {riskEval.riskLevel === 'HIGH' && (
                  <div className="mt-3 p-2.5 rounded-lg bg-rose-900/30 border border-rose-500/30 text-[11px] text-rose-200">
                    <strong>Surveillance Policy:</strong> High-risk transfers are placed on temporary security hold for administrative surveillance. Money will NOT be deducted from your account until cleared. Your account is <strong>not blocked</strong>.
                  </div>
                )}

                {riskEval.riskLevel === 'MEDIUM' && (
                  <div className="mt-3 p-2.5 rounded-lg bg-amber-900/30 border border-amber-500/30 text-[11px] text-amber-200">
                    <strong>Enhanced Verification:</strong> Abnormal transfer metrics detected. You will be prompted for OTP verification before this transfer can proceed.
                  </div>
                )}
              </div>
            )}

            {/* Digital Signature Cryptographic Verification Proof */}
            {signedTxData && (
              <div className="bg-[#050B2E] rounded-xl p-5 border border-[rgba(139,146,255,0.25)] space-y-3.5 shadow-lg">
                <div className="flex items-center justify-between border-b border-[rgba(139,146,255,0.1)] pb-3">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="w-5 h-5 text-[#713BFF]" />
                    <span className="text-sm font-bold text-[#F8FAFC]">Digital Signature (ECDSA P-256)</span>
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#713BFF]/15 text-[#A855F7] border border-[#713BFF]/30 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Client Signed
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#0B1550] p-3 rounded-lg border border-[rgba(139,146,255,0.18)]">
                    <span className="text-[#B8C5F2] block font-mono uppercase text-[10px] tracking-wider mb-1">Transaction ID</span>
                    <span className="text-[#F8FAFC] font-mono font-bold truncate block">{signedTxData.transactionId}</span>
                  </div>
                  <div className="bg-[#0B1550] p-3 rounded-lg border border-[rgba(139,146,255,0.18)]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[#B8C5F2] font-mono uppercase text-[10px] tracking-wider">SHA-256 Hash</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(signedTxData.transactionHash);
                          setCopiedHash(true);
                          setTimeout(() => setCopiedHash(false), 2000);
                        }}
                        className="text-[#356BFF] hover:text-[#713BFF] flex items-center gap-1 text-[10px] cursor-pointer"
                      >
                        {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedHash ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <span className="text-[#356BFF] font-mono font-bold truncate block text-[11px]">{signedTxData.transactionHash}</span>
                  </div>
                </div>

                <div className="bg-[#050B2E] p-3 rounded-lg border border-[rgba(139,146,255,0.18)] text-[11px] font-mono text-[#B8C5F2]">
                  <span className="text-[#B8C5F2]/70 text-[10px] block mb-1">Deterministic Canonical Serialization:</span>
                  <div className="text-[#F8FAFC] break-all bg-black/40 p-2 rounded border border-white/5 leading-relaxed text-[10px]">
                    {signedTxData.canonicalPayload}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-[#B8C5F2]/60">
                    <span>Algorithm: <strong className="text-[#B8C5F2]">ECDSA-P256-SHA256</strong></span>
                    <span>Nonce: <strong className="text-[#B8C5F2]">{signedTxData.nonce.substring(0, 16)}...</strong></span>
                  </div>
                </div>

                {/* Tamper Simulation Toggle for Testing */}
                <div className="mt-3 pt-3 border-t border-[rgba(139,146,255,0.15)]">
                  <div className="flex items-center justify-between bg-[#0B1550] p-3 rounded-xl border border-[rgba(139,146,255,0.18)]">
                    <div className="flex items-center gap-2">
                      <Bug className="w-4 h-4 text-amber-400" />
                      <div>
                        <span className="text-xs font-bold text-[#F8FAFC] block">Simulate Tamper Attack (Security Test)</span>
                        <span className="text-[10px] text-[#B8C5F2]">Test backend verification rejection when signed data is modified</span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tamperMode}
                        onChange={(e) => setTamperMode(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                    </label>
                  </div>

                  {tamperMode && (
                    <div className="mt-2.5 p-3 rounded-lg bg-rose-950/30 border border-rose-500/40 text-rose-200 text-xs space-y-2">
                      <div className="flex items-center gap-2 font-bold text-rose-300">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>TAMPER SIMULATION MODE ACTIVE</span>
                      </div>
                      <p className="text-[11px] opacity-90">
                        Payload will be altered before server processing. The backend will detect that the digital signature does not match the modified data and reject the transaction.
                      </p>
                      <div className="flex gap-2 pt-1">
                        <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                          <input
                            type="radio"
                            name="tamperType"
                            checked={tamperType === 'amount'}
                            onChange={() => setTamperType('amount')}
                            className="accent-rose-500"
                          />
                          <span>Modify Amount (Send ₹{Number(amount) * 10} with original signature)</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                          <input
                            type="radio"
                            name="tamperType"
                            checked={tamperType === 'signature'}
                            onChange={() => setTamperType('signature')}
                            className="accent-rose-500"
                          />
                          <span>Corrupt Signature Hex</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Warning banner */}
            <div className="p-4 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl text-xs sm:text-sm text-[#F59E0B] flex items-start gap-3">
              <span className="text-base shrink-0">⚠️</span>
              <span>
                <strong>Irreversible Transaction:</strong> Direct inter-account blockchain settlement transfers execute instantly and cannot be recalled or modified once authorized.
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="h-13 flex-1 bg-[#0B1550] text-[#B8C5F2] hover:text-[#F8FAFC] hover:bg-[#050B2E] rounded-xl font-bold transition flex items-center justify-center gap-2 cursor-pointer border border-[rgba(139,146,255,0.2)]"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Edit
              </button>
              <button
                type="button"
                onClick={goToPinStep}
                className="h-13 flex-1 bg-gradient-to-r from-[#356BFF] to-[#713BFF] text-white font-black text-base rounded-xl hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center gap-2 shadow-lg shadow-[#713BFF]/30 cursor-pointer"
              >
                <span>Authorize with PIN</span>
                <Lock className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Transaction PIN ── */}
        {step === 3 && (
          <div className="bg-[#111B57] bg-gradient-to-br from-[#111B57] via-[#0B1550] to-[#111B57] border border-[rgba(139,146,255,0.25)] rounded-2xl p-7 sm:p-9 shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-13 h-13 bg-[#713BFF]/10 border border-[#713BFF]/30 rounded-2xl flex items-center justify-center shrink-0">
                <Lock className="w-6 h-6 text-[#A855F7]" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#F8FAFC]">Enter Transaction PIN</h2>
                <p className="text-[#B8C5F2] text-sm mt-0.5">Your secure financial PIN is required to authorize this transfer</p>
              </div>
            </div>

            <div className="bg-[#050B2E] rounded-xl p-5 mb-6 border border-[rgba(139,146,255,0.2)] flex items-center justify-between">
              <div>
                <p className="text-[#B8C5F2] text-xs font-semibold uppercase tracking-wider">Transferring</p>
                <p className="text-[#356BFF] font-black text-2xl mt-0.5 font-mono">₹{Number(amount).toLocaleString('en-IN', {minimumFractionDigits:2})}</p>
              </div>
              <div className="text-right">
                <p className="text-[#B8C5F2] text-xs font-semibold uppercase tracking-wider">To Recipient</p>
                <p className="text-[#F8FAFC] font-bold text-base mt-0.5">{recipient?.recipientName}</p>
              </div>
            </div>

            <form onSubmit={handlePinVerify} className="space-y-6">
              <div>
                <label className="block text-[#B8C5F2] text-xs sm:text-[13px] font-bold uppercase tracking-wider mb-2 text-center">
                  Transaction Security PIN
                </label>
                <div className="relative max-w-md mx-auto">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pin}
                    onChange={e => setPin(e.target.value.replace(/\D/g,'').slice(0,15))}
                    placeholder="••••••"
                    maxLength={15}
                    autoFocus
                    className="w-full h-15 bg-[#050B2E] border-2 border-[rgba(139,146,255,0.25)] focus:border-[#713BFF] rounded-xl px-4 text-[#F8FAFC] text-center text-3xl tracking-[0.5em] font-mono focus:outline-none transition shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(s => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B8C5F2] hover:text-[#F8FAFC] cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                  </button>
                </div>
                <p className="text-[#B8C5F2]/60 text-xs text-center mt-2">Numbers only (4–15 digits)</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="h-13 flex-1 bg-[#0B1550] text-[#B8C5F2] hover:text-[#F8FAFC] hover:bg-[#050B2E] rounded-xl font-bold transition flex items-center justify-center gap-2 cursor-pointer border border-[rgba(139,146,255,0.2)]"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="submit"
                  disabled={pinBusy || !pin}
                  className="h-13 flex-1 bg-gradient-to-r from-[#356BFF] to-[#713BFF] text-white font-black text-base rounded-xl hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-[#713BFF]/30"
                >
                  {pinBusy ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying PIN...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Proceed to OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── STEP 4: OTP Verification ── */}
        {step === 4 && (
          <div className="bg-[#111B57] bg-gradient-to-br from-[#111B57] via-[#0B1550] to-[#111B57] border border-[rgba(139,146,255,0.25)] rounded-2xl p-7 sm:p-9 shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-13 h-13 bg-[#0B1550] border border-[rgba(139,146,255,0.22)] rounded-2xl flex items-center justify-center shrink-0">
                <Mail className="w-6 h-6 text-[#356BFF]" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#F8FAFC]">Email OTP Verification</h2>
                <p className="text-[#B8C5F2] text-sm mt-0.5">Two-factor authorization code sent to your registered email</p>
              </div>
            </div>

            <div className="bg-[#050B2E] border border-[rgba(139,146,255,0.2)] rounded-xl p-5 mb-6 text-center space-y-1.5">
              <p className="text-[#F8FAFC] font-medium text-base">Check your inbox for the 6-digit confirmation code</p>
              <p className="text-[#B8C5F2] text-xs sm:text-sm">
                OTP expires in 10 minutes (Demo Test Code: <span className="text-[#356BFF] font-mono font-bold">123456</span>)
              </p>
            </div>

            <form onSubmit={handleOtpVerify} className="space-y-6">
              <div className="max-w-md mx-auto">
                <label className="block text-[#B8C5F2] text-xs sm:text-[13px] font-bold uppercase tracking-wider mb-2 text-center">
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  className="w-full h-16 bg-[#050B2E] border-2 border-[rgba(139,146,255,0.25)] focus:border-[#713BFF] rounded-xl px-4 text-[#F8FAFC] text-center text-3xl tracking-[0.7em] font-mono focus:outline-none transition shadow-inner"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="h-13 flex-1 bg-[#0B1550] text-[#B8C5F2] hover:text-[#F8FAFC] hover:bg-[#050B2E] rounded-xl font-bold transition flex items-center justify-center gap-2 cursor-pointer border border-[rgba(139,146,255,0.2)]"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to PIN
                </button>
                <button
                  type="submit"
                  disabled={otpBusy || loading || otp.length < 6}
                  className="h-13 flex-1 bg-gradient-to-r from-[#356BFF] to-[#713BFF] text-white font-black text-base rounded-xl hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-[#713BFF]/30"
                >
                  {otpBusy || loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Executing Transfer...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm & Send ₹{Number(amount).toLocaleString('en-IN')}</span>
                      <Send className="w-4 h-4 text-white" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── STEP 5: Receipt ── */}
        {step === 5 && receipt && (
          <div className="bg-[#111B57] bg-gradient-to-br from-[#111B57] via-[#0B1550] to-[#111B57] border border-[rgba(139,146,255,0.3)] rounded-2xl p-8 sm:p-10 text-center shadow-2xl">
            <div className="w-20 h-20 bg-emerald-500/15 rounded-3xl flex items-center justify-center mx-auto mb-5 border-2 border-emerald-500/40 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] mb-1.5">Transfer Successful!</h2>
            <p className="text-[#B8C5F2] text-base mb-6">
              Funds transferred immediately to <span className="text-[#356BFF] font-bold">{recipient?.recipientName}</span>
            </p>

            <div className="bg-[#050B2E] rounded-xl p-6 border border-[rgba(139,146,255,0.2)] text-left space-y-3.5 mb-7">
              {[
                ['Transaction ID', receipt.transactionId || '—'],
                ['Amount Sent',    fmt(amount)],
                ['Recipient',      recipient?.recipientName],
                ['Recipient Account', recipient?.accountNumberMasked],
                ['New Balance',    fmt(receipt.fromBalance ?? receipt.newBalance)],
                ['Status',         'Settled on Blockchain'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center py-1.5 border-b border-[rgba(139,146,255,0.1)] last:border-0">
                  <span className="text-[#B8C5F2] text-sm sm:text-base">{k}</span>
                  <span className={`font-bold text-sm sm:text-base ${
                    k === 'Amount Sent' ? 'text-emerald-400 font-mono' :
                    k === 'Status' ? 'text-emerald-400' : 'text-[#F8FAFC]'
                  }`}>
                    {v}
                  </span>
                </div>
              ))}
            </div>

            {/* Cryptographic Digital Signature Verification Proof */}
            <div className="bg-[#050B2E] rounded-xl p-5 border border-[rgba(139,146,255,0.25)] text-left mb-7 space-y-3 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-5 h-5 text-[#713BFF]" />
                  <span className="text-sm font-bold text-[#F8FAFC]">Digital Signature Proof</span>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Signature Verified
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-[rgba(139,146,255,0.1)]">
                  <span className="text-[#B8C5F2]">Verification Status:</span>
                  <span className="text-emerald-400 font-bold">VERIFIED (ECDSA P-256)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[rgba(139,146,255,0.1)]">
                  <span className="text-[#B8C5F2]">SHA-256 Digest:</span>
                  <span className="text-[#356BFF] font-mono font-medium text-[11px] truncate max-w-[260px] sm:max-w-none">
                    {receipt.transactionHash || signedTxData?.transactionHash || '—'}
                  </span>
                </div>
                {receipt.digitalSignature && (
                  <div className="flex justify-between items-center py-1 border-b border-[rgba(139,146,255,0.1)]">
                    <span className="text-[#B8C5F2]">Digital Signature:</span>
                    <span className="text-[#B8C5F2] font-mono text-[11px] truncate max-w-[260px] sm:max-w-none">
                      {receipt.digitalSignature.substring(0, 32)}...
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#B8C5F2]">Replay Protection:</span>
                  <span className="text-[#B8C5F2] font-mono text-[11px]">Nonce & Timestamp Validated</span>
                </div>
              </div>
            </div>

            <button
              onClick={reset}
              className="w-full h-14 bg-gradient-to-r from-[#356BFF] to-[#713BFF] text-white font-black text-base rounded-xl hover:opacity-95 active:scale-[0.99] transition shadow-lg shadow-[#713BFF]/30 cursor-pointer"
            >
              Make Another Transfer
            </button>
          </div>
        )}

        {/* ── STEP 6: Held for Security Review ── */}
        {step === 6 && heldInfo && (
          <div className="bg-gradient-to-br from-[#180F16] via-[#120B13] to-[#0E070F] border border-rose-500/50 rounded-2xl p-8 sm:p-10 text-center shadow-[0_16px_50px_rgba(0,0,0,0.7),0_0_30px_rgba(244,63,94,0.18)]">
            <div className="w-20 h-20 bg-rose-500/15 rounded-3xl flex items-center justify-center mx-auto mb-5 border-2 border-rose-500/40 shadow-[0_0_25px_rgba(244,63,94,0.3)] animate-pulse">
              <Clock className="w-10 h-10 text-rose-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-1.5">
              Transaction Temporarily Held
            </h2>
            <p className="text-rose-300/80 text-sm sm:text-base mb-6 max-w-lg mx-auto">
              Our automated AI Fraud Surveillance Engine flagged unusual telemetry for this transfer. For your security, this transaction is on temporary hold for review.
            </p>

            <div className="bg-[#0A070B] rounded-xl p-6 border border-rose-900/40 text-left space-y-3.5 mb-7">
              {[
                ['Transaction ID', heldInfo.transactionId || '—'],
                ['Attempted Amount', fmt(amount)],
                ['Intended Recipient', recipient?.recipientName],
                ['Target Account', recipient?.accountNumberMasked],
                ['Risk Level', 'HIGH (Score: ' + (heldInfo.riskScore || '—') + '/100)'],
                ['Account Balance Status', 'Preserved (₹ 0.00 Deducted)'],
                ['Review Status', 'Awaiting Administrator Resolution'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
                  <span className="text-slate-400 text-xs sm:text-sm">{k}</span>
                  <span className={`font-bold text-xs sm:text-sm ${
                    k === 'Risk Level' ? 'text-rose-400' :
                    k === 'Account Balance Status' ? 'text-emerald-400' :
                    k === 'Review Status' ? 'text-amber-300' : 'text-white'
                  }`}>
                    {v}
                  </span>
                </div>
              ))}
            </div>

            {heldInfo.reasons && heldInfo.reasons.length > 0 && (
              <div className="p-4 bg-rose-950/40 border border-rose-800/40 rounded-xl text-left mb-7">
                <p className="text-xs font-bold text-rose-300 uppercase tracking-wider mb-2">
                  Flagged Risk Indicators:
                </p>
                <div className="space-y-1">
                  {heldInfo.reasons.map((r, i) => (
                    <div key={i} className="text-xs text-rose-200/90 flex items-start gap-2">
                      <span className="text-rose-400">•</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-400 mb-7 text-left">
              💡 <strong>Account Integrity Guarantee:</strong> Your account is never permanently blocked based on automated AI scoring. Our compliance team verifies held transactions. You can track this in your dashboard or contact support.
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 h-13 bg-[#0B1550] text-[#B8C5F2] hover:text-[#F8FAFC] hover:bg-[#050B2E] rounded-xl font-bold transition flex items-center justify-center gap-2 cursor-pointer border border-[rgba(139,146,255,0.22)]"
              >
                Return to Dashboard
              </button>
              <button
                onClick={reset}
                className="flex-1 h-13 bg-gradient-to-r from-[#356BFF] to-[#713BFF] text-white font-black rounded-xl hover:opacity-95 active:scale-[0.99] transition shadow-lg shadow-[#713BFF]/25 cursor-pointer"
              >
                New Transfer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
