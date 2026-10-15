import React, { useEffect, useState, useCallback } from 'react';
import {
  History, Search, Filter, ArrowDownRight, ArrowUpRight, RefreshCw,
  Download, CheckCircle2, Clock, XCircle, Link as LinkIcon, FileDown,
  Fingerprint, ShieldCheck
} from 'lucide-react';
import api from '../api';
import UserReportModal from '../components/UserReportModal';
import SignatureVerificationModal from '../components/SignatureVerificationModal';

const TYPE_COLORS = {
  DEPOSIT:    { bg: 'bg-[#356BFF]/15', text: 'text-[#356BFF]', border: 'border-[#356BFF]/30' },
  WITHDRAWAL: { bg: 'bg-[#EC4899]/15', text: 'text-[#EC4899]', border: 'border-[#EC4899]/30' },
  TRANSFER:   { bg: 'bg-[#713BFF]/15', text: 'text-[#A855F7]', border: 'border-[#713BFF]/30' },
  PAYMENT:    { bg: 'bg-[#F59E0B]/15', text: 'text-[#F59E0B]', border: 'border-[#F59E0B]/30' },
  FEE:        { bg: 'bg-[#B8C5F2]/10', text: 'text-[#B8C5F2]', border: 'border-[rgba(139,146,255,0.2)]' },
};

