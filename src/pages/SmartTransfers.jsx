import React, { useState, useEffect } from 'react';
import {
  Zap, Plus, Play, Pause, Trash2, Clock, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, AlertTriangle, CalendarClock, TrendingDown,
  TrendingUp, Cpu, ShieldCheck, Activity, ArrowRight, Sparkles, Sliders,
  Check, Lock, ExternalLink, Bot, Edit3, Search, UserCheck, X
} from 'lucide-react';
import api from '../api';
import CountUp from '../components/CountUp';

const FREQUENCIES = ['ONCE', 'DAILY', 'WEEKLY', 'MONTHLY'];
const CONDITION_TYPES = ['NONE', 'BALANCE_ABOVE', 'BALANCE_BELOW'];
const TRANSFER_TYPES = ['SCHEDULED', 'CONDITIONAL', 'SCHEDULED_CONDITIONAL'];

const conditionLabel = {
  NONE: 'No heuristic condition',
  BALANCE_ABOVE: 'If balance exceeds threshold',
  BALANCE_BELOW: 'If balance drops below threshold'
};

const statusColors = {
  ACTIVE: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/35',
  PAUSED: 'text-amber-400 bg-amber-500/15 border-amber-500/35',
  COMPLETED: 'text-[#B8C5F2] bg-[#0C1342] border-[#8B92FF]/20',
  CANCELLED: 'text-rose-400 bg-rose-500/15 border-rose-500/35',
};

const execStatusIcon = {
  SUCCESS: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  FAILED: <XCircle className="w-4 h-4 text-rose-400" />,
  SKIPPED: <AlertTriangle className="w-4 h-4 text-amber-400" />
};

