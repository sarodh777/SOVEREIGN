import React, { useEffect, useState, useCallback } from 'react';
import {
  History, Search, Filter, ArrowDownRight, ArrowUpRight, RefreshCw,
  Download, CheckCircle2, Clock, XCircle, Link as LinkIcon
} from 'lucide-react';
import api from '../api';

const TYPE_COLORS = {
  DEPOSIT:    { bg: 'bg-[#10B981]/10', text: 'text-[#10B981]', border: 'border-[#10B981]/20' },
  WITHDRAWAL: { bg: 'bg-[#FF006E]/10', text: 'text-[#FF006E]', border: 'border-[#FF006E]/20' },
  TRANSFER:   { bg: 'bg-[#00F0FF]/10', text: 'text-[#00F0FF]', border: 'border-[#00F0FF]/20' },
  PAYMENT:    { bg: 'bg-[#F59E0B]/10', text: 'text-[#F59E0B]', border: 'border-[#F59E0B]/20' },
  FEE:        { bg: 'bg-[#718096]/10', text: 'text-[#718096]', border: 'border-[#718096]/20' },
};

const STATUS_ICONS = {
  COMPLETED: <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />,
  PENDING:   <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />,
  FAILED:    <XCircle className="w-3.5 h-3.5 text-red-400" />,
};

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [typeFilter, setTypeFilter]     = useState('ALL');
  const [dateFilter, setDateFilter]     = useState('ALL');
  const [expandedTx, setExpandedTx]    = useState(null);
  const [stats, setStats]               = useState({ total: 0, credits: 0, debits: 0 });

  const fmt = (v) => '₹ ' + Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Use cached accountId or fetch
      let accountId = localStorage.getItem('accountId');
      if (!accountId) {
        const accRes = await api.get('/api/banking/accounts');
        if (accRes.data.success && accRes.data.accounts?.length) {
          accountId = accRes.data.accounts[0].id;
          localStorage.setItem('accountId', accountId);
        }
      }
      if (!accountId) { setLoading(false); return; }

      const res = await api.get(`/api/banking/transactions/${accountId}`);
      if (res.data.success) {
        const txs = res.data.transactions || [];
        setTransactions(txs);

        const credits = txs.filter(t => t.direction === 'IN').reduce((s, t) => s + Number(t.amount), 0);
        const debits  = txs.filter(t => t.direction === 'OUT').reduce((s, t) => s + Number(t.amount), 0);
        setStats({ total: txs.length, credits, debits });
      }
    } catch (e) {
      console.error('Failed to load transactions', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = transactions.filter(tx => {
    const matchType   = typeFilter === 'ALL' || tx.type === typeFilter;
    const matchSearch = !search || [tx.reference, tx.type, tx.transactionId, tx.description]
      .some(f => f?.toLowerCase().includes(search.toLowerCase()));

    const now = Date.now();
    const txDate = new Date(tx.date).getTime();
    const matchDate =
      dateFilter === 'ALL'    ? true :
      dateFilter === '7D'     ? txDate > now - 7 * 864e5 :
      dateFilter === '30D'    ? txDate > now - 30 * 864e5 :
      dateFilter === '90D'    ? txDate > now - 90 * 864e5 : true;

    return matchType && matchSearch && matchDate;
  });

  const exportCSV = () => {
    const header = 'Date,ID,Type,Direction,Amount,Reference,Status,Blockchain Hash\n';
    const rows = filtered.map(tx =>
      [new Date(tx.date).toLocaleDateString(), tx.transactionId, tx.type,
       tx.direction, tx.amount, `"${tx.reference || ''}"`, tx.status, tx.blockchainHash || ''].join(',')
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'transactions.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full min-h-screen p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#00F0FF]/10 rounded-xl flex items-center justify-center border border-[#00F0FF]/20">
              <History className="w-6 h-6 text-[#00F0FF]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#E8EEF7]">Transaction History</h1>
              <p className="text-[#A0AEC0] text-sm">{stats.total} total transactions on record</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-[#1A1F2E] border border-white/10 rounded-lg text-sm text-[#A0AEC0] hover:text-white hover:border-[#00F0FF]/30 transition">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button onClick={load} className="p-2 bg-[#1A1F2E] border border-white/10 rounded-lg text-[#A0AEC0] hover:text-[#00F0FF] transition">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Total Transactions', value: stats.total, format: 'count', color: '#00F0FF' },
            { label: 'Total Credits',      value: stats.credits, format: 'money', color: '#10B981' },
            { label: 'Total Debits',       value: stats.debits,  format: 'money', color: '#FF006E' },
          ].map(({ label, value, format, color }) => (
            <div key={label} className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] rounded-xl p-5 border" style={{ borderColor: color + '20' }}>
              <p className="text-[#A0AEC0] text-xs uppercase tracking-wider mb-2">{label}</p>
              <p className="text-2xl font-bold font-mono" style={{ color }}>
                {format === 'money' ? fmt(value) : value}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border border-white/5 rounded-xl p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#718096]" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transactions..."
                className="w-full bg-[#0B0F14] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-[#E8EEF7] placeholder-[#718096] focus:outline-none focus:border-[#00F0FF] transition" />
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Filter className="w-4 h-4 text-[#718096]" />
              {['ALL', 'DEPOSIT', 'WITHDRAWAL', 'TRANSFER'].map(t => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${typeFilter === t ? 'bg-[#00F0FF] text-[#0B0F14]' : 'bg-[#0B0F14] text-[#A0AEC0] hover:text-white border border-white/10'}`}>
                  {t}
                </button>
              ))}
            </div>

            {/* Date Filter */}
            <select value={dateFilter} onChange={e => setDateFilter(e.target.value)}
              className="bg-[#0B0F14] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#E8EEF7] focus:outline-none focus:border-[#00F0FF]">
              <option value="ALL">All Time</option>
              <option value="7D">Last 7 Days</option>
              <option value="30D">Last 30 Days</option>
              <option value="90D">Last 90 Days</option>
            </select>

            <span className="text-[#718096] text-xs ml-auto">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Transaction List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-2 border-[#00F0FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#A0AEC0]">Loading transactions...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] rounded-2xl border border-white/5">
            <History className="w-12 h-12 text-[#4A5568] mx-auto mb-4" />
            <p className="text-[#E8EEF7] font-semibold">No transactions found</p>
            <p className="text-[#718096] text-sm mt-1">{search || typeFilter !== 'ALL' ? 'Try changing your filters' : 'Make your first deposit to get started'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((tx, i) => {
              const colors = TYPE_COLORS[tx.type] || TYPE_COLORS.DEPOSIT;
              const isExpanded = expandedTx === i;
              const isCredit   = tx.direction === 'IN';

              return (
                <div key={i}
                  onClick={() => setExpandedTx(isExpanded ? null : i)}
                  className={`bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border rounded-xl overflow-hidden cursor-pointer transition-all ${isExpanded ? 'border-[#00F0FF]/30' : 'border-white/5 hover:border-white/15'}`}>
                  {/* Row */}
                  <div className="flex items-center gap-4 p-4">
                    {/* Direction Icon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isCredit ? 'bg-[#10B981]/10 border border-[#10B981]/20' : 'bg-[#FF006E]/10 border border-[#FF006E]/20'}`}>
                      {isCredit
                        ? <ArrowDownRight className="w-5 h-5 text-[#10B981]" />
                        : <ArrowUpRight className="w-5 h-5 text-[#FF006E]" />}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[#E8EEF7] font-semibold text-sm truncate">
                          {tx.reference || tx.type}
                        </p>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${colors.bg} ${colors.text} ${colors.border}`}>
                          {tx.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#718096]">
                        <span className="font-mono">{tx.transactionId}</span>
                        <span>•</span>
                        <span>{new Date(tx.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</span>
                      </div>
                    </div>

                    {/* Amount + Status */}
                    <div className="text-right shrink-0">
                      <p className={`font-bold font-mono text-base ${isCredit ? 'text-[#10B981]' : 'text-[#E8EEF7]'}`}>
                        {isCredit ? '+' : '−'}{fmt(tx.amount)}
                      </p>
                      <div className="flex items-center gap-1 justify-end mt-1">
                        {STATUS_ICONS[tx.status] || STATUS_ICONS.PENDING}
                        <span className="text-xs text-[#718096]">{tx.status}</span>
                      </div>
                    </div>

                    {/* Expand chevron */}
                    <span className="text-[#718096] text-xs ml-1">{isExpanded ? '▲' : '▼'}</span>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="border-t border-white/5 bg-[#0B0F14]/50 px-4 py-3 grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      {[
                        ['Transaction ID', tx.transactionId],
                        ['Date & Time', new Date(tx.date).toLocaleString()],
                        ['Fee Charged', tx.fee ? fmt(tx.fee) : '₹ 0.00'],
                        ['Status', tx.status],
                        ['Description', tx.description || 'N/A'],
                        ['Blockchain Hash', tx.blockchainHash || 'Not recorded on chain'],
                      ].map(([k, v]) => (
                        <div key={k} className="bg-[#1A1F2E] rounded-lg p-2.5">
                          <p className="text-[#718096] mb-0.5 uppercase tracking-wider text-[10px]">{k}</p>
                          <p className={`text-[#E8EEF7] font-medium break-all ${k === 'Blockchain Hash' ? 'font-mono text-[10px]' : ''}`}>{v}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
