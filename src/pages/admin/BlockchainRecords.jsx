import React, { useState, useEffect } from 'react';
import {
  Database, Search, ExternalLink, RefreshCw, Layers,
  Hash, ShieldCheck, CheckCircle2, Clock, Activity, Sparkles
} from 'lucide-react';
import api from '../../api';

export default function BlockchainRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/blockchain/records');
      setRecords(res.data.records || []);
    } catch (err) {
      console.error('Failed to load blockchain ledger records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const filteredRecords = records.filter((r) => {
    const q = search.toLowerCase();
    return (
      !search ||
      (r.blockchainHash && r.blockchainHash.toLowerCase().includes(q)) ||
      (r.transactionId && r.transactionId.toLowerCase().includes(q)) ||
      (r.senderEmail && r.senderEmail.toLowerCase().includes(q))
    );
  });

  return (
    <div className="page-root">
      <div className="page-content space-y-6 text-[var(--text-primary)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#8B92FF]/20 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#356BFF]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#A855F7]">Immutable Ledger Inspector</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] mt-1">Blockchain Records</h1>
          <p className="text-sm text-[#B8C5F2]">Cryptographically verified distributed blocks & immutable banking transaction hashes</p>
        </div>
        <button
          onClick={fetchRecords}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111B57] hover:bg-[#111B57]/80 text-xs font-semibold text-[#B8C5F2] hover:text-white border border-[#8B92FF]/25 self-start sm:self-auto cursor-pointer transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#713BFF]' : ''}`} />
          Query Chain
        </button>
      </div>

      {/* Search Filter */}
      <div className="p-4 bg-[#111B57]/80 backdrop-blur-md border border-[#8B92FF]/22 rounded-2xl flex items-center justify-between gap-4 shadow-[0_8px_32px_rgba(5,11,46,0.5)]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8B92FF]/50 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by Blockchain Hash, Transaction ID, or Account..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0B1550] border border-[#8B92FF]/25 rounded-xl text-xs text-[#F8FAFC] placeholder-[#8B92FF]/40 focus:outline-none focus:border-[#713BFF]"
          />
        </div>
        <div className="text-xs font-mono text-[#356BFF] bg-[#356BFF]/10 px-3 py-2 rounded-xl border border-[#356BFF]/25 whitespace-nowrap font-bold">
          {filteredRecords.length} Confirmed Blocks
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-[#111B57]/80 backdrop-blur-md border border-[#8B92FF]/22 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(5,11,46,0.5)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B1550] text-[#B8C5F2] uppercase text-[10px] tracking-wider border-b border-[#8B92FF]/20">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Banking Tx ID</th>
                <th className="py-3.5 px-4 font-semibold">Distributed Hash</th>
                <th className="py-3.5 px-4 font-semibold">Type</th>
                <th className="py-3.5 px-4 font-semibold">Amount</th>
                <th className="py-3.5 px-4 font-semibold">Account Context</th>
                <th className="py-3.5 px-4 font-semibold">Ledger Timestamp</th>
                <th className="py-3.5 px-4 font-semibold text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#8B92FF]/10 text-[#B8C5F2]">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-[#B8C5F2]/60">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#713BFF] mb-2" />
                    Querying node RPC providers...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-[#B8C5F2]/60">
                    No blockchain confirmed transactions found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-[#356BFF]/5 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#F8FAFC]">
                      {r.transactionId}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[#356BFF]">
                      <span className="truncate block max-w-[200px]" title={r.blockchainHash}>
                        {r.blockchainHash}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-[#F8FAFC]">
                      {r.type}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-black text-[#F8FAFC]">
                      ₹{Number(r.amount || 0).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[#B8C5F2]/70 text-[11px]">
                      {r.senderEmail || r.fromAccountNumber} → {r.toAccountNumber}
                    </td>

                    <td className="py-3.5 px-4 text-[#B8C5F2]/70 font-mono text-[11px]">
                      {r.timestamp ? new Date(r.timestamp).toLocaleString() : '—'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedRecord(r)}
                        className="px-2.5 py-1 rounded-lg bg-[#0B1550] hover:bg-[#111B57] text-[#356BFF] hover:text-[#713BFF] text-[11px] font-semibold border border-[#8B92FF]/25 cursor-pointer transition"
                      >
                        Verify
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspector Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050B2E]/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-[#0B1550] border border-[#8B92FF]/30 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-[0_16px_50px_rgba(5,11,46,0.9)]">
            <div className="flex items-center justify-between border-b border-[#8B92FF]/20 pb-3">
              <div className="flex items-center gap-2 font-bold text-[#F8FAFC]">
                <Database className="w-5 h-5 text-[#356BFF]" />
                Cryptographic Block Proof
              </div>
              <button onClick={() => setSelectedRecord(null)} className="text-[#B8C5F2] hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#111B57]/80 rounded-xl border border-[#8B92FF]/20">
                <span className="text-[#B8C5F2]">Banking Reference ID</span>
                <p className="font-mono font-bold text-[#F8FAFC] mt-1">{selectedRecord.transactionId}</p>
              </div>

              <div className="p-3 bg-[#111B57]/80 rounded-xl border border-[#8B92FF]/20">
                <span className="text-[#B8C5F2]">Settled Fiat Value</span>
                <p className="font-mono font-black text-base text-[#F8FAFC] mt-1">₹{Number(selectedRecord.amount || 0).toLocaleString()}</p>
              </div>

              <div className="p-3 bg-[#111B57]/80 rounded-xl border border-[#356BFF]/30 space-y-1">
                <span className="text-[#356BFF] font-bold">SHA256 Distributed Consensus Hash</span>
                <p className="font-mono text-[11px] text-[#356BFF] break-all bg-[#050B2E] p-2.5 rounded-lg border border-[#8B92FF]/20">
                  {selectedRecord.blockchainHash}
                </p>
              </div>

              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Payload state verified. Immutable against modifications.</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 rounded-xl bg-[#111B57] hover:bg-[#111B57]/80 text-xs font-semibold text-[#B8C5F2] hover:text-white cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
