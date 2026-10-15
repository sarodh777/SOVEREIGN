import React, { useState, useEffect } from 'react';
import {
  Activity, Search, Filter, AlertTriangle, ArrowUpRight, ArrowDownLeft,
  RefreshCw, CheckCircle2, XCircle, Clock, ExternalLink, FileDown
} from 'lucide-react';
import api from '../../api';
import AdminReportModal from '../../components/AdminReportModal';

export default function TransactionMonitoring() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedTx, setSelectedTx] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/transactions');
      setTransactions(res.data.transactions || []);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filteredTx = transactions.filter((tx) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      (tx.transactionId && tx.transactionId.toLowerCase().includes(q)) ||
      (tx.fromUserEmail && tx.fromUserEmail.toLowerCase().includes(q)) ||
      (tx.toUserEmail && tx.toUserEmail.toLowerCase().includes(q)) ||
      (tx.blockchainHash && tx.blockchainHash.toLowerCase().includes(q)) ||
      (tx.reference && tx.reference.toLowerCase().includes(q));

    const matchesType = typeFilter === 'ALL' || tx.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || tx.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="page-root">
      <div className="page-content space-y-6 text-[var(--text-primary)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#8B92FF]/20 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#356BFF]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#A855F7]">Surveillance Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] mt-1">Transaction Monitoring</h1>
          <p className="text-sm text-[#B8C5F2]">Audit platform-wide capital flows, investigate anomalies & inspect immutable blockchain hashes</p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setShowPdfModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#356BFF] to-[#713BFF] hover:opacity-95 text-xs font-bold text-white transition shadow-[0_0_20px_rgba(113,59,255,0.35)] active:scale-[0.98] cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            Download PDF Report
          </button>
          <button
            onClick={fetchTransactions}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111B57] hover:bg-[#111B57]/80 text-xs font-semibold text-[#B8C5F2] hover:text-white border border-[#8B92FF]/25 cursor-pointer transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#713BFF]' : ''}`} />
            Refresh Flow
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-[#111B57]/80 backdrop-blur-md border border-[#8B92FF]/22 rounded-2xl shadow-[0_8px_32px_rgba(5,11,46,0.5)]">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-[#8B92FF]/50 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by TxID, Sender/Receiver Email, Hash, or Reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0B1550] border border-[#8B92FF]/25 rounded-xl text-xs text-[#F8FAFC] placeholder-[#8B92FF]/40 focus:outline-none focus:border-[#713BFF]"
          />
        </div>

        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 bg-[#0B1550] border border-[#8B92FF]/25 rounded-xl text-xs text-[#F8FAFC] focus:outline-none focus:border-[#713BFF]"
          >
            <option value="ALL">All Types</option>
            <option value="TRANSFER">Transfer</option>
            <option value="DEPOSIT">Deposit</option>
            <option value="WITHDRAWAL">Withdrawal</option>
            <option value="SMART_TRANSFER">Smart Transfer</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-[#0B1550] border border-[#8B92FF]/25 rounded-xl text-xs text-[#F8FAFC] focus:outline-none focus:border-[#713BFF]"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-[#111B57]/80 backdrop-blur-md border border-[#8B92FF]/22 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(5,11,46,0.5)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B1550] text-[#B8C5F2] uppercase text-[10px] tracking-wider border-b border-[#8B92FF]/20">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Transaction ID</th>
                <th className="py-3.5 px-4 font-semibold">Type</th>
                <th className="py-3.5 px-4 font-semibold">Sender / Origin</th>
                <th className="py-3.5 px-4 font-semibold">Recipient / Dest</th>
                <th className="py-3.5 px-4 font-semibold">Amount</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Blockchain Sync</th>
                <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                <th className="py-3.5 px-4 font-semibold text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#8B92FF]/10 text-[#B8C5F2]">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-[#B8C5F2]/60">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#713BFF] mb-2" />
                    Scanning financial telemetry...
                  </td>
                </tr>
              ) : filteredTx.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-[#B8C5F2]/60">
                    No transactions matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTx.map((tx) => {
                  const isHighValue = Number(tx.amount || 0) >= 50000;
                  return (
                    <tr key={tx.id} className="hover:bg-[#356BFF]/5 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#F8FAFC]">
                        {tx.transactionId}
                      </td>

                      <td className="py-3.5 px-4 font-bold">
                        <span className="text-[#F8FAFC]">{tx.type}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="text-[#F8FAFC] font-medium truncate max-w-[140px]">{tx.fromUserEmail || 'External Cash'}</p>
                        {tx.fromAccountNumber && <p className="text-[#B8C5F2]/60 text-[10px] font-mono">{tx.fromAccountNumber}</p>}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="text-[#F8FAFC] font-medium truncate max-w-[140px]">{tx.toUserEmail || 'External Bank'}</p>
                        {tx.toAccountNumber && <p className="text-[#B8C5F2]/60 text-[10px] font-mono">{tx.toAccountNumber}</p>}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-black">
                        <span className={isHighValue ? 'text-[#EC4899] flex items-center gap-1 font-bold' : 'text-[#F8FAFC]'}>
                          ₹{Number(tx.amount || 0).toLocaleString()}
                          {isHighValue && <AlertTriangle className="w-3 h-3 text-amber-400" title="High value transaction" />}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.status === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                              : tx.status === 'FAILED'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {tx.blockchainHash ? (
                          <span className="px-2 py-0.5 rounded-full bg-[#356BFF]/15 text-[#356BFF] border border-[#356BFF]/30 text-[10px] font-mono">
                            CONFIRMED
                          </span>
                        ) : (
                          <span className="text-[#B8C5F2]/50 text-[10px]">PENDING</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-[#B8C5F2]/70 font-mono text-[11px]">
                        {tx.date ? new Date(tx.date).toLocaleString() : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="px-2.5 py-1 rounded-lg bg-[#0B1550] hover:bg-[#111B57] text-[#356BFF] hover:text-[#713BFF] text-[11px] font-semibold border border-[#8B92FF]/25 cursor-pointer transition"
                        >
                          Audit
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Audit Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050B2E]/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-[#0B1550] border border-[#8B92FF]/30 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-[0_16px_50px_rgba(5,11,46,0.9)]">
            <div className="flex items-center justify-between border-b border-[#8B92FF]/20 pb-3">
              <div className="flex items-center gap-2 font-bold text-[#F8FAFC]">
                <Activity className="w-5 h-5 text-[#356BFF]" />
                Audit Transaction: {selectedTx.transactionId}
              </div>
              <button onClick={() => setSelectedTx(null)} className="text-[#B8C5F2] hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-3.5 bg-[#111B57]/80 rounded-xl border border-[#8B92FF]/20">
                <span className="text-[#B8C5F2]">Transaction Amount</span>
                <span className="font-mono font-black text-base text-[#F8FAFC]">₹{Number(selectedTx.amount || 0).toLocaleString()}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#111B57]/80 rounded-xl border border-[#8B92FF]/20">
                  <span className="text-[#B8C5F2]">Type</span>
                  <p className="font-bold text-[#F8FAFC] mt-1">{selectedTx.type}</p>
                </div>
                <div className="p-3 bg-[#111B57]/80 rounded-xl border border-[#8B92FF]/20">
                  <span className="text-[#B8C5F2]">Status</span>
                  <p className="font-bold text-emerald-400 mt-1">{selectedTx.status}</p>
                </div>
              </div>

              <div className="p-3 bg-[#111B57]/80 rounded-xl border border-[#8B92FF]/20 space-y-1">
                <span className="text-[#B8C5F2]">Reference Note</span>
                <p className="font-mono text-[#F8FAFC]">{selectedTx.reference || 'Standard Banking Transfer'}</p>
              </div>

              <div className="p-3 bg-[#111B57]/80 rounded-xl border border-[#356BFF]/30 space-y-1">
                <span className="text-[#356BFF] font-bold">Distributed Ledger (Blockchain Hash)</span>
                <p className="font-mono text-[11px] text-[#356BFF] break-all bg-[#050B2E] p-2.5 rounded-lg border border-[#8B92FF]/20">
                  {selectedTx.blockchainHash || 'Awaiting block confirmation miner sync.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 rounded-xl bg-[#111B57] hover:bg-[#111B57]/80 text-xs font-semibold text-[#B8C5F2] hover:text-white cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin PDF Transaction Report Modal */}
      <AdminReportModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        preloadedTransactions={transactions}
      />
      </div>
    </div>
  );
}