function fmt(v) {
  return '₹' + Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

function fmtDate(d) {
  return d ? new Date(d).toLocaleString('en-IN') : '—';
}

export default function SmartTransfers() {
  const [rules, setRules]         = useState([]);
  const [accounts, setAccounts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [execHistory, setExecHistory] = useState({});
  const [msg, setMsg]             = useState({ text: '', type: 'success' });

  // Recipient selection mode: 'my_accounts' | 'external'
  const [recipientMode, setRecipientMode] = useState('external');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientLookup, setRecipientLookup] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');

  // Editing state
  const [editingRule, setEditingRule] = useState(null);
  const [editForm, setEditForm] = useState({
    ruleName: '', amount: '', conditionType: 'NONE', conditionValue: '',
    frequency: 'MONTHLY', scheduleDay: '1', startDate: '', description: ''
  });

  const [form, setForm] = useState({
    ruleName: '', amount: '', transferType: 'SCHEDULED', conditionType: 'NONE',
    conditionValue: '', frequency: 'MONTHLY', scheduleDay: '1',
    startDate: '', fromAccountId: '', toAccountId: '', description: ''
  });

  const notify = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: 'success' }), 4500);
  };

  useEffect(() => {
    Promise.all([
      api.get('/api/smart-transfers'),
      api.get('/api/banking/accounts')
    ]).then(([rRules, rAccounts]) => {
      setRules(rRules.data.rules || []);
      const accs = rAccounts.data.accounts || [];
      setAccounts(accs);
      if (accs.length) {
        setForm(f => ({ ...f, fromAccountId: String(accs[0].id) }));
        if (accs.length > 1) {
          setRecipientMode('my_accounts');
          setForm(f => ({ ...f, toAccountId: String(accs[1].id) }));
        }
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const refreshRules = () =>
    api.get('/api/smart-transfers').then(r => setRules(r.data.rules || []));

  // External recipient lookup
  const handleLookupRecipient = async (emailToSearch) => {
    const email = (emailToSearch || recipientEmail).trim();
    if (!email) {
      setLookupError('Please enter a recipient email');
      return;
    }
    setLookupLoading(true);
    setLookupError('');
    try {
      const res = await api.get(`/api/banking/lookup/recipient?email=${encodeURIComponent(email)}`);
      if (res.data && res.data.accountId) {
        setRecipientLookup(res.data);
        setForm(f => ({ ...f, toAccountId: String(res.data.accountId) }));
        setLookupError('');
      } else {
        setLookupError('Account not found');
        setRecipientLookup(null);
      }
    } catch (err) {
      setLookupError(err.response?.data?.message || 'Recipient not found');
      setRecipientLookup(null);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    // Validation
    if (!form.ruleName.trim()) {
      return notify('Please enter a rule name / identifier', 'error');
    }
    const amt = parseFloat(form.amount);
    if (isNaN(amt) || amt <= 0) {
      return notify('Please enter a valid amount greater than ₹0', 'error');
    }
    if (!form.fromAccountId) {
      return notify('Please select a funding source account', 'error');
    }
    if (!form.toAccountId) {
      return notify('Please select or verify a destination recipient account', 'error');
    }
    if (String(form.fromAccountId) === String(form.toAccountId)) {
      return notify('Source and destination accounts must be different', 'error');
    }
    if (form.frequency === 'ONCE' && !form.startDate) {
      return notify('Please choose an execution date for the one-time transfer', 'error');
    }
    if (form.conditionType !== 'NONE' && (!form.conditionValue || parseFloat(form.conditionValue) <= 0)) {
      return notify('Please enter a valid condition threshold amount', 'error');
    }

    try {
      const payload = {
        ruleName: form.ruleName.trim(),
        amount: amt,
        transferType: form.transferType,
        conditionType: form.conditionType,
        frequency: form.frequency,
        fromAccountId: parseInt(form.fromAccountId),
        toAccountId: parseInt(form.toAccountId),
        description: form.description ? form.description.trim() : ''
      };

      if (form.conditionType !== 'NONE' && form.conditionValue) {
        payload.conditionValue = parseFloat(form.conditionValue);
      }

      if (form.frequency === 'MONTHLY' && form.scheduleDay) {
        payload.scheduleDay = parseInt(form.scheduleDay);
      }

      if (form.frequency === 'ONCE' && form.startDate && form.startDate.trim()) {
        payload.startDate = form.startDate.trim();
      }

      await api.post('/api/smart-transfers', payload);
      notify('AI Smart transfer agent rule registered and active!');
      setShowForm(false);
      setForm(f => ({
        ...f,
        ruleName: '',
        amount: '',
        description: '',
        conditionValue: '',
        startDate: '',
        toAccountId: accounts.length > 1 ? String(accounts[1].id) : ''
      }));
      setRecipientLookup(null);
      setRecipientEmail('');
      refreshRules();
    } catch (e) {
      notify(e.response?.data?.message || 'Failed to create agent rule', 'error');
    }
  };

  const openEditModal = (rule) => {
    setEditingRule(rule);
    setEditForm({
      ruleName: rule.ruleName || '',
      amount: String(rule.amount || ''),
      conditionType: rule.conditionType || 'NONE',
      conditionValue: rule.conditionValue ? String(rule.conditionValue) : '',
      frequency: rule.frequency || 'MONTHLY',
      scheduleDay: String(rule.scheduleDay || '1'),
      startDate: rule.startDate || '',
      description: rule.description || ''
    });
  };

  const handleUpdateRule = async (e) => {
    e.preventDefault();
    if (!editingRule) return;

    const amt = parseFloat(editForm.amount);
    if (isNaN(amt) || amt <= 0) {
      return notify('Please enter a valid amount greater than ₹0', 'error');
    }

    try {
      const payload = {
        ruleName: editForm.ruleName.trim(),
        amount: amt,
        conditionType: editForm.conditionType,
        frequency: editForm.frequency,
        description: editForm.description ? editForm.description.trim() : ''
      };

      if (editForm.conditionType !== 'NONE' && editForm.conditionValue) {
        payload.conditionValue = parseFloat(editForm.conditionValue);
      }

      if (editForm.frequency === 'MONTHLY' && editForm.scheduleDay) {
        payload.scheduleDay = parseInt(editForm.scheduleDay);
      }

      if (editForm.frequency === 'ONCE' && editForm.startDate && editForm.startDate.trim()) {
        payload.startDate = editForm.startDate.trim();
      }

      await api.put(`/api/smart-transfers/${editingRule.id}`, payload);
      notify('Smart transfer rule updated successfully!');
      setEditingRule(null);
      refreshRules();
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to update rule', 'error');
    }
  };

  const handlePause = async (id) => {
    try {
      await api.patch(`/api/smart-transfers/${id}/pause`);
      notify('Smart agent rule paused');
      refreshRules();
    } catch (e) {
      notify(e.response?.data?.message || 'Error', 'error');
    }
  };

  const handleResume = async (id) => {
    try {
      await api.patch(`/api/smart-transfers/${id}/resume`);
      notify('Smart agent rule resumed and active');
      refreshRules();
    } catch (e) {
      notify(e.response?.data?.message || 'Error', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Revoke and delete this AI smart transfer rule?')) return;
    try {
      await api.delete(`/api/smart-transfers/${id}`);
      notify('Rule revoked successfully');
      refreshRules();
    } catch (e) {
      notify(e.response?.data?.message || 'Error', 'error');
    }
  };

  const loadHistory = async (id) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (!execHistory[id]) {
      const r = await api.get(`/api/smart-transfers/${id}/executions`).catch(() => ({ data: { executions: [] } }));
      setExecHistory(h => ({ ...h, [id]: r.data.executions || [] }));
    }
  };

  const activeRulesCount = rules.filter(r => r.status === 'ACTIVE').length;
  const totalVolumeScheduled = rules.reduce((acc, r) => acc + Number(r.amount || 0), 0);

  const inputCls = "w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] text-xs placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--primary)] transition";
  const labelCls = "block text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider mb-1.5";

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="page-root">
      <div className="page-content space-y-7">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="relative rounded-3xl glass-card border border-[var(--border-subtle)] p-6 md:p-8 shadow-xl overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--primary)]/15 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)] rounded-2xl flex items-center justify-center shadow-lg text-white">
                <Bot className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono uppercase tracking-widest text-[var(--primary)] font-bold">Autonomous Finance</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30 font-semibold">
                    AGENT ENGINE ACTIVE
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">AI Agent Payments & Smart Rules</h1>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                  Programmable conditional transfers, heuristic balance triggers, and recurring blockchain settlements
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowForm(s => !s)}
              className="btn-primary-gradient flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              {showForm ? 'Close Rule Builder' : 'Deploy New Agent Rule'}
            </button>
          </div>
        </div>

        {/* ── Visual 4-Step Payment Workflow ─────────────────── */}
        <div className="glass-card rounded-2xl p-6 border border-[var(--border-subtle)] shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[var(--primary)]" />
              Autonomous Execution Pipeline
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-bold border border-[var(--primary)]/25">
              4-STAGE VERIFICATION
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 relative">
            {[
              {
                step: '01',
                tag: 'TRIGGER',
                title: 'Cron / Threshold Trigger',
                desc: 'Schedules evaluate timestamp triggers or liquidity balance criteria.',
                icon: Clock,
                color: 'text-blue-500 bg-blue-500/10 border-blue-500/30'
              },
              {
                step: '02',
                tag: 'AI AUDIT',
                title: 'AI Risk Engine Heuristics',
                desc: 'Pre-flight machine learning verification audits transaction velocity.',
                icon: Cpu,
                color: 'text-purple-500 bg-purple-500/10 border-purple-500/30'
              },
              {
                step: '03',
                tag: 'ECDSA',
                title: 'Client Cryptographic Auth',
                desc: 'Client-side WebCrypto private key generates ECDSA P-256 signature.',
                icon: ShieldCheck,
                color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30'
              },
              {
                step: '04',
                tag: 'ON-CHAIN',
                title: 'EVM Smart Settlement',
                desc: 'Funds settle atomically and anchor to immutable blockchain block.',
                icon: Zap,
                color: 'text-pink-500 bg-pink-500/10 border-pink-500/30'
              },
            ].map((st, i) => {
              const Icon = st.icon;
              return (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--primary)]/50 transition-all duration-300 relative group flex flex-col justify-between shadow-sm hover:shadow-md hover:-translate-y-0.5"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${st.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-card)] text-[var(--text-secondary)] font-bold border border-[var(--border-subtle)]">
                          {st.tag}
                        </span>
                        <span className="text-xs font-mono font-black text-[var(--primary)]">
                          {st.step}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-[var(--text-primary)] mt-1 tracking-tight">
                      {st.title}
                    </h4>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                      {st.desc}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] font-mono text-[var(--text-secondary)]">
                    <span className="text-emerald-500 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Autonomous
                    </span>
                    <span className="opacity-60">Verified</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Telemetry Stats Cards ───────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card rounded-2xl p-4.5 border border-[var(--border-subtle)]">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] block">Active Automated Rules</span>
            <div className="text-3xl font-black text-[var(--text-primary)] font-mono mt-1">
              <CountUp value={activeRulesCount} decimals={0} />
            </div>
            <p className="text-[11px] text-emerald-500 dark:text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> All rules verified against spending policy
            </p>
          </div>

          <div className="glass-card rounded-2xl p-4.5 border border-[var(--border-subtle)]">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] block">Monthly Volume Allocated</span>
            <div className="text-3xl font-black text-blue-500 dark:text-blue-400 font-mono mt-1">
              <CountUp value={totalVolumeScheduled} prefix="₹ " decimals={2} isCurrency={true} />
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] mt-1">Total value managed by programmable rules</p>
          </div>

          <div className="glass-card rounded-2xl p-4.5 border border-[var(--border-subtle)]">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] block">Agent Safety Constraint</span>
            <div className="text-2xl font-black text-[var(--primary)] font-mono mt-1.5 flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
              NON-CUSTODIAL
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] mt-1">Transfers execute strictly within verified account balances</p>
          </div>
        </div>

        {msg.text && (
          <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2 shadow-md ${
            msg.type === 'error'
              ? 'bg-rose-950/50 border-rose-500/40 text-rose-200'
              : 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
          }`}>
            {msg.type === 'error' ? <AlertTriangle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            <span>{msg.text}</span>
          </div>
        )}

        {/* ── Create Rule Form ─────────────────────────────────── */}
        {showForm && (
          <div className="glass-card rounded-2xl p-6 shadow-2xl border border-[var(--border-subtle)] animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-5 border-b border-[var(--border-subtle)] pb-3">
              <h2 className="text-[var(--text-primary)] font-bold text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[var(--primary)]" />
                Rule Configuration & Safety Constraints
              </h2>
              <span className="text-xs text-[var(--text-secondary)] font-mono">Autonomous Execution Engine</span>
            </div>

            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelCls}>Rule Identifier / Purpose *</label>
                <input
                  className={inputCls}
                  value={form.ruleName}
                  onChange={e => setForm(f => ({ ...f, ruleName: e.target.value }))}
                  placeholder="e.g., Monthly Vault Savings or Liquidity Top-up"
                  required
                />
              </div>

              <div>
                <label className={labelCls}>Transfer Type *</label>
                <select
                  className={inputCls}
                  value={form.transferType}
                  onChange={e => setForm(f => ({ ...f, transferType: e.target.value }))}
                >
                  {TRANSFER_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>Amount (₹) *</label>
                <input
                  type="number"
                  min="1"
                  className={inputCls}
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="5000"
                  required
                />
              </div>

              <div>
                <label className={labelCls}>Funding Source Account *</label>
                <select
                  className={inputCls}
                  value={form.fromAccountId}
                  onChange={e => setForm(f => ({ ...f, fromAccountId: e.target.value }))}
                  required
                >
                  <option value="">Select source account</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.accountNumber} ({fmt(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <label className={labelCls}>Target Destination Account *</label>
                  <div className="flex rounded-lg p-0.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[10px]">
                    {accounts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => { setRecipientMode('my_accounts'); setRecipientLookup(null); }}
                        className={`px-2.5 py-1 rounded-md font-semibold transition ${
                          recipientMode === 'my_accounts'
                            ? 'bg-[var(--primary)] text-white'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        My Accounts
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setRecipientMode('external')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition ${
                        recipientMode === 'external'
                          ? 'bg-[var(--primary)] text-white'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      Lookup Recipient Email
                    </button>
                  </div>
                </div>

                {recipientMode === 'my_accounts' ? (
                  <div>
                    <select
                      className={inputCls}
                      value={form.toAccountId}
                      onChange={e => setForm(f => ({ ...f, toAccountId: e.target.value }))}
                      required
                    >
                      <option value="">Select recipient account</option>
                      {accounts.filter(a => String(a.id) !== String(form.fromAccountId)).map(a => (
                        <option key={a.id} value={a.id}>
                          {a.accountNumber} — {a.accountType} ({fmt(a.balance)})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="email"
                          className={inputCls}
                          placeholder="recipient@example.com"
                          value={recipientEmail}
                          onChange={e => setRecipientEmail(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleLookupRecipient(); } }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleLookupRecipient()}
                        disabled={lookupLoading}
                        className="px-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--primary)] text-[var(--text-primary)] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {lookupLoading ? <div className="w-3.5 h-3.5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                        Verify
                      </button>
                    </div>

                    {lookupError && (
                      <p className="text-rose-400 text-[11px] flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {lookupError}
                      </p>
                    )}

                    {recipientLookup && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-emerald-400" />
                          <div>
                            <span className="font-bold">{recipientLookup.recipientName}</span>
                            <span className="text-[11px] opacity-80 block font-mono">Account: {recipientLookup.accountNumberMasked || recipientLookup.accountNumber}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 font-bold">VERIFIED RECIPIENT</span>
                      </div>
                    )}
                  </div>
                )}
                <p className="text-[#7E8DC4] text-[11px]">Autonomous transfers routed strictly to verified active accounts</p>
              </div>

              {(form.transferType === 'SCHEDULED' || form.transferType === 'SCHEDULED_CONDITIONAL') && (
                <>
                  <div>
                    <label className={labelCls}>Cadence Frequency *</label>
                    <select
                      className={inputCls}
                      value={form.frequency}
                      onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
                    >
                      {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                  {form.frequency === 'MONTHLY' && (
                    <div>
                      <label className={labelCls}>Execution Day of Month (1–28)</label>
                      <input
                        type="number"
                        min="1"
                        max="28"
                        className={inputCls}
                        value={form.scheduleDay}
                        onChange={e => setForm(f => ({ ...f, scheduleDay: e.target.value }))}
                      />
                    </div>
                  )}
                  {form.frequency === 'ONCE' && (
                    <div>
                      <label className={labelCls}>Execution Date *</label>
                      <input
                        type="date"
                        className={inputCls}
                        value={form.startDate}
                        onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                      />
                    </div>
                  )}
                </>
              )}

              {(form.transferType === 'CONDITIONAL' || form.transferType === 'SCHEDULED_CONDITIONAL') && (
                <>
                  <div>
                    <label className={labelCls}>Heuristic Trigger Condition</label>
                    <select
                      className={inputCls}
                      value={form.conditionType}
                      onChange={e => setForm(f => ({ ...f, conditionType: e.target.value }))}
                    >
                      {CONDITION_TYPES.map(c => <option key={c} value={c}>{conditionLabel[c]}</option>)}
                    </select>
                  </div>
                  {form.conditionType !== 'NONE' && (
                    <div>
                      <label className={labelCls}>Threshold Amount Trigger (₹)</label>
                      <input
                        type="number"
                        className={inputCls}
                        value={form.conditionValue}
                        onChange={e => setForm(f => ({ ...f, conditionValue: e.target.value }))}
                        placeholder="25000"
                      />
                    </div>
                  )}
                </>
              )}

              <div className="md:col-span-2">
                <label className={labelCls}>Agent Execution Note</label>
                <input
                  className={inputCls}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional compliance statement note..."
                />
              </div>

              <div className="md:col-span-2 flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 bg-[#0A103D] border border-[#8B92FF]/20 text-[#B8C5F2] hover:text-white rounded-xl font-semibold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-gradient flex-1 py-2.5 rounded-xl font-bold text-xs shadow-lg cursor-pointer"
                >
                  Activate Smart Rule
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Active Rules Grid ─────────────────────────────────── */}
        {rules.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 sm:p-12 text-center shadow-xl border border-[var(--border-subtle)] relative overflow-hidden">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--primary)]/20 via-[var(--accent-purple)]/15 to-transparent border border-[var(--primary)]/30 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Bot className="w-8 h-8 text-[var(--primary)]" />
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">
              No Autonomous Rules Deployed Yet
            </h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto mb-5 leading-relaxed">
              Deploy your first smart rule to automate scheduled transfers, establish heuristic liquidity top-ups, or trigger recurring blockchain settlements.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="btn-primary-gradient px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Deploy First Agent Rule
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {rules.map(rule => (
              <div
                key={rule.id}
                className="glass-card rounded-2xl overflow-hidden hover:border-[var(--primary)]/60 transition-all shadow-xl border border-[var(--border-subtle)]"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        rule.status === 'ACTIVE'
                          ? 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30'
                      }`}>
                        {rule.status === 'ACTIVE' ? <TrendingUp className="w-5 h-5"/> : <TrendingDown className="w-5 h-5"/>}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-[var(--text-primary)] font-bold text-sm tracking-wide">{rule.ruleName}</h3>
                          <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-semibold ${statusColors[rule.status] || 'text-[var(--text-secondary)]'}`}>
                            {rule.status}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                            {rule.transferType}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs">
                          <span className="text-emerald-500 dark:text-emerald-400 font-bold font-mono">{fmt(rule.amount)}</span>
                          <span className="text-[var(--text-secondary)]">{rule.frequency} {rule.scheduleDay ? `• Day ${rule.scheduleDay}` : ''}</span>
                          {rule.conditionType !== 'NONE' && (
                            <span className="text-amber-500 dark:text-amber-400">{conditionLabel[rule.conditionType]} {rule.conditionValue ? fmt(rule.conditionValue) : ''}</span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-[var(--text-secondary)]">
                          <span>From: <span className="text-[var(--text-primary)] font-mono">{rule.fromAccountNumber}</span></span>
                          <span>→ To: <span className="text-[var(--text-primary)] font-mono">{rule.toAccountNumber}</span></span>
                        </div>

                        {rule.nextExecution && (
                          <p className="text-[11px] text-[#A855F7] mt-1.5 flex items-center gap-1 font-mono">
                            <CalendarClock className="w-3.5 h-3.5" /> Next Trigger: {fmtDate(rule.nextExecution)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      {rule.status === 'ACTIVE' ? (
                        <button
                          onClick={() => handlePause(rule.id)}
                          title="Pause Rule"
                          className="p-2 hover:bg-amber-500/20 text-amber-400 rounded-xl transition cursor-pointer border border-transparent hover:border-amber-500/30"
                        >
                          <Pause className="w-4 h-4"/>
                        </button>
                      ) : rule.status === 'PAUSED' ? (
                        <button
                          onClick={() => handleResume(rule.id)}
                          title="Resume Rule"
                          className="p-2 hover:bg-emerald-500/20 text-emerald-400 rounded-xl transition cursor-pointer border border-transparent hover:border-emerald-500/30"
                        >
                          <Play className="w-4 h-4"/>
                        </button>
                      ) : null}

                      <button
                        onClick={() => openEditModal(rule)}
                        title="Edit Rule Configuration"
                        className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-xl transition cursor-pointer border border-transparent hover:border-blue-500/30"
                      >
                        <Edit3 className="w-4 h-4"/>
                      </button>

                      <button
                        onClick={() => handleDelete(rule.id)}
                        title="Revoke Rule"
                        className="p-2 hover:bg-rose-500/20 text-rose-400 rounded-xl transition cursor-pointer border border-transparent hover:border-rose-500/30"
                      >
                        <Trash2 className="w-4 h-4"/>
                      </button>

                      <button
                        onClick={() => loadHistory(rule.id)}
                        className="p-2 hover:bg-white/10 text-[#B8C5F2] hover:text-white rounded-xl transition cursor-pointer"
                        title="Toggle Execution Audit Logs"
                      >
                        {expandedId === rule.id ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Execution History Audit Drawer */}
                {expandedId === rule.id && (
                  <div className="border-t border-[#8B92FF]/20 bg-[#080C2E]/90 px-5 py-4">
                    <p className="text-white text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#4169FF]" />
                      Audit Trail & Execution Log
                    </p>
                    {(execHistory[rule.id] || []).length === 0 ? (
                      <p className="text-[#7E8DC4] text-xs">No execution history recorded for this rule yet.</p>
                    ) : (
                      <div className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar">
                        {(execHistory[rule.id] || []).map(ex => (
                          <div
                            key={ex.id}
                            className="flex items-center gap-3 bg-[#10164A] rounded-xl px-3.5 py-2.5 border border-[#8B92FF]/15 text-xs"
                          >
                            {execStatusIcon[ex.status] || <Clock className="w-4 h-4 text-[#B8C5F2]"/>}
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-semibold">
                                {ex.status} {ex.amount ? `• ${fmt(ex.amount)}` : ''}
                              </p>
                              {ex.failureReason && <p className="text-[11px] text-rose-400">{ex.failureReason}</p>}
                              {ex.transactionLogId && <p className="text-[10px] text-[#7E8DC4] font-mono">TX-REF: {ex.transactionLogId}</p>}
                            </div>
                            <span className="text-[#7E8DC4] font-mono text-[11px] shrink-0">{fmtDate(ex.executedAt)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Edit Rule Modal ───────────────────────────────────── */}
        {editingRule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="glass-card w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-[var(--border-subtle)] space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">Edit Autonomous Rule</h3>
                    <p className="text-[11px] text-[var(--text-secondary)]">Update triggers, limits, or schedule parameters</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateRule} className="space-y-3.5 text-xs">
                <div>
                  <label className={labelCls}>Rule Name / Purpose</label>
                  <input
                    className={inputCls}
                    value={editForm.ruleName}
                    onChange={e => setEditForm(f => ({ ...f, ruleName: e.target.value }))}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Amount (₹)</label>
                    <input
                      type="number"
                      min="1"
                      className={inputCls}
                      value={editForm.amount}
                      onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Frequency</label>
                    <select
                      className={inputCls}
                      value={editForm.frequency}
                      onChange={e => setEditForm(f => ({ ...f, frequency: e.target.value }))}
                    >
                      {FREQUENCIES.map(fr => <option key={fr}>{fr}</option>)}
                    </select>
                  </div>
                </div>

                {editForm.frequency === 'MONTHLY' && (
                  <div>
                    <label className={labelCls}>Day of Month (1–28)</label>
                    <input
                      type="number"
                      min="1"
                      max="28"
                      className={inputCls}
                      value={editForm.scheduleDay}
                      onChange={e => setEditForm(f => ({ ...f, scheduleDay: e.target.value }))}
                    />
                  </div>
                )}

                {editForm.frequency === 'ONCE' && (
                  <div>
                    <label className={labelCls}>Scheduled Date</label>
                    <input
                      type="date"
                      className={inputCls}
                      value={editForm.startDate}
                      onChange={e => setEditForm(f => ({ ...f, startDate: e.target.value }))}
                    />
                  </div>
                )}

                <div>
                  <label className={labelCls}>Heuristic Trigger Condition</label>
                  <select
                    className={inputCls}
                    value={editForm.conditionType}
                    onChange={e => setEditForm(f => ({ ...f, conditionType: e.target.value }))}
                  >
                    {CONDITION_TYPES.map(ct => <option key={ct} value={ct}>{conditionLabel[ct]}</option>)}
                  </select>
                </div>

                {editForm.conditionType !== 'NONE' && (
                  <div>
                    <label className={labelCls}>Threshold Trigger (₹)</label>
                    <input
                      type="number"
                      className={inputCls}
                      value={editForm.conditionValue}
                      onChange={e => setEditForm(f => ({ ...f, conditionValue: e.target.value }))}
                      placeholder="25000"
                    />
                  </div>
                )}

                <div>
                  <label className={labelCls}>Compliance Note / Description</label>
                  <input
                    className={inputCls}
                    value={editForm.description}
                    onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Optional memo..."
                  />
                </div>

                <div className="flex gap-2 pt-2 border-t border-[var(--border-subtle)]">
                  <button
                    type="button"
                    onClick={() => setEditingRule(null)}
                    className="flex-1 py-2.5 rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl btn-primary-gradient text-white text-xs font-bold shadow-lg cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
