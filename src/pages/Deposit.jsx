import React, { useState, useEffect } from 'react';
import { ArrowDownCircle, CheckCircle2, ArrowLeft, ShieldCheck, Clock, Info, Zap } from 'lucide-react';
import api from '../api';

const PRESETS = [500, 1000, 5000, 10000, 25000, 50000];

/* ─── Shared Info Panel ──────────────────────────────────────────────────── */
function DepositInfoPanel({ balance, amount }) {
  const fmt = (v) => '₹ ' + Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const projected = (Number(balance || 0) + Number(amount || 0));

  return (
    <div className="space-y-4">
      {/* Balance preview */}
      <div className="bg-[#111B57] bg-gradient-to-br from-[#111B57] to-[#0B1550] border border-[rgba(139,146,255,0.22)] rounded-2xl p-5 shadow-xl">
        <p className="text-[#B8C5F2] text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-[#356BFF]" /> Balance Preview
        </p>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[#B8C5F2] text-sm">Current</span>
            <span className="text-[#F8FAFC] font-semibold text-sm">{fmt(balance)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#B8C5F2] text-sm">Deposit</span>
            <span className="text-emerald-400 font-semibold text-sm">+ {fmt(amount || 0)}</span>
          </div>
          <div className="h-px bg-[rgba(139,146,255,0.15)]" />
          <div className="flex justify-between items-center">
            <span className="text-[#B8C5F2] text-sm font-semibold">After Deposit</span>
            <span className="text-[#F8FAFC] font-bold text-base">{fmt(projected)}</span>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-[#111B57] bg-gradient-to-br from-[#111B57] to-[#0B1550] border border-[rgba(139,146,255,0.22)] rounded-2xl p-5 shadow-xl">
        <p className="text-[#B8C5F2] text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-[#A855F7]" /> How It Works
        </p>
        <ol className="space-y-2.5">
          {[
            'Select your account and enter amount',
            'Review the transaction summary',
            'Confirm — funds are credited instantly',
            'Transaction is recorded on the blockchain',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-[#B8C5F2]">
              <span className="w-5 h-5 rounded-full bg-[#713BFF]/20 border border-[#713BFF]/40 text-[#A855F7] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* Security */}
      <div className="bg-[#111B57] bg-gradient-to-br from-[#111B57] to-[#0B1550] border border-[rgba(139,146,255,0.22)] rounded-2xl p-5 shadow-xl">
        <p className="text-[#B8C5F2] text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-[#713BFF]" /> Security
        </p>
        <ul className="space-y-2">
          {[
            'Transactions are JWT-authenticated',
            'Immutable blockchain audit trail',
            'All sessions are encrypted end-to-end',
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-[#B8C5F2]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function Deposit() {
  const [step, setStep]           = useState(1);
  const [amount, setAmount]       = useState('');
  const [reference, setReference] = useState('');
  const [accounts, setAccounts]   = useState([]);
  const [accountId, setAccountId] = useState('');
  const [loading, setLoading]     = useState(false);
  const [receipt, setReceipt]     = useState(null);
  const [error, setError]         = useState('');

  useEffect(() => {
    api.get('/api/banking/accounts').then(res => {
      if (res.data.success && res.data.accounts.length) {
        setAccounts(res.data.accounts);
        setAccountId(res.data.accounts[0].id);
      }
    }).catch(() => {});
  }, []);

  const selectedAccount = accounts.find(a => String(a.id) === String(accountId));

  const handleDeposit = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) { setError('Enter a valid amount'); return; }
    if (!accountId) { setError('No account found'); return; }
    setStep(2);
  };

  const confirmDeposit = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.post('/api/banking/deposit', {
        accountId: String(accountId),
        amount: String(amount),
        reference: reference || 'Deposit'
      });
      if (res.data.success) { setReceipt(res.data); setStep(3); }
      else { setError(res.data.message || 'Deposit failed'); setStep(1); }
    } catch (err) {
      setError(err.response?.data?.message || 'Deposit failed. Please try again.');
      setStep(1);
    }
    setLoading(false);
  };

  const reset = () => { setStep(1); setAmount(''); setReference(''); setReceipt(null); setError(''); };
  const fmt   = (v) => '₹ ' + Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  return (
    <div className="page-root">
      <div className="page-content">

        {/* ── Page Header ── */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-[#0B1550] rounded-2xl flex items-center justify-center border border-[rgba(139,146,255,0.22)] shadow-md shrink-0">
            <ArrowDownCircle className="w-6 h-6 text-[#356BFF]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#F8FAFC]">Deposit Funds</h1>
            <p className="text-[#B8C5F2] text-sm mt-0.5">Add money directly to your VAULTCHAIN account</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* ── Two-column on lg+, stacked below ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">

          {/* ── LEFT: Form ── */}
          <div>
            {/* STEP 1 */}
            {step === 1 && (
              <div className="bg-[#111B57] bg-gradient-to-br from-[#111B57] to-[#0B1550] border border-[rgba(139,146,255,0.22)] rounded-2xl p-6 space-y-5 shadow-xl">
                <div>
                  <label className="block text-[#B8C5F2] text-xs font-semibold mb-2 uppercase tracking-wider">Account</label>
                  <select value={accountId} onChange={e => setAccountId(e.target.value)}
                    className="w-full bg-[#050B2E] border border-[rgba(139,146,255,0.22)] rounded-xl px-4 py-3 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#713BFF] transition">
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.accountNumber} — {a.accountType} ({fmt(a.balance)})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#B8C5F2] text-xs font-semibold mb-2 uppercase tracking-wider">Amount (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#356BFF] font-bold text-lg">₹</span>
                    <input
                      type="number" value={amount} onChange={e => setAmount(e.target.value)} min="1"
                      className="w-full bg-[#050B2E] border border-[rgba(139,146,255,0.22)] rounded-xl pl-9 pr-4 py-3 text-[#F8FAFC] text-xl font-bold focus:outline-none focus:border-[#713BFF] transition"
                      placeholder="0.00"
                    />
                  </div>
                  {/* Preset grid — 3 cols on sm, 6 cols on md+ */}
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-3">
                    {PRESETS.map(p => (
                      <button key={p} type="button" onClick={() => setAmount(String(p))}
                        className={`py-2 rounded-xl text-sm font-semibold border transition ${amount == p ? 'bg-gradient-to-r from-[#356BFF]/25 to-[#713BFF]/25 border-[#713BFF] text-[#F8FAFC]' : 'bg-[#050B2E] border-[rgba(139,146,255,0.18)] text-[#B8C5F2] hover:border-[#713BFF]/50'}`}>
                        ₹{p.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[#B8C5F2] text-xs font-semibold mb-2 uppercase tracking-wider">Reference (Optional)</label>
                  <input
                    value={reference} onChange={e => setReference(e.target.value)}
                    className="w-full bg-[#050B2E] border border-[rgba(139,146,255,0.22)] rounded-xl px-4 py-3 text-sm text-[#F8FAFC] placeholder-[#B8C5F2]/50 focus:outline-none focus:border-[#713BFF] transition"
                    placeholder="e.g. Salary, Investment..."
                  />
                </div>

                <button onClick={handleDeposit}
                  className="w-full bg-gradient-to-r from-[#356BFF] to-[#713BFF] text-[#F8FAFC] font-bold py-3.5 rounded-xl hover:opacity-95 shadow-lg shadow-[#713BFF]/25 transition flex items-center justify-center gap-2">
                  Review Deposit <ArrowDownCircle className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="bg-[#111B57] bg-gradient-to-br from-[#111B57] to-[#0B1550] border border-[rgba(139,146,255,0.22)] rounded-2xl p-6 space-y-5 shadow-xl">
                <h2 className="text-lg font-bold text-[#F8FAFC]">Confirm Deposit</h2>
                <div className="bg-[#050B2E] rounded-xl p-5 border border-[rgba(139,146,255,0.18)] space-y-3">
                  {[
                    ['Account',     selectedAccount?.accountNumber],
                    ['Amount',      fmt(amount)],
                    ['Reference',   reference || 'Deposit'],
                    ['New Balance', fmt((Number(selectedAccount?.balance) || 0) + Number(amount))],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between items-center py-1 border-b border-[rgba(139,146,255,0.1)] last:border-0">
                      <span className="text-[#B8C5F2] text-sm">{k}</span>
                      <span className={`font-semibold text-sm ${k === 'Amount' || k === 'New Balance' ? 'text-emerald-400 font-mono' : 'text-[#F8FAFC]'}`}>{v}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)}
                    className="flex-1 bg-[#0B1550] border border-[rgba(139,146,255,0.22)] text-[#B8C5F2] py-3 rounded-xl font-semibold hover:bg-[#050B2E] transition flex items-center justify-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button onClick={confirmDeposit} disabled={loading}
                    className="flex-1 bg-gradient-to-r from-[#356BFF] to-[#713BFF] text-[#F8FAFC] font-bold py-3 rounded-xl hover:opacity-95 shadow-lg shadow-[#713BFF]/25 transition flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Confirm Deposit'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && receipt && (
              <div className="bg-[#111B57] bg-gradient-to-br from-[#111B57] to-[#0B1550] border border-[rgba(139,146,255,0.3)] rounded-2xl p-8 text-center shadow-xl">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-5 border-2 border-emerald-500/30">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-[#F8FAFC] mb-2">Deposit Successful!</h2>
                <p className="text-[#B8C5F2] mb-6">Your funds have been securely credited to your account.</p>
                <div className="bg-[#050B2E] rounded-xl p-5 border border-[rgba(139,146,255,0.18)] text-left space-y-2.5 mb-6">
                  {[
                    ['Transaction ID',   receipt.transactionId],
                    ['Amount Deposited', fmt(amount)],
                    ['New Balance',      fmt(receipt.newBalance)],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-[#B8C5F2] text-sm">{k}</span>
                      <span className="text-[#F8FAFC] font-semibold text-sm font-mono">{v}</span>
                    </div>
                  ))}
                </div>
                <button onClick={reset}
                  className="w-full bg-gradient-to-r from-[#356BFF] to-[#713BFF] text-[#F8FAFC] font-bold py-3.5 rounded-xl hover:opacity-95 shadow-lg shadow-[#713BFF]/25 transition">
                  Make Another Deposit
                </button>
              </div>
            )}
          </div>

          {/* ── RIGHT: Info panel (desktop only, hidden on success screen) ── */}
          {step !== 3 && (
            <div className="hidden lg:block">
              <DepositInfoPanel
                balance={selectedAccount?.balance || 0}
                amount={amount}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
