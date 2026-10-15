import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Building, Send, Download, Zap, Activity, CreditCard, Shield,
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

  useEffect(() => {
    let ignore = false;
    const fetchData = async () => {
      try {
        const [accRes, kycRes] = await Promise.all([
          api.get('/api/banking/accounts'),
          api.get('/api/kyc/status').catch(() => null)
        ]);

        if (!ignore && accRes.data.success) {
          const accs = accRes.data.accounts || [];
          setAccounts(accs);
          if (accs.length > 0) {
            const txRes = await api.get(`/api/banking/transactions/${accs[0].id}`);
            if (!ignore && txRes.data.success) setTransactions(txRes.data.transactions || []);
          }
        }
        if (!ignore && kycRes?.data) setKycStatus(kycRes.data.status || 'NOT_SUBMITTED');
      } catch (e) {
        if (!ignore) console.error(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchData();
    return () => { ignore = true; };
  }, []);

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
    { name: 'Credits', value: credits || 0,  color: '#356BFF' },
    { name: 'Debits',  value: debits  || 0,  color: '#EC4899' },
  ];

  const recentTx = transactions.slice(0, 5);
  const primaryAccount = accounts[0];

  return (
    <div className="page-root">
      <div className="page-content space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-[rgba(139,146,255,0.18)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#0B1550] border border-[rgba(139,146,255,0.22)] shadow-md">
              <Building className="w-6 h-6 text-[#356BFF]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#F8FAFC]">Banking Overview</h1>
              <p className="text-[#B8C5F2] text-sm">Manage all your accounts, balances, and cards</p>
            </div>
          </div>
          <button onClick={load} className="p-2.5 rounded-xl bg-[#0B1550] border border-[rgba(139,146,255,0.22)] text-[#B8C5F2] hover:text-[#F8FAFC] hover:border-[#713BFF] transition shadow-md">
            <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* KYC Alert */}
        {kycStatus !== 'VERIFIED' && (
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${kycStatus === 'PENDING' ? 'bg-[#F59E0B]/10 border-[#F59E0B]/30' : 'bg-[#713BFF]/10 border-[#713BFF]/30'}`}>
            <div className="flex items-center gap-3">
              <Shield className={`w-5 h-5 shrink-0 ${kycStatus === 'PENDING' ? 'text-[#F59E0B]' : 'text-[#A855F7]'}`} />
              <p className="text-sm text-[#B8C5F2]">
                {kycStatus === 'PENDING' ? 'KYC verification is under review. High-value transactions may be limited.' : 'Complete KYC verification to unlock all banking features.'}
              </p>
            </div>
            {kycStatus !== 'PENDING' && (
              <Link to="/kyc" className="shrink-0 px-4 py-2 bg-gradient-to-r from-[#356BFF] to-[#713BFF] text-[#F8FAFC] text-xs font-bold rounded-xl shadow-md hover:opacity-90 transition">
                Verify Now <ArrowRight className="inline w-3 h-3 ml-1" />
              </Link>
            )}
          </div>
        )}

        {createError && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{createError}</div>}

        {/* No account yet */}
        {!loading && accounts.length === 0 && (
          <div className="text-center py-16 bg-[#111B57] bg-gradient-to-br from-[#111B57] to-[#0B1550] rounded-2xl border border-[rgba(139,146,255,0.22)] shadow-xl">
            <CreditCard className="w-14 h-14 text-[#B8C5F2]/40 mx-auto mb-5" />
            <h2 className="text-xl font-bold text-[#F8FAFC] mb-2">No Bank Account Yet</h2>
            <p className="text-[#B8C5F2] text-sm mb-6">Open your first account to get started with VAULTCHAIN Banking.</p>
            <div className="flex gap-3 justify-center">
              {['SAVINGS', 'CURRENT'].map(type => (
                <button key={type} onClick={() => createAccount(type)} disabled={creating}
                  className="bg-gradient-to-r from-[#356BFF] to-[#713BFF] text-[#F8FAFC] font-bold px-6 py-3 rounded-xl hover:opacity-95 shadow-lg shadow-[#713BFF]/25 transition disabled:opacity-50">
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
                className="relative overflow-hidden bg-[#111B57] bg-gradient-to-br from-[#111B57] via-[#0B1550] to-[#356BFF]/30 border border-[rgba(139,146,255,0.25)] rounded-2xl p-6 text-white shadow-xl group hover:border-[#713BFF]/60 transition-all duration-300">
                <div className="absolute top-0 right-0 w-44 h-44 bg-[#713BFF]/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-[#713BFF]/30 transition" />
                <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#356BFF]/20 rounded-full blur-2xl -ml-8 -mb-8 pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-[#B8C5F2] text-xs uppercase tracking-wider font-medium">Account Type</p>
                      <p className="font-bold text-lg text-[#F8FAFC]">{acc.accountType}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#050B2E]/60 border border-[rgba(139,146,255,0.22)]">
                      <CreditCard className="w-6 h-6 text-[#A855F7]" />
                    </div>
                  </div>
                  <p className="text-[#B8C5F2] text-xs mb-1">Available Balance</p>
                  <p className="text-3xl font-black mb-5 text-[#F8FAFC] tracking-tight">{fmt(acc.balance)}</p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[#B8C5F2] text-xs mb-0.5">Account Number</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-bold text-sm tracking-wider text-[#F8FAFC]">{acc.accountNumber}</p>
                        <button onClick={() => copyText(acc.accountNumber, acc.id)} className="text-[#B8C5F2] hover:text-[#356BFF] transition">
                          {copied === acc.id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${acc.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-400/20 text-red-200 border border-red-500/20'}`}>
                      {acc.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Account Card */}
            <button onClick={() => createAccount('SAVINGS')} disabled={creating}
              className="border-2 border-dashed border-[rgba(139,146,255,0.25)] rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-[#713BFF] hover:bg-[#111B57]/50 transition group min-h-[180px]">
              <div className="p-3 rounded-full bg-[#0B1550] border border-[rgba(139,146,255,0.22)] group-hover:scale-110 transition">
                <Plus className="w-7 h-7 text-[#713BFF] group-hover:text-[#A855F7] transition" />
              </div>
              <span className="text-[#B8C5F2] text-sm font-semibold group-hover:text-[#F8FAFC] transition">
                {creating ? 'Creating...' : 'Open New Account'}
              </span>
            </button>
          </div>
        )}

        {/* Bottom Grid */}
        {accounts.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="bg-[#111B57] bg-gradient-to-br from-[#111B57] to-[#0B1550] border border-[rgba(139,146,255,0.22)] rounded-2xl p-5 shadow-xl">
              <h2 className="font-bold text-[#F8FAFC] mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Send,     label: 'Transfer',   path: '/transfer',        color: '#356BFF' },
                  { icon: Download, label: 'Deposit',    path: '/deposit',         color: '#713BFF' },
                  { icon: Zap,      label: 'Smart Send', path: '/smart-transfers', color: '#A855F7' },
                  { icon: Activity, label: 'History',    path: '/transactions',    color: '#EC4899' },
                ].map(({ icon: Icon, label, path, color }) => (
                  <Link key={path} to={path}
                    className="flex flex-col items-center bg-[#050B2E]/60 border border-[rgba(139,146,255,0.18)] p-3 rounded-xl hover:border-[#713BFF]/50 hover:bg-[#0B1550] transition group">
                    <Icon className="w-6 h-6 mb-1.5 transition group-hover:scale-110" style={{ color }} />
                    <span className="text-xs font-semibold text-[#B8C5F2] group-hover:text-[#F8FAFC]">{label}</span>
                  </Link>
                ))}
              </div>

              {/* Account Info */}
              {primaryAccount && (
                <div className="mt-4 space-y-2 pt-4 border-t border-[rgba(139,146,255,0.18)]">
                  {[
                    { label: 'IBAN', value: primaryAccount.iban || 'N/A' },
                    { label: 'Overdraft', value: fmt(primaryAccount.overdraftLimit) },
                    { label: 'Currency', value: primaryAccount.currency || 'INR' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-xs">
                      <span className="text-[#B8C5F2]">{label}</span>
                      <span className="text-[#F8FAFC] font-medium font-mono">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Spending Pie Chart */}
            <div className="bg-[#111B57] bg-gradient-to-br from-[#111B57] to-[#0B1550] border border-[rgba(139,146,255,0.22)] rounded-2xl p-5 shadow-xl">
              <h2 className="font-bold text-[#F8FAFC] mb-4">Cash Flow</h2>
              {credits === 0 && debits === 0 ? (
                <div className="text-center py-10 text-[#B8C5F2] text-sm">No transactions yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} innerRadius={40} dataKey="value" paddingAngle={4}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: '#0B1550', border: '1px solid rgba(139,146,255,0.3)', borderRadius: '12px', color: '#F8FAFC' }} />
                    <Legend formatter={(v) => <span className="text-xs text-[#B8C5F2]">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-[#050B2E]/60 border border-[rgba(139,146,255,0.22)] rounded-xl p-2.5 text-center">
                  <p className="text-[#B8C5F2] text-xs mb-0.5">Total In</p>
                  <p className="text-[#356BFF] font-bold text-sm">{fmt(credits)}</p>
                </div>
                <div className="bg-[#050B2E]/60 border border-[rgba(139,146,255,0.22)] rounded-xl p-2.5 text-center">
                  <p className="text-[#B8C5F2] text-xs mb-0.5">Total Out</p>
                  <p className="text-[#EC4899] font-bold text-sm">{fmt(debits)}</p>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-[#111B57] bg-gradient-to-br from-[#111B57] to-[#0B1550] border border-[rgba(139,146,255,0.22)] rounded-2xl p-5 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-[#F8FAFC]">Recent Activity</h2>
                <Link to="/transactions" className="text-[#356BFF] hover:text-[#713BFF] text-xs font-semibold hover:underline">View all →</Link>
              </div>
              <div className="space-y-2">
                {recentTx.length === 0 && !loading && (
                  <div className="text-center py-8 text-[#B8C5F2]/50 text-sm">No transactions yet</div>
                )}
                {recentTx.map((tx, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-[rgba(139,146,255,0.1)] last:border-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${tx.direction === 'IN' ? 'bg-[#356BFF]/15 text-[#356BFF]' : 'bg-[#EC4899]/15 text-[#EC4899]'}`}>
                      {tx.direction === 'IN'
                        ? <ArrowDownRight className="w-4 h-4" />
                        : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#F8FAFC] text-xs font-medium truncate">{tx.reference || tx.type}</p>
                      <p className="text-[#B8C5F2] text-[10px]">{new Date(tx.date).toLocaleDateString()}</p>
                    </div>
                    <p className={`font-bold font-mono text-sm shrink-0 ${tx.direction === 'IN' ? 'text-emerald-400' : 'text-[#F8FAFC]'}`}>
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
