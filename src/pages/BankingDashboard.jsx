import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Building, Send, Download, Minus, Activity, CreditCard, Shield,
  Wallet, ArrowRight, RefreshCcw, Copy, CheckCircle2, Plus, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import api from '../api';

export default function BankingDashboard() {
  const [accounts, setAccounts]       = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [copied, setCopied]           = useState('');
  const [kycStatus, setKycStatus]     = useState('NOT_SUBMITTED');
  const [creating, setCreating]       = useState(false);
  const [createError, setCreateError] = useState('');

  const fmt = (v) => '₹ ' + Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [accRes, kycRes] = await Promise.all([
        api.get('/api/banking/accounts'),
        api.get('/api/kyc/status').catch(() => null)
      ]);

      if (accRes.data.success) {
        const accs = accRes.data.accounts || [];
        setAccounts(accs);
        if (accs.length > 0) {
          const txRes = await api.get(`/api/banking/transactions/${accs[0].id}`);
          if (txRes.data.success) setTransactions(txRes.data.transactions || []);
        }
      }
      if (kycRes?.data) setKycStatus(kycRes.data.status || 'NOT_SUBMITTED');
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const createAccount = async (type) => {
    setCreating(true); setCreateError('');
    try {
      const res = await api.post('/api/banking/account/create', { accountType: type });
      if (res.data.success) { await load(); }
      else setCreateError(res.data.message);
    } catch (e) {
      setCreateError(e.response?.data?.message || 'Failed to create account');
    }
    setCreating(false);
  };

  // Build pie chart data from real transactions
  const credits = transactions.filter(t => t.direction === 'IN').reduce((s, t) => s + Number(t.amount), 0);
  const debits  = transactions.filter(t => t.direction === 'OUT').reduce((s, t) => s + Number(t.amount), 0);
  const pieData = [
    { name: 'Credits', value: credits || 0,  color: '#10B981' },
    { name: 'Debits',  value: debits  || 0,  color: '#FF006E' },
  ];

  const recentTx = transactions.slice(0, 5);
  const primaryAccount = accounts[0];

  return (
    <div className="w-full min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-[#00F0FF]/10">
          <div className="flex items-center gap-3">
            <Building className="w-7 h-7 text-[#00F0FF]" />
            <div>
              <h1 className="text-2xl font-bold text-[#E8EEF7]">Banking Overview</h1>
              <p className="text-[#A0AEC0] text-sm">Manage all your accounts and cards</p>
            </div>
          </div>
          <button onClick={load} className="p-2 text-[#A0AEC0] hover:text-[#00F0FF] transition">
            <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* KYC Alert */}
        {kycStatus !== 'VERIFIED' && (
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${kycStatus === 'PENDING' ? 'bg-[#F59E0B]/5 border-[#F59E0B]/20' : 'bg-[#FF006E]/5 border-[#FF006E]/20'}`}>
            <div className="flex items-center gap-3">
              <Shield className={`w-5 h-5 shrink-0 ${kycStatus === 'PENDING' ? 'text-[#F59E0B]' : 'text-[#FF006E]'}`} />
              <p className="text-sm text-[#A0AEC0]">
                {kycStatus === 'PENDING' ? 'KYC verification is under review. High-value transactions may be limited.' : 'Complete KYC verification to unlock all banking features.'}
              </p>
            </div>
            {kycStatus !== 'PENDING' && (
              <Link to="/kyc" className="shrink-0 px-4 py-2 bg-[#FF006E]/10 border border-[#FF006E]/30 text-[#FF006E] text-xs font-bold rounded-lg hover:bg-[#FF006E]/20 transition">
                Verify Now <ArrowRight className="inline w-3 h-3 ml-1" />
              </Link>
            )}
          </div>
        )}

        {createError && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{createError}</div>}

        {/* No account yet */}
        {!loading && accounts.length === 0 && (
          <div className="text-center py-16 bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] rounded-2xl border border-white/5">
            <CreditCard className="w-14 h-14 text-[#4A5568] mx-auto mb-5" />
            <h2 className="text-xl font-bold text-[#E8EEF7] mb-2">No Bank Account Yet</h2>
            <p className="text-[#A0AEC0] text-sm mb-6">Open your first account to get started with Sovereign Banking.</p>
            <div className="flex gap-3 justify-center">
              {['SAVINGS', 'CURRENT'].map(type => (
                <button key={type} onClick={() => createAccount(type)} disabled={creating}
                  className="bg-gradient-to-r from-[#00F0FF] to-[#00B8CC] text-[#0B0F14] font-bold px-6 py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50">
                  {creating ? '...' : `Open ${type} Account`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Account Cards */}
        {accounts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {accounts.map((acc) => (
              <div key={acc.id}
                className="relative overflow-hidden bg-gradient-to-br from-[#00B8CC] to-[#005F70] rounded-2xl p-6 text-white shadow-lg">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-10 -mt-10" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full -ml-8 -mb-8" />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-white/70 text-xs uppercase tracking-wider">Account Type</p>
                      <p className="font-bold text-lg">{acc.accountType}</p>
                    </div>
                    <CreditCard className="w-8 h-8 text-white/80" />
                  </div>
                  <p className="text-white/60 text-xs mb-1">Available Balance</p>
                  <p className="text-3xl font-black mb-5">{fmt(acc.balance)}</p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-white/60 text-xs mb-0.5">Account Number</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-bold text-sm tracking-wider">{acc.accountNumber}</p>
                        <button onClick={() => copyText(acc.accountNumber, acc.id)} className="text-white/60 hover:text-white">
                          {copied === acc.id ? <CheckCircle2 className="w-3.5 h-3.5 text-green-300" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${acc.status === 'ACTIVE' ? 'bg-green-400/20 text-green-200' : 'bg-red-400/20 text-red-200'}`}>
                      {acc.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Account Card */}
            <button onClick={() => createAccount('SAVINGS')} disabled={creating}
              className="border-2 border-dashed border-[#00F0FF]/20 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-[#00F0FF]/40 hover:bg-[#00F0FF]/5 transition group min-h-[180px]">
              <Plus className="w-10 h-10 text-[#00F0FF]/40 group-hover:text-[#00F0FF] transition" />
              <span className="text-[#A0AEC0] text-sm font-medium group-hover:text-[#00F0FF] transition">
                {creating ? 'Creating...' : 'Open New Account'}
              </span>
            </button>
          </div>
        )}

        {/* Bottom Grid */}
        {accounts.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-white/5 rounded-2xl p-5">
              <h2 className="font-bold text-[#E8EEF7] mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Send,     label: 'Transfer',  path: '/transfer',     color: '#00F0FF' },
                  { icon: Download, label: 'Deposit',   path: '/deposit',      color: '#10B981' },
                  { icon: Minus,    label: 'Withdraw',  path: '/withdraw',     color: '#FF006E' },
                  { icon: Activity, label: 'History',   path: '/transactions', color: '#F59E0B' },
                ].map(({ icon: Icon, label, path, color }) => (
                  <Link key={path} to={path}
                    className="flex flex-col items-center bg-[#0B0F14] border border-white/5 p-3 rounded-xl hover:border-opacity-50 transition group"
                    onMouseEnter={e => e.currentTarget.style.borderColor = color + '50'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}>
                    <Icon className="w-6 h-6 mb-1.5 transition" style={{ color }} />
                    <span className="text-xs font-medium text-[#A0AEC0] group-hover:text-[#E8EEF7]">{label}</span>
                  </Link>
                ))}
              </div>

              {/* Account Info */}
              {primaryAccount && (
                <div className="mt-4 space-y-2 pt-4 border-t border-white/5">
                  {[
                    { label: 'IBAN', value: primaryAccount.iban || 'N/A' },
                    { label: 'Overdraft', value: fmt(primaryAccount.overdraftLimit) },
                    { label: 'Currency', value: primaryAccount.currency || 'INR' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-xs">
                      <span className="text-[#718096]">{label}</span>
                      <span className="text-[#E8EEF7] font-medium font-mono">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Spending Pie Chart */}
            <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-white/5 rounded-2xl p-5">
              <h2 className="font-bold text-[#E8EEF7] mb-4">Cash Flow</h2>
              {credits === 0 && debits === 0 ? (
                <div className="text-center py-10 text-[#A0AEC0] text-sm">No transactions yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} innerRadius={40} dataKey="value" paddingAngle={4}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: '#0B0F14', border: '1px solid #00F0FF30', borderRadius: '8px', color: '#E8EEF7' }} />
                    <Legend formatter={(v) => <span className="text-xs text-[#A0AEC0]">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-[#10B981]/5 border border-[#10B981]/20 rounded-lg p-2.5 text-center">
                  <p className="text-[#718096] text-xs mb-0.5">Total In</p>
                  <p className="text-[#10B981] font-bold text-sm">{fmt(credits)}</p>
                </div>
                <div className="bg-[#FF006E]/5 border border-[#FF006E]/20 rounded-lg p-2.5 text-center">
                  <p className="text-[#718096] text-xs mb-0.5">Total Out</p>
                  <p className="text-[#FF006E] font-bold text-sm">{fmt(debits)}</p>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-white/5 rounded-2xl p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-[#E8EEF7]">Recent Activity</h2>
                <Link to="/transactions" className="text-[#00F0FF] text-xs hover:underline">View all →</Link>
              </div>
              <div className="space-y-2">
                {recentTx.length === 0 && !loading && (
                  <div className="text-center py-8 text-[#718096] text-sm">No transactions yet</div>
                )}
                {recentTx.map((tx, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${tx.direction === 'IN' ? 'bg-[#10B981]/10' : 'bg-[#FF006E]/10'}`}>
                      {tx.direction === 'IN'
                        ? <ArrowDownRight className="w-4 h-4 text-[#10B981]" />
                        : <ArrowUpRight className="w-4 h-4 text-[#FF006E]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#E8EEF7] text-xs font-medium truncate">{tx.reference || tx.type}</p>
                      <p className="text-[#718096] text-[10px]">{new Date(tx.date).toLocaleDateString()}</p>
                    </div>
                    <p className={`font-bold font-mono text-sm shrink-0 ${tx.direction === 'IN' ? 'text-[#10B981]' : 'text-[#E8EEF7]'}`}>
                      {tx.direction === 'IN' ? '+' : '−'}{fmt(tx.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
