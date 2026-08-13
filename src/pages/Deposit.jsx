import React, { useState, useEffect } from 'react';
import { ArrowDownCircle, CheckCircle2, Copy, ArrowLeft } from 'lucide-react';
import api from '../api';

const PRESETS = [500, 1000, 5000, 10000, 25000, 50000];

export default function Deposit() {
  const [step, setStep]             = useState(1);
  const [amount, setAmount]         = useState('');
  const [reference, setReference]   = useState('');
  const [accounts, setAccounts]     = useState([]);
  const [accountId, setAccountId]   = useState('');
  const [loading, setLoading]       = useState(false);
  const [receipt, setReceipt]       = useState(null);
  const [error, setError]           = useState('');

  useEffect(() => {
    api.get('/api/banking/accounts').then(res => {
      if (res.data.success && res.data.accounts.length) {
        setAccounts(res.data.accounts);
        setAccountId(res.data.accounts[0].id);
      }
    }).catch(() => {});
  }, []);

  const selectedAccount = accounts.find(a => String(a.id) === String(accountId));

  const handleDeposit = async (e) => {
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
      if (res.data.success) {
        setReceipt(res.data);
        setStep(3);
      } else {
        setError(res.data.message || 'Deposit failed');
        setStep(1);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Deposit failed. Please try again.');
      setStep(1);
    }
    setLoading(false);
  };

  const reset = () => { setStep(1); setAmount(''); setReference(''); setReceipt(null); setError(''); };

  const formatCurrency = (v) => '₹ ' + Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  return (
    <div className="w-full min-h-screen p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-[#10B981]/10 rounded-xl flex items-center justify-center border border-[#10B981]/20">
            <ArrowDownCircle className="w-6 h-6 text-[#10B981]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#E8EEF7]">Deposit Funds</h1>
            <p className="text-[#A0AEC0] text-sm mt-0.5">Add money to your Sovereign account</p>
          </div>
        </div>

        {error && <div className="mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}

        {/* STEP 1: Enter Amount */}
        {step === 1 && (
          <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-[#10B981]/20 rounded-2xl p-6 space-y-5">
            <div>
              <label className="block text-[#A0AEC0] text-xs font-semibold mb-2 uppercase tracking-wider">Account</label>
              <select value={accountId} onChange={e => setAccountId(e.target.value)}
                className="w-full bg-[#0B0F14] border border-white/10 rounded-lg px-4 py-3 text-sm text-[#E8EEF7] focus:outline-none focus:border-[#10B981] transition">
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.accountNumber} — {a.accountType} ({formatCurrency(a.balance)})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#A0AEC0] text-xs font-semibold mb-2 uppercase tracking-wider">Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#10B981] font-bold text-lg">₹</span>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} min="1"
                  className="w-full bg-[#0B0F14] border border-white/10 rounded-lg pl-9 pr-4 py-3 text-[#E8EEF7] text-xl font-bold focus:outline-none focus:border-[#10B981] transition"
                  placeholder="0.00" />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {PRESETS.map(p => (
                  <button key={p} onClick={() => setAmount(String(p))}
                    className={`py-2 rounded-lg text-sm font-semibold border transition ${amount == p ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]' : 'bg-[#0B0F14] border-white/10 text-[#A0AEC0] hover:border-[#10B981]/50'}`}>
                    ₹{p.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[#A0AEC0] text-xs font-semibold mb-2 uppercase tracking-wider">Reference (Optional)</label>
              <input value={reference} onChange={e => setReference(e.target.value)}
                className="w-full bg-[#0B0F14] border border-white/10 rounded-lg px-4 py-3 text-sm text-[#E8EEF7] focus:outline-none focus:border-[#10B981] transition"
                placeholder="e.g. Salary, Investment..." />
            </div>

            <button onClick={handleDeposit}
              className="w-full bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2">
              Review Deposit <ArrowDownCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* STEP 2: Confirm */}
        {step === 2 && (
          <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-[#10B981]/20 rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-bold text-[#E8EEF7]">Confirm Deposit</h2>
            <div className="bg-[#0B0F14] rounded-xl p-5 border border-white/5 space-y-3">
              {[
                ['Account', selectedAccount?.accountNumber],
                ['Amount', formatCurrency(amount)],
                ['Reference', reference || 'Deposit'],
                ['New Balance', formatCurrency((Number(selectedAccount?.balance) || 0) + Number(amount))],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center py-1 border-b border-white/5 last:border-0">
                  <span className="text-[#A0AEC0] text-sm">{k}</span>
                  <span className={`font-semibold text-sm ${k === 'Amount' || k === 'New Balance' ? 'text-[#10B981]' : 'text-[#E8EEF7]'}`}>{v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 bg-[#252C3C] text-[#A0AEC0] py-3 rounded-xl font-semibold hover:bg-[#2D3548] transition flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={confirmDeposit} disabled={loading}
                className="flex-1 bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-bold py-3 rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Confirm Deposit'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Success */}
        {step === 3 && receipt && (
          <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-[#10B981]/40 rounded-2xl p-8 text-center shadow-[0_0_30px_rgba(16,185,129,0.1)]">
            <div className="w-20 h-20 bg-[#10B981]/10 rounded-full flex items-center justify-center mx-auto mb-5 border-2 border-[#10B981]/30">
              <CheckCircle2 className="w-10 h-10 text-[#10B981]" />
            </div>
            <h2 className="text-2xl font-bold text-[#E8EEF7] mb-2">Deposit Successful!</h2>
            <p className="text-[#A0AEC0] mb-6">Your funds have been added to your account.</p>

            <div className="bg-[#0B0F14] rounded-xl p-5 border border-white/5 text-left space-y-2 mb-6">
              {[
                ['Transaction ID', receipt.transactionId],
                ['Amount Deposited', formatCurrency(amount)],
                ['New Balance', formatCurrency(receipt.newBalance)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between"><span className="text-[#A0AEC0] text-sm">{k}</span><span className="text-[#E8EEF7] font-semibold text-sm">{v}</span></div>
              ))}
            </div>

            <button onClick={reset} className="w-full bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-bold py-3 rounded-xl hover:opacity-90 transition">
              Make Another Deposit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
