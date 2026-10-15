import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import {
  CreditCard, Send, Plus, TrendingUp, User, ShieldCheck, Activity,
  Link as LinkIcon, CheckCircle2, AlertTriangle, Calendar, History, Search,
  ArrowDownRight, ArrowUpRight, Copy, RefreshCw, Wallet, Bell, Eye, EyeOff,
  Sparkles, Lock, Shield, Layers, ChevronRight, FileText, Cpu, Check
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DigitalSignatureSection from '../components/DigitalSignatureSection';
import BlockchainLivingVisual from '../components/BlockchainLivingVisual';
import CountUp from '../components/CountUp';

export default function Dashboard() {
  const navigate = useNavigate();
  const email    = localStorage.getItem('userEmail') || '';
  const userName = localStorage.getItem('userName') || email.split('@')[0];

  const [account, setAccount]       = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [txSearch, setTxSearch]     = useState('');
  const [txFilter, setTxFilter]     = useState('all');
  const [loading, setLoading]       = useState(true);
  const [copied, setCopied]         = useState(false);
  const [isBalanceHidden, setIsBalanceHidden] = useState(() => {
    return localStorage.getItem('vc_hide_balance') === 'true';
  });

  // Listen to global balance toggle from TopBar / Command Palette
  useEffect(() => {
    const handleBalanceToggle = (e) => {
      if (e.detail?.hidden !== undefined) {
        setIsBalanceHidden(e.detail.hidden);
      }
    };
    window.addEventListener('vaultchain-balance-visibility', handleBalanceToggle);
    return () => window.removeEventListener('vaultchain-balance-visibility', handleBalanceToggle);
  }, []);

  const toggleLocalBalance = () => {
    setIsBalanceHidden(prev => {
      const next = !prev;
      localStorage.setItem('vc_hide_balance', String(next));
      window.dispatchEvent(new CustomEvent('vaultchain-balance-visibility', { detail: { hidden: next } }));
      return next;
    });
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const accRes = await api.get('/api/banking/accounts');
      if (accRes.data.success && accRes.data.accounts.length > 0) {
        const acc = accRes.data.accounts[0];
        setAccount(acc);
        localStorage.setItem('accountId', acc.id);

        const txRes = await api.get(`/api/banking/transactions/${acc.id}`);
        if (txRes.data.success) setTransactions(txRes.data.transactions || []);

        try {
          const fraudRes = await api.get('/api/banking/fraud/alerts');
          if (fraudRes.data?.success) setSecurityAlerts(fraudRes.data.alerts || []);
        } catch {
          // Non-critical fraud load
        }
      }
    } catch (err) {
      if (err.response?.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Determine greeting based on current local hour
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  // Calculate real Inflow vs Outflow
  const totalInflow = transactions
    .filter(tx => tx.direction === 'IN')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const totalOutflow = transactions
    .filter(tx => tx.direction === 'OUT')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  // Build chart data from real transactions (last 6 months)
  const chartData = (() => {
    const months = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months[d.toLocaleString('default', { month: 'short' })] = { income: 0, expenses: 0 };
    }
    transactions.forEach(tx => {
      const d = new Date(tx.date);
      const mon = d.toLocaleString('default', { month: 'short' });
      if (months[mon] !== undefined) {
        if (tx.direction === 'IN') months[mon].income += Number(tx.amount);
        else months[mon].expenses += Number(tx.amount);
      }
    });
    return Object.entries(months).map(([name, v]) => ({ name, ...v }));
  })();

  const [currentDate] = useState(() => Date.now());

  const filtered = transactions.filter(tx => {
    const matchSearch = !txSearch || (tx.reference || tx.type || '').toLowerCase().includes(txSearch.toLowerCase());
    const matchFilter = txFilter === 'all' ? true :
      txFilter === '7days' ? new Date(tx.date) > new Date(currentDate - 7*864e5) :
      new Date(tx.date) > new Date(currentDate - 30*864e5);
    return matchSearch && matchFilter;
  });

  return (
    <div className="page-root">
      <div className="page-content space-y-6">

        {/* ── 1. CINEMATIC FINTECH HERO WELCOME ─────────────────── */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#10164A]/90 via-[#111B57]/80 to-[#0A0F35]/90 border border-[#8B92FF]/25 p-6 sm:p-8 shadow-[0_12px_40px_rgba(5,7,32,0.6)] overflow-hidden">
          {/* Ambient Lighting Orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-b from-[#7C3AED]/20 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-gradient-to-t from-[#4169FF]/15 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#4169FF]/15 text-[#60A5FA] border border-[#4169FF]/30">
                  <Sparkles className="w-3.5 h-3.5 text-[#A855F7] animate-pulse" />
                  Fintech 3.0 Engine
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  ECDSA P-256 Validated
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#172368] text-[#B8C5F2] border border-[#8B92FF]/20">
                  EVM Consensus Synced
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                {greeting}, <span className="bg-gradient-to-r from-[#F8FAFC] via-[#B8C5F2] to-[#A855F7] bg-clip-text text-transparent">{userName}</span>
              </h1>
              <p className="text-sm text-[#B8C5F2] mt-1.5 max-w-xl">
                Your high-assurance blockchain ledger is synchronized. All transfers execute with cryptographic client-side signatures and zero-trust verification.
              </p>
            </div>

            {/* Quick Action Navigation Buttons */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                to="/transfer"
                className="btn-primary-gradient px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Send Funds
              </Link>
              <Link
                to="/deposit"
                className="btn-secondary-gradient px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#4169FF]" />
                Deposit
              </Link>
              <Link
                to="/smart-transfers"
                className="btn-secondary-gradient px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer"
              >
                <Cpu className="w-4 h-4 text-[#A855F7]" />
                AI Smart Rules
              </Link>
            </div>
          </div>
        </div>

        {/* Security Surveillance Notification (if any) */}
        {securityAlerts.some(a => a.status === 'HELD') && (
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-500/10 dark:bg-rose-950/40 border border-rose-500/30 shadow-lg">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 dark:text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h4 className="font-bold text-sm text-[var(--text-primary)]">Security Surveillance Notice</h4>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30">
                    TRANSACTION TEMPORARILY HELD
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium leading-relaxed">
                  You have transaction(s) temporarily placed on hold by our AI Fraud Surveillance System for security verification. Money has not been deducted.
                </p>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {securityAlerts.filter(a => a.status === 'HELD').map((a) => (
                    <div key={a.id} className="text-xs font-mono px-3 py-1.5 rounded-xl bg-[var(--bg-card)] border border-rose-500/30 text-[var(--text-primary)] flex items-center gap-2 shadow-sm">
                      <span className="text-[var(--text-secondary)]">Tx: {a.transactionId}</span>
                      <span className="font-bold text-[var(--text-primary)]">₹{Number(a.amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                      <span className="text-rose-500 dark:text-rose-400 font-semibold">({a.riskLevel} Risk)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 2. FINANCIAL OVERVIEW & ACCOUNT CARDS ───────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Holographic Account Card */}
          <div className="relative rounded-2xl bg-gradient-to-br from-[#10164A] via-[#111B57] to-[#172368] border border-[#8B92FF]/25 p-6 shadow-xl flex flex-col justify-between hologram-sheen overflow-hidden group">
            <div className="absolute top-0 right-0 w-36 h-36 bg-[#7C3AED]/20 rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition duration-500" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-gradient-to-tr from-[#4169FF] to-[#7C3AED] text-white shadow-md">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">{account?.accountType || 'PRIMARY SAVINGS'}</h3>
                    <span className="text-[10px] text-[#A855F7] font-mono">VAULTCHAIN MASTER DEBIT</span>
                  </div>
                </div>
                <button
                  onClick={toggleLocalBalance}
                  className="p-1.5 rounded-lg bg-[#050720]/60 hover:bg-[#050720] text-[#B8C5F2] hover:text-white border border-[#8B92FF]/20 transition"
                  title="Toggle balance privacy"
                >
                  {isBalanceHidden ? <EyeOff className="w-4 h-4 text-[#A855F7]" /> : <Eye className="w-4 h-4 text-[#4169FF]" />}
                </button>
              </div>

              {/* Account Balance Display */}
              <div className="my-4">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#7E8DC4]">Total Active Balance</span>
                <div className="text-3xl font-black text-white mt-1 tracking-tight">
                  {loading ? (
                    <span className="animate-pulse text-[#7E8DC4] text-xl">Syncing ledger...</span>
                  ) : isBalanceHidden ? (
                    <span className="tracking-widest font-mono text-2xl text-[#A855F7]">₹ ••••••••</span>
                  ) : (
                    <CountUp value={account?.balance || 0} prefix="₹ " decimals={2} isCurrency={true} />
                  )}
                </div>
              </div>
            </div>

            {/* Account Details & Quick Copy */}
            <div className="relative z-10 pt-4 border-t border-[#8B92FF]/15 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#7E8DC4] font-mono shrink-0">Account No:</span>
                <div className="flex items-center gap-1.5 font-mono text-white font-bold min-w-0">
                  <span className="truncate text-right">{account?.accountNumber || '—'}</span>
                  {account && (
                    <button
                      onClick={() => copyToClipboard(account.accountNumber)}
                      className="text-[#7E8DC4] hover:text-[#A855F7] transition shrink-0"
                      title="Copy account number"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#7E8DC4] font-mono">Status:</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {account?.status || 'ACTIVE'}
                </span>
              </div>
            </div>
          </div>

          {/* 3 Overview Stat Cards */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Monthly Inflow */}
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-28 h-28 bg-[#4169FF]/15 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-[#4169FF]/20 text-[#60A5FA] border border-[#4169FF]/30">
                  <ArrowDownRight className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono text-[#7E8DC4] uppercase tracking-wider">Credits</span>
              </div>
              <span className="text-xs font-semibold text-[#B8C5F2] uppercase tracking-wider block">Monthly Inflow</span>
              <div className="text-2xl lg:text-3xl font-black text-emerald-400 mt-1 font-mono tracking-tight">
                {isBalanceHidden ? (
                  <span className="text-lg">₹ ••••••••</span>
                ) : (
                  <CountUp value={totalInflow} prefix="+₹ " decimals={2} isCurrency={true} />
                )}
              </div>
              <p className="text-[11px] text-[#7E8DC4] mt-2">Verified account credits from deposits and incoming wires</p>
            </div>

            {/* Monthly Outflow */}
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-28 h-28 bg-[#EC4899]/15 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-[#EC4899]/20 text-[#F472B6] border border-[#EC4899]/30">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono text-[#7E8DC4] uppercase tracking-wider">Debits</span>
              </div>
              <span className="text-xs font-semibold text-[#B8C5F2] uppercase tracking-wider block">Monthly Outflow</span>
              <div className="text-2xl lg:text-3xl font-black text-white mt-1 font-mono tracking-tight">
                {isBalanceHidden ? (
                  <span className="text-lg">₹ ••••••••</span>
                ) : (
                  <CountUp value={totalOutflow} prefix="-₹ " decimals={2} isCurrency={true} />
                )}
              </div>
              <p className="text-[11px] text-[#7E8DC4] mt-2">Transfers, recurring rules, and smart contract fees</p>
            </div>

            {/* Total Transactions & Ledger Verifications */}
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-28 h-28 bg-[#7C3AED]/15 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-[#7C3AED]/20 text-[#A855F7] border border-[#7C3AED]/30">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> 100% Validated
                </span>
              </div>
              <span className="text-xs font-semibold text-[#B8C5F2] uppercase tracking-wider block">Ledger Records</span>
              <div className="text-2xl lg:text-3xl font-black text-white mt-1 font-mono tracking-tight">
                <CountUp value={transactions.length} decimals={0} />
              </div>
              <p className="text-[11px] text-[#7E8DC4] mt-2">Audited cryptographic state transitions on ledger</p>
            </div>
          </div>
        </div>

        {/* ── 3. SIGNATURE LIVING BLOCKCHAIN VISUAL ────────────── */}
        <BlockchainLivingVisual />

        {/* ── 4. ANALYTICS CHART & QUICK SHORTCUTS ────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chart */}
          <div className="lg:col-span-3 glass-card rounded-2xl p-6 shadow-xl border border-[var(--border-subtle)]">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[var(--primary)]" />
                  Fintech Flow Analytics
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Real inflow and outflow telemetry across past 6 billing cycles</p>
              </div>
              <button
                onClick={load}
                className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-elevated)] hover:bg-[var(--primary)]/20 rounded-xl transition border border-[var(--border-subtle)] cursor-pointer"
                title="Refresh chart"
              >
                <RefreshCw className="w-4 h-4 text-[var(--primary)]" />
              </button>
            </div>

            <div className="w-full h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="flowIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4169FF" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#4169FF" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="flowExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EC4899" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#EC4899" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 146, 255, 0.12)" vertical={false} />
                  <XAxis dataKey="name" stroke="#8B92FF" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis stroke="#8B92FF" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={v => `₹${v/1000}k`} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '14px',
                      color: 'var(--text-primary)',
                      boxShadow: '0 10px 30px rgba(5,7,32,0.4)'
                    }}
                  />
                  <Area type="monotone" dataKey="income" stroke="#4169FF" strokeWidth={2.5} fillOpacity={1} fill="url(#flowIncome)" />
                  <Area type="monotone" dataKey="expenses" stroke="#EC4899" strokeWidth={2.5} fillOpacity={1} fill="url(#flowExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="glass-card rounded-2xl p-6 shadow-xl border border-[var(--border-subtle)] flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--primary)]" />
                Command Center
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Send, label: 'Send Funds', path: '/transfer', color: '#4169FF' },
                  { icon: Plus, label: 'Deposit', path: '/deposit', color: '#7C3AED' },
                  { icon: LinkIcon, label: 'Blockchain', path: '/blockchain', color: '#A855F7' },
                  { icon: History, label: 'Statements', path: '/transactions', color: '#EC4899' },
                ].map(({ icon: Icon, label, path, color }) => (
                  <Link
                    key={path}
                    to={path}
                    className="flex flex-col items-center justify-center bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-4 rounded-xl transition-all duration-200 hover:-translate-y-1 hover:border-[var(--primary)]/60 hover:shadow-md group cursor-pointer"
                  >
                    <Icon className="w-6 h-6 mb-2 group-hover:scale-110 transition" style={{ color }} />
                    <span className="text-xs font-semibold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">{label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Cryptographic Security Heartbeat */}
            <div className="mt-5 p-3.5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-[var(--primary)]" />
                <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Security State</span>
              </div>
              <div className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> Non-Custodial ECDSA Signatures</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> SHA-256 Payload Hashes</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> Hardhat EVM Smart Ledger</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 5. DIGITAL SIGNATURE INSPECTION SECTION ─────────── */}
        <DigitalSignatureSection />

        {/* ── 6. RECENT ACTIVITY TIMELINE TABLE ──────────────── */}
        <div className="glass-card rounded-2xl p-6 shadow-xl border border-[var(--border-subtle)]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-3">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <History className="w-5 h-5 text-[var(--primary)]" />
                Recent Financial Activity
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">Immutable audit log of transfers, deposits, and smart payments</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  value={txSearch}
                  onChange={e => setTxSearch(e.target.value)}
                  placeholder="Search logs..."
                  className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl pl-9 pr-4 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--primary)] transition w-44"
                />
              </div>
              <select
                value={txFilter}
                onChange={e => setTxFilter(e.target.value)}
                className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
              >
                <option value="all">All Time</option>
                <option value="30days">Last 30 Days</option>
                <option value="7days">Last 7 Days</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px] text-xs">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)] uppercase font-mono tracking-wider bg-[var(--bg-elevated)]">
                  {['Timestamp', 'Reference', 'Type', 'Amount', 'Status', 'Blockchain Anchored'].map(h => (
                    <th key={h} className="px-4 py-3.5 font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
                {filtered.slice(0, 10).map((tx, i) => (
                  <tr key={i} className="hover:bg-[var(--bg-elevated)]/60 transition">
                    <td className="px-4 py-3.5 font-mono text-[var(--text-secondary)]">{new Date(tx.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3.5 font-medium">{tx.reference || tx.type}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        tx.direction === 'IN'
                          ? 'bg-[#4169FF]/15 text-[#60A5FA] border border-[#4169FF]/30'
                          : 'bg-[#EC4899]/15 text-[#F472B6] border border-[#EC4899]/30'
                      }`}>
                        {tx.direction === 'IN' ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        {tx.direction === 'IN' ? 'Credit' : 'Debit'}
                      </span>
                    </td>
                    <td className={`px-4 py-3.5 font-mono font-bold ${tx.direction === 'IN' ? 'text-emerald-500 dark:text-emerald-400' : 'text-[var(--text-primary)]'}`}>
                      {tx.direction === 'IN' ? '+' : '-'}₹ {Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        tx.status === 'COMPLETED'
                          ? 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25'
                          : tx.status === 'PENDING'
                          ? 'text-amber-500 dark:text-amber-400 bg-amber-500/10 border border-amber-500/25'
                          : 'text-[var(--text-secondary)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)]'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[#B8C5F2] max-w-[160px] truncate">
                      {tx.blockchainHash ? (
                        <span className="text-[#A855F7] hover:underline cursor-pointer">
                          {tx.blockchainHash.substring(0, 18)}...
                        </span>
                      ) : (
                        <span className="text-[#7E8DC4]">Local Ledger</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && !loading && (
              <div className="text-center py-12">
                <History className="w-10 h-10 text-[#7E8DC4] mx-auto mb-3" />
                <p className="text-[#B8C5F2]">{txSearch ? 'No matching transactions' : 'No transactions recorded yet'}</p>
                <Link to="/deposit" className="text-[#4169FF] hover:text-[#7C3AED] text-xs font-bold hover:underline mt-2 inline-block">
                  Make your first deposit →
                </Link>
              </div>
            )}
          </div>

          {filtered.length > 10 && (
            <div className="mt-4 text-center">
              <Link to="/transactions" className="text-xs font-bold text-[#A855F7] hover:underline">
                View all {filtered.length} transactions in history →
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
