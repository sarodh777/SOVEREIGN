import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import {
  CreditCard, Send, Plus, Minus, TrendingUp, User, ShieldCheck, Activity,
  Link as LinkIcon, CheckCircle2, AlertTriangle, Calendar, History, Search,
  ArrowDownRight, ArrowUpRight, Copy, RefreshCw, Wallet, Bell
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const email    = localStorage.getItem('userEmail') || '';
  const userName = localStorage.getItem('userName') || email.split('@')[0];

  const [account, setAccount]       = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [txSearch, setTxSearch]     = useState('');
  const [txFilter, setTxFilter]     = useState('all');
  const [loading, setLoading]       = useState(true);
  const [copied, setCopied]         = useState(false);

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
      }
    } catch (err) {
      if (err.response?.status === 401) navigate('/login');
    }
    setLoading(false);
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  const filtered = transactions.filter(tx => {
    const matchSearch = !txSearch || (tx.reference || tx.type || '').toLowerCase().includes(txSearch.toLowerCase());
    const matchFilter = txFilter === 'all' ? true :
      txFilter === '7days' ? new Date(tx.date) > new Date(Date.now() - 7*864e5) :
      new Date(tx.date) > new Date(Date.now() - 30*864e5);
    return matchSearch && matchFilter;
  });

  const formatCurrency = (v) => '₹ ' + Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  return (
    <div className="w-full min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* TOP ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Profile Card */}
          <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-[#00F0FF]/10 rounded-xl p-6 flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-gradient-to-r from-[#00F0FF] to-[#FF006E] rounded-full p-0.5 shrink-0">
                <div className="w-full h-full bg-[#0B0F14] rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-[#E8EEF7]" />
                </div>
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-[#E8EEF7] truncate">{userName.toUpperCase()}</h2>
                <p className="text-xs text-[#A0AEC0] truncate">{email}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-[#0B0F14]/50 p-3 rounded-lg border border-white/5">
                <p className="text-xs text-[#A0AEC0] mb-1 uppercase tracking-wider font-semibold">Account Number</p>
                <div className="flex justify-between items-center">
                  <p className="font-mono text-[#E8EEF7] font-bold text-sm truncate">
                    {loading ? '—' : (account?.accountNumber || 'No account')}
                  </p>
                  {account && (
                    <button onClick={() => copyToClipboard(account.accountNumber)} className="text-[#00F0FF] hover:text-white ml-2 shrink-0">
                      {copied ? <CheckCircle2 className="w-4 h-4 text-[#10B981]" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
              <div className="bg-[#0B0F14]/50 p-3 rounded-lg border border-white/5">
                <p className="text-xs text-[#A0AEC0] mb-1 uppercase tracking-wider font-semibold">Account Type</p>
                <p className="font-semibold text-[#00F0FF] text-sm">{account?.accountType || '—'}</p>
              </div>
              <div className="bg-[#0B0F14]/50 p-3 rounded-lg border border-white/5">
                <p className="text-xs text-[#A0AEC0] mb-1 uppercase tracking-wider font-semibold">Status</p>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${account?.status === 'ACTIVE' ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-red-500/10 text-red-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${account?.status === 'ACTIVE' ? 'bg-[#10B981] animate-pulse' : 'bg-red-400'}`} />
                  {account?.status || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Balance Cards */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Available Balance', value: account?.balance, color: '#00F0FF', icon: <Activity className="w-5 h-5 text-[#00F0FF]" />, border: '#00F0FF' },
              { label: 'Overdraft Limit',   value: account?.overdraftLimit, color: '#10B981', icon: <CheckCircle2 className="w-5 h-5 text-[#10B981]" />, border: '#10B981' },
              { label: 'Total Transactions', value: transactions.length, color: '#F59E0B', icon: <History className="w-5 h-5 text-[#F59E0B]" />, border: '#F59E0B', isCount: true },
            ].map((card, i) => (
              <div key={i} className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] rounded-xl p-7 flex flex-col justify-center relative overflow-hidden group"
                style={{ border: `1px solid ${card.border}30` }}>
                <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition" style={{ background: card.color }} />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">{card.icon}<p className="text-[#A0AEC0] text-xs font-semibold uppercase tracking-wider">{card.label}</p></div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-[#E8EEF7] tracking-tight">
                    {loading ? <span className="animate-pulse text-[#4A5568]">Loading...</span> :
                     card.isCount ? transactions.length :
                     formatCurrency(card.value)}
                  </h1>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MIDDLE ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chart */}
          <div className="lg:col-span-3 bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-[#00F0FF]/10 rounded-xl p-6">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-lg font-bold text-[#E8EEF7] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#00F0FF]" /> Transaction Analytics
                </h2>
                <p className="text-[#A0AEC0] text-xs mt-1">Income vs Expenses — Last 6 Months</p>
              </div>
              <button onClick={load} className="p-2 text-[#A0AEC0] hover:text-[#00F0FF] transition"><RefreshCw className="w-4 h-4" /></button>
            </div>
            <div className="w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ci" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ce" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF006E" stopOpacity={0.3} /><stop offset="95%" stopColor="#FF006E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#252C3C" vertical={false} />
                  <XAxis dataKey="name" stroke="#A0AEC0" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis stroke="#A0AEC0" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={v => `₹${v/1000}k`} />
                  <Tooltip contentStyle={{ background: '#0B0F14', border: '1px solid #00F0FF30', borderRadius: '8px', color: '#E8EEF7' }} />
                  <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#ci)" />
                  <Area type="monotone" dataKey="expenses" stroke="#FF006E" strokeWidth={2} fillOpacity={1} fill="url(#ce)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-[#00F0FF]/10 rounded-xl p-6">
            <h2 className="text-lg font-bold text-[#E8EEF7] mb-5">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Send, label: 'Send', path: '/transfer', color: '#00F0FF' },
                { icon: Plus, label: 'Deposit', path: '/deposit', color: '#10B981' },
                { icon: Minus, label: 'Withdraw', path: '/withdraw', color: '#F59E0B' },
                { icon: History, label: 'History', path: '/transactions', color: '#FF006E' },
              ].map(({ icon: Icon, label, path, color }) => (
                <Link key={path} to={path}
                  className="flex flex-col items-center justify-center bg-[#0B0F14] border border-white/5 p-4 rounded-xl transition-all hover:scale-105 group"
                  style={{ '--hover-color': color }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = color + '50'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}>
                  <Icon className="w-7 h-7 mb-2 group-hover:scale-110 transition" style={{ color }} />
                  <span className="text-xs font-semibold text-[#A0AEC0] group-hover:text-[#E8EEF7]">{label}</span>
                </Link>
              ))}
            </div>

            {/* Security Status */}
            <div className="mt-4 p-3 bg-[#10B981]/5 border border-[#10B981]/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                <span className="text-xs font-bold text-[#10B981] uppercase tracking-wider">Security Status</span>
              </div>
              <div className="space-y-1 text-xs text-[#A0AEC0]">
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-[#10B981]" /> JWT Auth Active</div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-[#10B981]" /> Email Verified</div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-[#10B981]" /> Blockchain Sync</div>
              </div>
            </div>
          </div>
        </div>

        {/* TRANSACTION TABLE */}
        <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-[#00F0FF]/10 rounded-xl p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-3">
            <h2 className="text-lg font-bold text-[#E8EEF7] flex items-center gap-2">
              <History className="w-5 h-5 text-[#00F0FF]" /> Recent Transactions
            </h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#718096]" />
                <input value={txSearch} onChange={e => setTxSearch(e.target.value)} placeholder="Search..."
                  className="bg-[#0B0F14] border border-[#00F0FF]/20 rounded-lg pl-9 pr-4 py-2 text-sm text-[#E8EEF7] focus:outline-none focus:border-[#00F0FF] transition w-40" />
              </div>
              <select value={txFilter} onChange={e => setTxFilter(e.target.value)}
                className="bg-[#0B0F14] border border-[#00F0FF]/20 rounded-lg px-3 py-2 text-sm text-[#E8EEF7] focus:outline-none focus:border-[#00F0FF]">
                <option value="all">All Time</option>
                <option value="30days">Last 30 Days</option>
                <option value="7days">Last 7 Days</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead>
                <tr className="border-b border-[#00F0FF]/10 text-[#A0AEC0] text-xs uppercase tracking-wider">
                  {['Date', 'Reference', 'Type', 'Amount', 'Status', 'Blockchain Hash'].map(h => (
                    <th key={h} className="px-3 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-[#E8EEF7]">
                {filtered.slice(0, 10).map((tx, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/3 transition">
                    <td className="px-3 py-3.5 text-xs text-[#A0AEC0]">{new Date(tx.date).toLocaleDateString()}</td>
                    <td className="px-3 py-3.5 text-sm font-medium">{tx.reference || tx.type}</td>
                    <td className="px-3 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${tx.direction === 'IN' ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#FF006E]/10 text-[#FF006E]'}`}>
                        {tx.direction === 'IN' ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        {tx.direction === 'IN' ? 'Credit' : 'Debit'}
                      </span>
                    </td>
                    <td className={`px-3 py-3.5 font-mono font-bold text-sm ${tx.direction === 'IN' ? 'text-[#10B981]' : 'text-[#E8EEF7]'}`}>
                      {tx.direction === 'IN' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${tx.status === 'COMPLETED' ? 'text-[#10B981] bg-[#10B981]/10' : tx.status === 'PENDING' ? 'text-[#F59E0B] bg-[#F59E0B]/10' : 'text-[#FF006E] bg-[#FF006E]/10'}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-xs text-[#A0AEC0] font-mono max-w-[160px] truncate">
                      {tx.blockchainHash ? tx.blockchainHash.substring(0, 20) + '...' : <span className="text-[#4A5568]">Not recorded</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && !loading && (
              <div className="text-center py-12">
                <History className="w-10 h-10 text-[#4A5568] mx-auto mb-3" />
                <p className="text-[#A0AEC0]">{txSearch ? 'No matching transactions' : 'No transactions yet'}</p>
                <Link to="/deposit" className="text-[#00F0FF] text-sm hover:underline mt-2 inline-block">Make your first deposit →</Link>
              </div>
            )}
          </div>
          {filtered.length > 10 && (
            <div className="mt-4 text-center">
              <Link to="/transactions" className="text-[#00F0FF] text-sm hover:underline">View all {filtered.length} transactions →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