const STATUS_ICONS = {
  COMPLETED: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
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
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedTxForSigModal, setSelectedTxForSigModal] = useState(null);
  const [accountInfo, setAccountInfo]   = useState({});
  const [userInfo, setUserInfo]         = useState({});

  const fmt = (v) => '₹ ' + Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch user profile
      try {
        const uRes = await api.get('/api/auth/profile');
        if (uRes.data.success && uRes.data.user) {
          setUserInfo(uRes.data.user);
        }
      } catch {
        // Ignore fallback profile error
      }

      // Use cached accountId or fetch
      let accountId = localStorage.getItem('accountId');
      const accRes = await api.get('/api/banking/accounts');
      if (accRes.data.success && accRes.data.accounts?.length) {
        const primaryAcc = accRes.data.accounts[0];
        setAccountInfo(primaryAcc);
        if (!accountId) {
          accountId = primaryAcc.id;
          localStorage.setItem('accountId', accountId);
        }
      }
      if (!accountId) { return; }

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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const fetchHistory = async () => {
      try {
        try {
          const uRes = await api.get('/api/auth/profile');
          if (!ignore && uRes.data.success && uRes.data.user) {
            setUserInfo(uRes.data.user);
          }
        } catch {
          // Ignore fallback profile error
        }

        let accountId = localStorage.getItem('accountId');
        const accRes = await api.get('/api/banking/accounts');
        if (accRes.data.success && accRes.data.accounts?.length) {
          const primaryAcc = accRes.data.accounts[0];
          if (!ignore) setAccountInfo(primaryAcc);
          if (!accountId) {
            accountId = primaryAcc.id;
            localStorage.setItem('accountId', accountId);
          }
        }
        if (!accountId) {
          if (!ignore) setLoading(false);
          return;
        }

        const res = await api.get(`/api/banking/transactions/${accountId}`);
        if (!ignore && res.data.success) {
          const txs = res.data.transactions || [];
          setTransactions(txs);

          const credits = txs.filter(t => t.direction === 'IN').reduce((s, t) => s + Number(t.amount), 0);
          const debits  = txs.filter(t => t.direction === 'OUT').reduce((s, t) => s + Number(t.amount), 0);
          setStats({ total: txs.length, credits, debits });
        }
      } catch (e) {
        if (!ignore) console.error('Failed to load transactions', e);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchHistory();
    return () => { ignore = true; };
  }, []);

  const [now] = useState(() => Date.now());

  const filtered = transactions.filter(tx => {
    const matchType   = typeFilter === 'ALL' || tx.type === typeFilter;
    const matchSearch = !search || [tx.reference, tx.type, tx.transactionId, tx.description]
      .some(f => f?.toLowerCase().includes(search.toLowerCase()));

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
    <div className="page-root">
      <div className="page-content space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#0B1550] rounded-2xl flex items-center justify-center border border-[rgba(139,146,255,0.22)] shadow-md">
              <History className="w-6 h-6 text-[#356BFF]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#F8FAFC]">Transaction History</h1>
              <p className="text-[#B8C5F2] text-sm">{stats.total} total transactions on record</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowPdfModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#356BFF] to-[#713BFF] hover:opacity-95 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-[#713BFF]/25"
            >
              <FileDown className="w-4 h-4" /> Download PDF Report
            </button>
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-[#0B1550] border border-[rgba(139,146,255,0.22)] rounded-xl text-sm text-[#B8C5F2] hover:text-[#F8FAFC] hover:border-[#713BFF]/40 transition">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button onClick={load} className="p-2.5 bg-[#0B1550] border border-[rgba(139,146,255,0.22)] rounded-xl text-[#B8C5F2] hover:text-[#F8FAFC] hover:border-[#713BFF]/40 transition">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Total Transactions', value: stats.total, format: 'count', color: '#713BFF', border: '#713BFF' },
            { label: 'Total Credits',      value: stats.credits, format: 'money', color: '#356BFF', border: '#356BFF' },
            { label: 'Total Debits',       value: stats.debits,  format: 'money', color: '#EC4899', border: '#EC4899' },
          ].map(({ label, value, format, color, border }) => (
            <div key={label} className="bg-[#111B57] bg-gradient-to-br from-[#111B57] to-[#0B1550] rounded-2xl p-5 border border-[rgba(139,146,255,0.22)] shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-xl opacity-15" style={{ background: color }} />
              <p className="text-[#B8C5F2] text-xs uppercase tracking-wider mb-2 font-medium">{label}</p>
              <p className="text-2xl font-bold font-mono tracking-tight" style={{ color }}>
                {format === 'money' ? fmt(value) : value}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-[#111B57] bg-gradient-to-br from-[#111B57] to-[#0B1550] border border-[rgba(139,146,255,0.22)] rounded-2xl p-4 shadow-xl">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#B8C5F2]/50" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transactions..."
                className="w-full bg-[#050B2E] border border-[rgba(139,146,255,0.22)] rounded-xl pl-9 pr-4 py-2 text-sm text-[#F8FAFC] placeholder-[#B8C5F2]/40 focus:outline-none focus:border-[#713BFF] transition" />
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Filter className="w-4 h-4 text-[#B8C5F2]/60" />
              {['ALL', 'DEPOSIT', 'TRANSFER'].map(t => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${typeFilter === t ? 'bg-gradient-to-r from-[#356BFF] to-[#713BFF] text-white shadow-md' : 'bg-[#050B2E] text-[#B8C5F2] hover:text-[#F8FAFC] border border-[rgba(139,146,255,0.18)]'}`}>
                  {t}
                </button>
              ))}
            </div>

            {/* Date Filter */}
            <select value={dateFilter} onChange={e => setDateFilter(e.target.value)}
              className="bg-[#050B2E] border border-[rgba(139,146,255,0.22)] rounded-xl px-3 py-2 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#713BFF]">
              <option value="ALL">All Time</option>
              <option value="7D">Last 7 Days</option>
              <option value="30D">Last 30 Days</option>
              <option value="90D">Last 90 Days</option>
            </select>

            <span className="text-[#B8C5F2]/60 text-xs ml-auto">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Transaction List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-2 border-[#713BFF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#B8C5F2]">Loading transactions...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-[#111B57] bg-gradient-to-br from-[#111B57] to-[#0B1550] rounded-2xl border border-[rgba(139,146,255,0.22)] shadow-xl">
            <History className="w-12 h-12 text-[#B8C5F2]/40 mx-auto mb-4" />
            <p className="text-[#F8FAFC] font-semibold">No transactions found</p>
            <p className="text-[#B8C5F2]/60 text-sm mt-1">{search || typeFilter !== 'ALL' ? 'Try changing your filters' : 'Make your first deposit to get started'}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((tx, i) => {
              const colors = TYPE_COLORS[tx.type] || TYPE_COLORS.DEPOSIT;
              const isExpanded = expandedTx === i;
              const isCredit   = tx.direction === 'IN';

              return (
                <div key={i}
                  onClick={() => setExpandedTx(isExpanded ? null : i)}
                  className={`bg-[#111B57] bg-gradient-to-br from-[#111B57] to-[#0B1550] border rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 shadow-lg ${isExpanded ? 'border-[#713BFF] shadow-[#713BFF]/10' : 'border-[rgba(139,146,255,0.18)] hover:border-[rgba(139,146,255,0.4)]'}`}>
                  {/* Row */}
                  <div className="flex items-center gap-4 p-4 sm:p-5">
                    {/* Direction Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isCredit ? 'bg-[#356BFF]/15 border border-[#356BFF]/30' : 'bg-[#EC4899]/15 border border-[#EC4899]/30'}`}>
                      {isCredit
                        ? <ArrowDownRight className="w-5 h-5 text-[#356BFF]" />
                        : <ArrowUpRight className="w-5 h-5 text-[#EC4899]" />}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[#F8FAFC] font-semibold text-sm truncate">
                          {tx.reference || tx.type}
                        </p>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${colors.bg} ${colors.text} ${colors.border}`}>
                          {tx.type}
                        </span>
                        {(tx.signatureVerified || tx.digitalSignature) && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#713BFF]/15 text-[#A855F7] border border-[#713BFF]/30 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            {tx.signatureVerified ? 'Verified' : 'Signed'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#B8C5F2]">
                        <span className="font-mono text-[11px] text-[#B8C5F2]/80">{tx.transactionId}</span>
                        <span>•</span>
                        <span>{new Date(tx.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</span>
                      </div>
                    </div>

                    {/* Amount + Status */}
                    <div className="text-right shrink-0">
                      <p className={`font-bold font-mono text-base ${isCredit ? 'text-emerald-400' : 'text-[#F8FAFC]'}`}>
                        {isCredit ? '+' : '−'}{fmt(tx.amount)}
                      </p>
                      <div className="flex items-center gap-1 justify-end mt-1">
                        {STATUS_ICONS[tx.status] || STATUS_ICONS.PENDING}
                        <span className="text-xs text-[#B8C5F2]">{tx.status}</span>
                      </div>
                    </div>

                    {/* Expand chevron */}
                    <span className="text-[#B8C5F2]/60 text-xs ml-1">{isExpanded ? '▲' : '▼'}</span>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="border-t border-[rgba(139,146,255,0.15)] bg-[#050B2E]/70 px-4 sm:px-6 py-4 space-y-3.5">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        {[
                          ['Transaction ID', tx.transactionId],
                          ['Date & Time', new Date(tx.date).toLocaleString()],
                          ['Fee Charged', tx.fee ? fmt(tx.fee) : '₹ 0.00'],
                          ['Status', tx.status],
                          ['Digital Signature', tx.signatureVerified ? 'VERIFIED (ECDSA P-256)' : (tx.digitalSignature ? 'Signed' : 'Standard Ledger')],
                          ['Transaction SHA-256 Hash', tx.transactionHash || tx.blockchainHash || 'Not recorded on chain'],
                        ].map(([k, v]) => (
                          <div key={k} className="bg-[#0B1550] rounded-xl p-3 border border-[rgba(139,146,255,0.15)]">
                            <p className="text-[#B8C5F2]/60 mb-0.5 uppercase tracking-wider text-[10px] font-semibold">{k}</p>
                            <p className={`text-[#F8FAFC] font-medium break-all ${k.includes('Hash') ? 'font-mono text-[10px] text-[#356BFF]' : ''}`}>{v}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTxForSigModal(tx.transactionId);
                          }}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#356BFF]/20 to-[#713BFF]/20 hover:from-[#356BFF]/30 hover:to-[#713BFF]/30 text-[#A855F7] border border-[#713BFF]/40 text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-md"
                        >
                          <Fingerprint className="w-4 h-4 text-[#713BFF]" />
                          <span>Verify Signature</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Digital Signature Verification Modal */}
        <SignatureVerificationModal
          isOpen={!!selectedTxForSigModal}
          onClose={() => setSelectedTxForSigModal(null)}
          transactionId={selectedTxForSigModal}
        />

        {/* User PDF Report Modal */}
        <UserReportModal
          isOpen={showPdfModal}
          onClose={() => setShowPdfModal(false)}
          allTransactions={transactions}
          accountInfo={accountInfo}
          userInfo={userInfo}
        />
      </div>
    </div>
  );
}
