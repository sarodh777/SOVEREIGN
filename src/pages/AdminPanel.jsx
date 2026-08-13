import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, ShieldCheck, Activity, Clock, CheckCircle2, XCircle, Search,
  Lock, Unlock, ChevronRight, X, TrendingUp, DollarSign, AlertTriangle,
  Eye, RefreshCcw, Database, FileText, Plus, Minus, Info
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import api from '../api';

const TAB = {
  OVERVIEW: 'overview',
  USERS: 'users',
  KYC: 'kyc',
  TRANSACTIONS: 'transactions',
  AUDIT: 'audit',
};

const fmt = (v) => '₹ ' + Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
const fmtShort = (v) => {
  const n = Number(v || 0);
  if (n >= 1_00_00_000) return '₹' + (n / 1_00_00_000).toFixed(1) + 'Cr';
  if (n >= 1_00_000) return '₹' + (n / 1_00_000).toFixed(1) + 'L';
  if (n >= 1_000) return '₹' + (n / 1_000).toFixed(1) + 'K';
  return '₹' + n.toFixed(0);
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon: Icon, sub }) {
  return (
    <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border rounded-2xl p-5 relative overflow-hidden"
      style={{ borderColor: color + '25' }}>
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 blur-xl"
        style={{ background: color }} />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: color + '15' }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <p className="text-[#A0AEC0] text-xs uppercase tracking-wider font-semibold">{label}</p>
        </div>
        <p className="text-3xl font-black text-[#E8EEF7]">{value}</p>
        {sub && <p className="text-xs text-[#718096] mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ children, color }) {
  const colors = {
    green:  'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20',
    red:    'bg-[#FF006E]/10 text-[#FF006E] border-[#FF006E]/20',
    yellow: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20',
    cyan:   'bg-[#00F0FF]/10 text-[#00F0FF] border-[#00F0FF]/20',
    gray:   'bg-[#718096]/10 text-[#718096] border-[#718096]/20',
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-bold rounded border ${colors[color] || colors.gray}`}>
      {children}
    </span>
  );
}

// ── User Detail Modal ─────────────────────────────────────────────────────────
function UserDetailModal({ userId, onClose, onActionDone }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adjustForm, setAdjustForm] = useState({ show: false, type: 'CREDIT', amount: '', reason: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get(`/api/admin/users/${userId}/details`)
      .then(r => setUser(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const notify = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const adjustBalance = async () => {
    try {
      const res = await api.post(`/api/admin/users/${userId}/adjust-balance`, {
        type: adjustForm.type,
        amount: parseFloat(adjustForm.amount),
        reason: adjustForm.reason || 'Admin adjustment',
      });
      notify(res.data.message);
      setAdjustForm({ show: false, type: 'CREDIT', amount: '', reason: '' });
      // Refresh
      const r = await api.get(`/api/admin/users/${userId}/details`);
      setUser(r.data);
      onActionDone?.();
    } catch (e) { notify(e.response?.data?.message || 'Failed'); }
  };

  const unlock = async () => {
    try {
      await api.post(`/api/admin/users/${userId}/unlock`);
      notify('Account unlocked successfully');
      const r = await api.get(`/api/admin/users/${userId}/details`);
      setUser(r.data);
      onActionDone?.();
    } catch { notify('Unlock failed'); }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-start justify-end z-50 p-4 backdrop-blur-sm">
      <div className="bg-[#0F1420] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-[#0F1420] border-b border-white/5 p-5 flex items-center justify-between z-10">
          <h2 className="font-bold text-[#E8EEF7] text-lg">User Details</h2>
          <button onClick={onClose} className="text-[#718096] hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#00F0FF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : user ? (
          <div className="p-5 space-y-5">
            {msg && <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">{msg}</div>}

            {/* User Info */}
            <div className="bg-[#1A1F2E] rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-[#00F0FF] to-[#FF006E] rounded-full p-0.5">
                  <div className="w-full h-full bg-[#0B0F14] rounded-full flex items-center justify-center text-[#E8EEF7] font-bold text-xl">
                    {(user.name || user.email)[0].toUpperCase()}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-[#E8EEF7] text-lg">{user.name || '—'}</h3>
                  <p className="text-[#A0AEC0] text-sm">{user.email}</p>
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    <Badge color={user.isActive ? 'green' : 'red'}>{user.isActive ? 'Active' : 'Frozen'}</Badge>
                    {user.isAccountLocked && <Badge color="red">🔒 Login Locked</Badge>}
                    <Badge color={user.role === 'ROLE_ADMIN' ? 'red' : 'cyan'}>{user.role?.replace('ROLE_', '')}</Badge>
                    <Badge color={user.kycStatus === 'VERIFIED' ? 'green' : user.kycStatus === 'PENDING' ? 'yellow' : 'gray'}>
                      KYC: {user.kycStatus}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  ['Phone', user.phone || '—'],
                  ['Member Since', user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'],
                  ['Last Login', user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'],
                  ['Failed Attempts', user.failedLoginAttempts || 0],
                ].map(([k, v]) => (
                  <div key={k} className="bg-[#0B0F14]/50 p-2.5 rounded-lg border border-white/5">
                    <p className="text-[#718096] text-xs">{k}</p>
                    <p className="text-[#E8EEF7] font-medium">{v}</p>
                  </div>
                ))}
              </div>
              {user.isAccountLocked && (
                <button onClick={unlock}
                  className="mt-3 flex items-center gap-2 px-4 py-2 bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] rounded-lg text-sm font-semibold hover:bg-[#00F0FF]/20 transition">
                  <Unlock className="w-4 h-4" /> Unlock Account
                </button>
              )}
            </div>

            {/* Accounts & Balance Adjustment */}
            {(user.accounts || []).map(acc => (
              <div key={acc.id} className="bg-[#1A1F2E] rounded-xl border border-white/5 overflow-hidden">
                <div className="p-4 border-b border-white/5 flex justify-between items-center">
                  <div>
                    <p className="text-[#A0AEC0] text-xs uppercase tracking-wider">Account • {acc.accountType}</p>
                    <p className="font-mono font-bold text-[#00F0FF] text-sm mt-0.5">{acc.accountNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#718096] text-xs">Balance</p>
                    <p className="font-black text-[#E8EEF7] text-xl">{fmt(acc.balance)}</p>
                  </div>
                </div>

                {/* Balance Adjust */}
                <div className="p-3 flex gap-2">
                  <button onClick={() => setAdjustForm({ show: true, type: 'CREDIT', amount: '', reason: '' })}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] text-xs font-semibold rounded-lg hover:bg-[#10B981]/20 transition">
                    <Plus className="w-3 h-3" /> Credit
                  </button>
                  <button onClick={() => setAdjustForm({ show: true, type: 'DEBIT', amount: '', reason: '' })}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF006E]/10 border border-[#FF006E]/30 text-[#FF006E] text-xs font-semibold rounded-lg hover:bg-[#FF006E]/20 transition">
                    <Minus className="w-3 h-3" /> Debit
                  </button>
                </div>

                {/* Adjust Form */}
                {adjustForm.show && (
                  <div className="p-4 bg-[#0B0F14]/70 border-t border-white/5 space-y-3">
                    <p className="text-sm font-semibold text-[#E8EEF7]">
                      {adjustForm.type === 'CREDIT' ? '➕' : '➖'} Admin {adjustForm.type}
                    </p>
                    <div className="flex gap-3">
                      <input value={adjustForm.amount}
                        onChange={e => setAdjustForm(f => ({ ...f, amount: e.target.value }))}
                        placeholder="Amount (₹)"
                        type="number"
                        className="flex-1 bg-[#1A1F2E] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#E8EEF7] focus:outline-none focus:border-[#00F0FF]" />
                    </div>
                    <input value={adjustForm.reason}
                      onChange={e => setAdjustForm(f => ({ ...f, reason: e.target.value }))}
                      placeholder="Reason (optional)"
                      className="w-full bg-[#1A1F2E] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#E8EEF7] focus:outline-none focus:border-[#00F0FF]" />
                    <div className="flex gap-2">
                      <button onClick={() => setAdjustForm({ show: false, type: 'CREDIT', amount: '', reason: '' })}
                        className="flex-1 bg-[#252C3C] text-[#A0AEC0] py-2 rounded-lg text-sm font-semibold">
                        Cancel
                      </button>
                      <button onClick={adjustBalance}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold text-white transition ${adjustForm.type === 'CREDIT' ? 'bg-[#10B981] hover:bg-[#0CA678]' : 'bg-[#FF006E] hover:opacity-90'}`}>
                        Apply {adjustForm.type}
                      </button>
                    </div>
                  </div>
                )}

                {/* Recent Transactions */}
                {acc.recentTransactions?.length > 0 && (
                  <div className="border-t border-white/5">
                    <p className="px-4 py-2 text-xs text-[#718096] uppercase tracking-wider font-semibold border-b border-white/5">
                      Recent Transactions
                    </p>
                    {acc.recentTransactions.slice(0, 5).map((tx, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 last:border-0">
                        <div>
                          <p className="text-[#E8EEF7] text-xs font-medium">{tx.reference || tx.type}</p>
                          <p className="text-[#718096] text-[10px]">{tx.date ? new Date(tx.date).toLocaleDateString() : '—'}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold font-mono ${tx.direction === 'IN' ? 'text-[#10B981]' : 'text-[#FF006E]'}`}>
                            {tx.direction === 'IN' ? '+' : '-'}{fmt(tx.amount)}
                          </p>
                          <Badge color={tx.status === 'COMPLETED' ? 'green' : tx.status === 'PENDING' ? 'yellow' : 'red'}>
                            {tx.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-[#A0AEC0]">User not found</div>
        )}
      </div>
    </div>
  );
}

// ── Main Admin Panel ───────────────────────────────────────────────────────────
export default function AdminPanel() {
  const [tab, setTab]               = useState(TAB.OVERVIEW);
  const [analytics, setAnalytics]   = useState({});
  const [users, setUsers]           = useState([]);
  const [kyc, setKyc]               = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [auditLogs, setAuditLogs]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [msg, setMsg]               = useState({ text: '', type: 'success' });
  const [rejectForm, setRejectForm] = useState({ id: null, reason: '' });
  const [selectedUser, setSelectedUser] = useState(null);

  const role = localStorage.getItem('userRole');

  useEffect(() => {
    if (role !== 'ROLE_ADMIN') { window.location.href = '/dashboard'; return; }
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [a, u, k, t, al] = await Promise.all([
        api.get('/api/admin/analytics'),
        api.get('/api/admin/users'),
        api.get('/api/admin/kyc/pending'),
        api.get('/api/admin/transactions'),
        api.get('/api/admin/audit-logs').catch(() => ({ data: { logs: [] } })),
      ]);
      setAnalytics(a.data);
      setUsers(u.data.users || []);
      setKyc(k.data.kyc || []);
      setTransactions(t.data.transactions || []);
      setAuditLogs(al.data.logs || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const notify = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: 'success' }), 3500);
  };

  const freezeUser = async (id, freeze) => {
    try {
      await api.post(`/api/admin/users/${id}/${freeze ? 'freeze' : 'unfreeze'}`);
      notify(`User ${freeze ? 'frozen' : 'unfrozen'} successfully`);
      setUsers(u => u.map(x => x.id === id ? { ...x, isActive: !freeze } : x));
    } catch { notify('Action failed', 'error'); }
  };

  const approveKyc = async (id) => {
    try {
      await api.post(`/api/admin/kyc/${id}/approve`);
      notify('KYC approved');
      setKyc(k => k.filter(x => x.id !== id));
      setAnalytics(a => ({ ...a, pendingKyc: (a.pendingKyc || 1) - 1 }));
    } catch { notify('Approval failed', 'error'); }
  };

  const rejectKyc = async () => {
    try {
      await api.post(`/api/admin/kyc/${rejectForm.id}/reject`, { reason: rejectForm.reason || 'Does not meet requirements' });
      notify('KYC rejected');
      setKyc(k => k.filter(x => x.id !== rejectForm.id));
      setRejectForm({ id: null, reason: '' });
    } catch { notify('Rejection failed', 'error'); }
  };

  const filteredUsers = users.filter(u =>
    !search ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  // Build chart data from analytics.dailyTxCounts
  const chartData = analytics.dailyTxCounts
    ? Object.entries(analytics.dailyTxCounts).map(([date, count]) => ({
        name: new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        transactions: count,
      }))
    : [];

  const TABS = [
    { key: TAB.OVERVIEW,     label: 'Overview',                  icon: Activity },
    { key: TAB.USERS,        label: `Users (${analytics.totalUsers || 0})`, icon: Users },
    { key: TAB.KYC,          label: `KYC Pending (${analytics.pendingKyc || 0})`, icon: ShieldCheck },
    { key: TAB.TRANSACTIONS, label: 'Transactions',              icon: TrendingUp },
    { key: TAB.AUDIT,        label: 'Audit Logs',                icon: FileText },
  ];

  if (loading) return (
    <div className="w-full min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-[#00F0FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#A0AEC0] text-sm">Loading admin data...</p>
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen p-6 md:p-8">
      {selectedUser && (
        <UserDetailModal
          userId={selectedUser}
          onClose={() => setSelectedUser(null)}
          onActionDone={() => { loadAll(); }}
        />
      )}

      {/* Reject KYC Modal */}
      {rejectForm.id && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#1A1F2E] border border-[#FF006E]/30 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-[#E8EEF7] mb-4 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-[#FF006E]" /> Reject KYC — Reason
            </h3>
            <textarea
              value={rejectForm.reason}
              onChange={e => setRejectForm({ ...rejectForm, reason: e.target.value })}
              rows={3}
              className="w-full bg-[#0B0F14] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-[#E8EEF7] focus:outline-none focus:border-[#FF006E] resize-none mb-4"
              placeholder="Explain the rejection reason..."
            />
            <div className="flex gap-3">
              <button onClick={() => setRejectForm({ id: null, reason: '' })}
                className="flex-1 bg-[#252C3C] text-[#A0AEC0] py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2D3748] transition">
                Cancel
              </button>
              <button onClick={rejectKyc}
                className="flex-1 bg-[#FF006E] text-white py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition">
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#FF006E]/20 to-[#FF006E]/5 rounded-xl flex items-center justify-center border border-[#FF006E]/20">
              <ShieldCheck className="w-6 h-6 text-[#FF006E]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#E8EEF7]">Admin Panel</h1>
              <p className="text-[#A0AEC0] text-sm">Sovereign Ledger — Operations Control Center</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadAll}
              className="p-2.5 bg-[#1A1F2E] border border-white/10 rounded-xl text-[#A0AEC0] hover:text-[#00F0FF] transition">
              <RefreshCcw className="w-4 h-4" />
            </button>
            <span className="px-3 py-1.5 bg-[#FF006E]/10 border border-[#FF006E]/30 text-[#FF006E] text-xs font-bold rounded-full tracking-wider">
              ADMIN ACCESS
            </span>
          </div>
        </div>

        {/* Notification */}
        {msg.text && (
          <div className={`p-3 rounded-lg text-sm font-medium border ${msg.type === 'error'
            ? 'bg-red-500/10 border-red-500/30 text-red-400'
            : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
            {msg.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                tab === key
                  ? 'bg-[#00F0FF] text-[#0B0F14] shadow-lg shadow-[#00F0FF]/20'
                  : 'bg-[#1A1F2E] text-[#A0AEC0] hover:text-white border border-white/8 hover:border-white/20'
              }`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ──────────────────────────────────────────────────────── */}
        {tab === TAB.OVERVIEW && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Users" value={analytics.totalUsers || 0} color="#00F0FF" icon={Users} />
              <StatCard label="Active Users" value={analytics.activeUsers || 0} color="#10B981" icon={CheckCircle2}
                sub={`${analytics.frozenUsers || 0} frozen`} />
              <StatCard label="Total Transactions" value={analytics.totalTransactions || 0} color="#F59E0B" icon={Activity} />
              <StatCard label="Pending KYC" value={analytics.pendingKyc || 0} color="#FF006E" icon={Clock} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="System Balance" value={fmtShort(analytics.totalBalance)} color="#00F0FF" icon={DollarSign}
                sub="Total funds in system" />
              <StatCard label="TX Volume" value={fmtShort(analytics.txVolume)} color="#10B981" icon={TrendingUp}
                sub="Completed transactions" />
              <StatCard label="Locked Accounts" value={analytics.lockedUsers || 0} color="#F59E0B" icon={Lock}
                sub="Failed login lockouts" />
              <StatCard label="Frozen Users" value={analytics.frozenUsers || 0} color="#FF006E" icon={AlertTriangle}
                sub="Admin-frozen accounts" />
            </div>

            {/* Daily TX Chart */}
            <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-white/5 rounded-2xl p-6">
              <h2 className="font-bold text-[#E8EEF7] mb-5 flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#00F0FF]" /> Transaction Activity — Last 7 Days
              </h2>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#252C3C" vertical={false} />
                    <XAxis dataKey="name" stroke="#718096" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis stroke="#718096" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: '#0B0F14', border: '1px solid #00F0FF30', borderRadius: '8px', color: '#E8EEF7' }}
                      formatter={(v) => [v, 'Transactions']}
                    />
                    <Bar dataKey="transactions" fill="#00F0FF" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-[#718096] text-sm">No transaction data yet</div>
              )}
            </div>

            {/* Quick action cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Manage Users', tab: TAB.USERS, color: '#00F0FF', icon: Users },
                { label: 'Review KYC', tab: TAB.KYC, color: '#F59E0B', icon: ShieldCheck },
                { label: 'All Transactions', tab: TAB.TRANSACTIONS, color: '#10B981', icon: TrendingUp },
                { label: 'Audit Logs', tab: TAB.AUDIT, color: '#FF006E', icon: FileText },
              ].map(({ label, tab: t, color, icon: Icon }) => (
                <button key={t} onClick={() => setTab(t)}
                  className="flex items-center gap-3 p-4 bg-[#1A1F2E] border border-white/5 rounded-xl hover:border-opacity-50 transition group text-left"
                  onMouseEnter={e => e.currentTarget.style.borderColor = color + '40'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}>
                  <Icon className="w-5 h-5 shrink-0" style={{ color }} />
                  <span className="text-sm font-semibold text-[#A0AEC0] group-hover:text-[#E8EEF7] transition">{label}</span>
                  <ChevronRight className="w-4 h-4 text-[#4A5568] ml-auto group-hover:text-[#718096] transition" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── USERS TAB ─────────────────────────────────────────────────────────── */}
        {tab === TAB.USERS && (
          <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center gap-3">
              <Search className="w-4 h-4 text-[#718096] shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="bg-transparent text-[#E8EEF7] text-sm placeholder-[#718096] focus:outline-none flex-1"
              />
              <span className="text-xs text-[#718096] shrink-0">{filteredUsers.length} users</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[1000px]">
                <thead>
                  <tr className="border-b border-white/5 text-[#A0AEC0] text-xs uppercase tracking-wider">
                    {['User', 'Phone', 'Role', 'Email', 'KYC', 'Account Balance', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition cursor-pointer group"
                      onClick={() => setSelectedUser(u.id)}>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00F0FF]/20 to-[#FF006E]/20 flex items-center justify-center text-[#E8EEF7] font-bold text-xs shrink-0">
                            {(u.name || u.email)[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#E8EEF7] truncate">{u.name || '—'}</p>
                            <p className="text-xs text-[#718096] truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-[#A0AEC0]">{u.phone || '—'}</td>
                      <td className="px-4 py-3.5">
                        <Badge color={u.role === 'ROLE_ADMIN' ? 'red' : 'cyan'}>
                          {u.role?.replace('ROLE_', '')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        {u.emailVerified
                          ? <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                          : <XCircle className="w-4 h-4 text-[#718096]" />}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge color={u.kycStatus === 'VERIFIED' ? 'green' : u.kycStatus === 'PENDING' ? 'yellow' : 'gray'}>
                          {u.kycStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-sm font-bold text-[#E8EEF7]">
                        {u.accountBalance !== undefined ? fmt(u.accountBalance) : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 text-xs font-bold rounded border ${u.isActive ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                            {u.isActive ? 'Active' : 'Frozen'}
                          </span>
                          {u.isAccountLocked && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20">
                              🔒 Locked
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); freezeUser(u.id, u.isActive); }}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-semibold transition ${
                              u.isActive
                                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                : 'bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20'
                            }`}>
                            {u.isActive ? <><Lock className="w-3 h-3" />Freeze</> : <><Unlock className="w-3 h-3" />Unfreeze</>}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedUser(u.id); }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-semibold bg-[#00F0FF]/10 text-[#00F0FF] hover:bg-[#00F0FF]/20 transition">
                            <Eye className="w-3 h-3" />View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="text-center py-12 text-[#A0AEC0]">No users found</div>
              )}
            </div>
          </div>
        )}

        {/* ── KYC TAB ───────────────────────────────────────────────────────────── */}
        {tab === TAB.KYC && (
          <div className="space-y-4">
            {kyc.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] rounded-2xl border border-white/5">
                <CheckCircle2 className="w-12 h-12 text-[#10B981] mx-auto mb-3" />
                <p className="text-[#E8EEF7] font-semibold">All KYC Reviews Complete!</p>
                <p className="text-[#A0AEC0] text-sm mt-1">No pending submissions</p>
              </div>
            ) : kyc.map(k => (
              <div key={k.id} className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-[#F59E0B]/20 rounded-2xl p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-[#E8EEF7]">{k.fullName}</h3>
                    <p className="text-[#A0AEC0] text-sm">{k.userEmail} · Submitted: {new Date(k.submittedAt).toLocaleDateString()}</p>
                  </div>
                  <span className="px-2 py-1 bg-[#F59E0B]/10 text-[#F59E0B] text-xs font-bold rounded-full border border-[#F59E0B]/20">
                    PENDING
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                  {[['DOB', k.dateOfBirth], ['Aadhaar', k.aadhaarNumber], ['PAN', k.panNumber], ['Address', k.address]].map(([label, val]) => (
                    <div key={label} className="bg-[#0B0F14]/50 p-2.5 rounded-lg border border-white/5">
                      <p className="text-xs text-[#718096] mb-0.5">{label}</p>
                      <p className="text-[#E8EEF7] font-medium text-xs font-mono truncate">{val || '—'}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => approveKyc(k.id)}
                    className="flex items-center gap-1.5 bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#10B981]/20 transition">
                    <CheckCircle2 className="w-4 h-4" /> Approve
                  </button>
                  <button onClick={() => setRejectForm({ id: k.id, reason: '' })}
                    className="flex items-center gap-1.5 bg-[#FF006E]/10 border border-[#FF006E]/30 text-[#FF006E] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#FF006E]/20 transition">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                  <button onClick={() => setSelectedUser(k.userId)}
                    className="flex items-center gap-1.5 bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#00F0FF]/20 transition ml-auto">
                    <Eye className="w-4 h-4" /> View User
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TRANSACTIONS TAB ──────────────────────────────────────────────────── */}
        {tab === TAB.TRANSACTIONS && (
          <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="font-bold text-[#E8EEF7] flex items-center gap-2">
                <Database className="w-4 h-4 text-[#00F0FF]" /> All Transactions
              </h2>
              <span className="text-xs text-[#718096]">{transactions.length} records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[900px]">
                <thead>
                  <tr className="border-b border-white/5 text-[#A0AEC0] text-xs uppercase tracking-wider">
                    {['TX ID', 'From', 'To', 'Type', 'Amount', 'Status', 'Date', 'Hash'].map(h => (
                      <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 100).map((tx, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition text-sm">
                      <td className="px-4 py-3 font-mono text-[#718096] text-xs">{tx.transactionId?.substring(0, 12) || `#${tx.id}`}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-[#E8EEF7] text-xs font-medium">{tx.fromUserName || '—'}</p>
                          <p className="text-[#718096] text-[10px] font-mono">{tx.fromAccountNumber || '—'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-[#E8EEF7] text-xs font-medium">{tx.toUserName || '—'}</p>
                          <p className="text-[#718096] text-[10px] font-mono">{tx.toAccountNumber || '—'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          tx.type === 'DEPOSIT' ? 'bg-[#10B981]/10 text-[#10B981]' :
                          tx.type === 'WITHDRAWAL' ? 'bg-[#FF006E]/10 text-[#FF006E]' :
                          tx.type === 'TRANSFER' ? 'bg-[#00F0FF]/10 text-[#00F0FF]' :
                          'bg-[#F59E0B]/10 text-[#F59E0B]'
                        }`}>{tx.type || '—'}</span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-[#E8EEF7]">{fmt(tx.amount)}</td>
                      <td className="px-4 py-3">
                        <Badge color={tx.status === 'COMPLETED' ? 'green' : tx.status === 'PENDING' ? 'yellow' : 'red'}>
                          {tx.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-[#718096] text-xs whitespace-nowrap">
                        {tx.date ? new Date(tx.date).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#A0AEC0] max-w-[120px] truncate">
                        {tx.blockchainHash ? tx.blockchainHash.substring(0, 16) + '...' : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {transactions.length === 0 && (
                <div className="text-center py-12 text-[#A0AEC0]">No transactions yet</div>
              )}
            </div>
          </div>
        )}

        {/* ── AUDIT LOGS TAB ────────────────────────────────────────────────────── */}
        {tab === TAB.AUDIT && (
          <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="font-bold text-[#E8EEF7] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#FF006E]" /> System Audit Logs
              </h2>
              <span className="text-xs text-[#718096]">{auditLogs.length} entries</span>
            </div>
            {auditLogs.length === 0 ? (
              <div className="text-center py-16">
                <Info className="w-10 h-10 text-[#4A5568] mx-auto mb-3" />
                <p className="text-[#A0AEC0]">No audit logs yet</p>
                <p className="text-[#718096] text-sm mt-1">Logs appear as users perform actions</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                  <thead>
                    <tr className="border-b border-white/5 text-[#A0AEC0] text-xs uppercase tracking-wider">
                      {['User', 'Action', 'Entity', 'Status', 'IP Address', 'Time'].map(h => (
                        <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.slice(0, 100).map((log, i) => (
                      <tr key={i} className={`border-b border-white/5 hover:bg-white/[0.02] transition text-sm ${log.status === 'FAILURE' ? 'bg-red-500/[0.02]' : ''}`}>
                        <td className="px-4 py-3">
                          <p className="text-[#E8EEF7] text-xs font-medium">{log.userName || '—'}</p>
                          <p className="text-[#718096] text-[10px]">{log.userEmail || '—'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#252C3C] text-[#A0AEC0] border border-white/5">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#A0AEC0]">{log.entityType} {log.entityId ? `#${log.entityId}` : ''}</td>
                        <td className="px-4 py-3">
                          <Badge color={log.status === 'SUCCESS' ? 'green' : 'red'}>{log.status}</Badge>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-[#718096]">{log.ipAddress || '—'}</td>
                        <td className="px-4 py-3 text-xs text-[#718096] whitespace-nowrap">
                          {log.createdAt ? new Date(log.createdAt).toLocaleString('en-IN') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
