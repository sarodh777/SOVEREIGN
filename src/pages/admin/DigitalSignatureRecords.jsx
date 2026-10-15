import React, { useState, useEffect } from 'react';
import {
  Fingerprint, ShieldCheck, ShieldAlert, CheckCircle2, XCircle,
  AlertTriangle, RefreshCw, Search, Filter, Eye, Lock, ArrowUpRight,
  Database, Shield, Copy, Check, Terminal, ExternalLink, Cpu, Activity
} from 'lucide-react';
import api from '../../api';

export default function DigitalSignatureRecords() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [telemetry, setTelemetry] = useState(null);
  const [audits, setAudits] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [reverifyLoading, setReverifyLoading] = useState(false);
  const [reverifyResult, setReverifyResult] = useState(null);
  const [copiedText, setCopiedText] = useState('');

  const fetchRecords = async () => {
    try {
      const res = await api.get('/api/admin/signature-verifications');
      if (res.data?.success) {
        setTelemetry(res.data.telemetry);
        setAudits(res.data.audits || []);
      }
    } catch (err) {
      console.error('Failed to fetch digital signature verification records:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRecords();
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const handleReverify = async (transactionId) => {
    setReverifyLoading(true);
    setReverifyResult(null);
    try {
      const res = await api.post(`/api/admin/signature-verifications/re-verify/${transactionId}`);
      if (res.data?.success) {
        setReverifyResult(res.data);
        fetchRecords(); // refresh audits to reflect new admin verification
      }
    } catch (err) {
      setReverifyResult({
        success: false,
        verified: false,
        message: err.response?.data?.message || 'Re-verification request failed'
      });
    } finally {
      setReverifyLoading(false);
    }
  };

  const filteredAudits = audits.filter(a => {
    const matchesSearch =
      (a.transactionId || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.senderEmail || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.senderAccount || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.transactionHash || '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ? true :
      statusFilter === 'VERIFIED' ? a.verificationStatus === 'VERIFIED' :
      statusFilter === 'TAMPERED' ? a.verificationStatus === 'TAMPERED' :
      statusFilter === 'INVALID' ? (a.verificationStatus === 'INVALID_SIGNATURE' || a.verificationStatus === 'FAILED') :
      true;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Verified
          </span>
        );
      case 'TAMPERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5 text-rose-400" /> Tampered
          </span>
        );
      case 'INVALID_SIGNATURE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Invalid Sig
          </span>
        );
      case 'REPLAY_ATTACK':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-400" /> Replay Prevented
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#356BFF]/15 text-[#B8C5F2] border border-[#8B92FF]/20">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  return (
    <div className="page-root">
      <div className="page-content space-y-7 text-[var(--text-primary)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#8B92FF]/20 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#356BFF] shadow-[0_0_8px_#356BFF] animate-pulse shrink-0" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#B8C5F2]">Cryptographic Assurance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight flex items-center gap-2.5">
            <Fingerprint className="w-7 h-7 text-[#713BFF]" />
            Digital Signature Verification
          </h1>
          <p className="text-sm text-[#B8C5F2] mt-0.5">
            Supervisory monitoring of client ECDSA P-256 signatures, hash integrity audits, and anti-tamper telemetry
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111B57] hover:bg-[#16226B] text-sm font-semibold text-[#B8C5F2] hover:text-white border border-[#8B92FF]/25 transition-all shadow-md cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-[#356BFF] ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Telemetry Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {[
          { label: 'Signed Transactions', val: telemetry?.totalSignedTransactions ?? 0, color: 'text-white', border: 'border-[#8B92FF]/25', glow: 'from-[#356BFF]/10 to-[#713BFF]/10' },
          { label: 'Verification Attempts', val: telemetry?.totalVerificationAttempts ?? 0, color: 'text-[#356BFF]', border: 'border-[#356BFF]/30', glow: 'from-[#356BFF]/15 to-transparent' },
          { label: 'Verified Signatures', val: telemetry?.totalVerified ?? 0, color: 'text-emerald-400', border: 'border-emerald-500/30', glow: 'from-emerald-500/10 to-transparent' },
          { label: 'Tampered Payloads', val: telemetry?.totalTampered ?? 0, color: 'text-rose-400', border: 'border-rose-500/30', glow: 'from-rose-500/10 to-transparent' },
          { label: 'Invalid / Mismatch', val: telemetry?.totalInvalidSignatures ?? 0, color: 'text-amber-400', border: 'border-amber-500/30', glow: 'from-amber-500/10 to-transparent' },
          { label: 'Integrity Rate', val: `${telemetry?.successRate ?? 100}%`, color: 'text-[#A855F7]', border: 'border-[#A855F7]/30', glow: 'from-[#713BFF]/15 to-transparent' },
        ].map((item, idx) => (
          <div key={idx} className={`p-4 rounded-2xl bg-gradient-to-br ${item.glow} bg-[#111B57] border ${item.border} shadow-lg relative overflow-hidden`}>
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#B8C5F2] block">{item.label}</span>
            <div className={`text-2xl sm:text-3xl font-black mt-1.5 ${item.color}`}>{item.val}</div>
          </div>
        ))}
      </div>

      {/* Security Privacy Notice */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#111B57] via-[#0B1550] to-[#111B57] border border-[#8B92FF]/25 flex items-start gap-3.5 text-xs text-[#B8C5F2] shadow-md">
        <div className="p-2 rounded-xl bg-[#713BFF]/15 border border-[#713BFF]/30 shrink-0 mt-0.5">
          <Lock className="w-4 h-4 text-[#A855F7]" />
        </div>
        <div>
          <strong className="text-white block text-sm mb-0.5 font-bold">Non-Custodial Cryptographic Isolation</strong>
          All transactions are signed on the user's client device with isolated ECDSA P-256 private keys. Private keys are <span className="text-white font-bold underline decoration-[#356BFF]">never transmitted to the backend server</span> or recorded on the blockchain. Admins inspect only canonical hashes and public keys.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#111B57] p-4 rounded-2xl border border-[#8B92FF]/20 shadow-md">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#B8C5F2] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Transaction ID, sender email, or hash..."
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-[#0B1550] border border-[#8B92FF]/25 text-xs text-white placeholder-[#B8C5F2]/60 focus:outline-none focus:border-[#713BFF] focus:ring-1 focus:ring-[#713BFF] transition"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {['ALL', 'VERIFIED', 'TAMPERED', 'INVALID'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 border ${
                statusFilter === s
                  ? 'bg-gradient-to-r from-[#356BFF] to-[#713BFF] text-white border-transparent shadow-md shadow-[#356BFF]/25 font-bold'
                  : 'bg-[#0B1550] text-[#B8C5F2] border-[#8B92FF]/20 hover:border-[#713BFF]/50 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#111B57] rounded-2xl border border-[#8B92FF]/20 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B1550] text-[#B8C5F2] uppercase font-mono tracking-wider border-b border-[#8B92FF]/20">
              <tr>
                <th className="px-5 py-4">Transaction ID</th>
                <th className="px-5 py-4">Sender</th>
                <th className="px-5 py-4">Amount</th>
                <th className="px-5 py-4">SHA-256 Hash</th>
                <th className="px-5 py-4">Verification Status</th>
                <th className="px-5 py-4">Mode</th>
                <th className="px-5 py-4">Timestamp</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#8B92FF]/10">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-[#B8C5F2]">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#713BFF] mb-2" />
                    Loading cryptographic verification logs...
                  </td>
                </tr>
              ) : filteredAudits.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-[#B8C5F2]">
                    No digital signature verification records match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredAudits.map((item) => (
                  <tr key={item.id} className="hover:bg-[#16226B]/50 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-white">
                      {item.transactionId}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-white font-medium">{item.senderEmail || 'N/A'}</div>
                      <div className="text-[#B8C5F2] font-mono text-[11px]">{item.senderAccount} → {item.recipientAccount}</div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-white font-bold">
                      ₹{Number(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[#B8C5F2]">
                      {item.transactionHash ? (
                        <div className="flex items-center gap-1.5">
                          <span className="truncate max-w-[120px]">{item.transactionHash.substring(0, 12)}...</span>
                          <button
                            onClick={() => handleCopy(item.transactionHash, `hash-${item.id}`)}
                            className="text-[#B8C5F2] hover:text-[#713BFF] cursor-pointer transition"
                            title="Copy full hash"
                          >
                            {copiedText === `hash-${item.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      {getStatusBadge(item.verificationStatus)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-[#0B1550] border border-[#8B92FF]/20 text-[#B8C5F2]">
                        {item.verifiedBy || 'SYSTEM'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[#B8C5F2] font-mono">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN') : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedAudit(item);
                          setReverifyResult(null);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#356BFF]/20 to-[#713BFF]/20 hover:from-[#356BFF]/35 hover:to-[#713BFF]/35 text-[#F8FAFC] font-semibold border border-[#8B92FF]/30 transition cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#713BFF]" /> Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cryptographic Proof Modal */}
      {selectedAudit && (
        <div className="fixed inset-0 bg-[#050B2E]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#111B57] border border-[#8B92FF]/30 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#8B92FF]/20 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#713BFF]/20 border border-[#713BFF]/40">
                  <Fingerprint className="w-6 h-6 text-[#A855F7]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Cryptographic Proof & Audit Details</h3>
                  <p className="text-xs text-[#B8C5F2]">Verification inspection for {selectedAudit.transactionId}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAudit(null)}
                className="w-8 h-8 rounded-xl bg-[#0B1550] hover:bg-[#16226B] border border-[#8B92FF]/20 flex items-center justify-center text-[#B8C5F2] hover:text-white cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-[#0B1550] rounded-xl border border-[#8B92FF]/20">
                  <span className="text-[#B8C5F2] block text-[10px] uppercase font-mono">Transaction ID</span>
                  <span className="font-mono font-bold text-white text-sm">{selectedAudit.transactionId}</span>
                </div>
                <div className="p-3.5 bg-[#0B1550] rounded-xl border border-[#8B92FF]/20">
                  <span className="text-[#B8C5F2] block text-[10px] uppercase font-mono">Status</span>
                  <div className="mt-1">{getStatusBadge(selectedAudit.verificationStatus)}</div>
                </div>
              </div>

              <div className="p-3.5 bg-[#0B1550] rounded-xl border border-[#8B92FF]/20 space-y-2">
                <span className="text-[#B8C5F2] block text-[10px] uppercase font-mono">Transaction Hash (SHA-256)</span>
                <div className="p-2.5 bg-[#050B2E] rounded-lg border border-[#8B92FF]/20 font-mono text-[#356BFF] break-all select-all">
                  {selectedAudit.transactionHash || 'None recorded'}
                </div>
              </div>

              {selectedAudit.publicKey && (
                <div className="p-3.5 bg-[#0B1550] rounded-xl border border-[#8B92FF]/20 space-y-2">
                  <span className="text-[#B8C5F2] block text-[10px] uppercase font-mono">User Public Key (ECDSA P-256 SPKI)</span>
                  <div className="p-2.5 bg-[#050B2E] rounded-lg border border-[#8B92FF]/20 font-mono text-[#B8C5F2] break-all max-h-24 overflow-y-auto">
                    {selectedAudit.publicKey}
                  </div>
                </div>
              )}

              <div className="p-3.5 bg-[#0B1550] rounded-xl border border-[#8B92FF]/20 space-y-2">
                <span className="text-[#B8C5F2] block text-[10px] uppercase font-mono">Audit Message & Reason</span>
                <p className="text-white font-medium">{selectedAudit.verificationDetails || 'Verified successfully'}</p>
              </div>

              {/* Re-verify Feedback */}
              {reverifyResult && (
                <div className={`p-4 rounded-xl border ${
                  reverifyResult.verified
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                }`}>
                  <div className="flex items-center gap-2 font-bold mb-1">
                    {reverifyResult.verified ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                    <span>{reverifyResult.verified ? 'Signature Cryptographically Valid' : 'Re-Verification Failed'}</span>
                  </div>
                  <p className="text-xs opacity-90">{reverifyResult.message}</p>
                  {reverifyResult.computedHash && (
                    <div className="mt-2 text-[11px] font-mono space-y-0.5">
                      <div>Computed Hash: <span className="text-emerald-300">{reverifyResult.computedHash}</span></div>
                      <div>Stored Hash: <span className="text-slate-300">{reverifyResult.storedHash}</span></div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-[#8B92FF]/20 pt-4">
              <button
                type="button"
                onClick={() => handleReverify(selectedAudit.transactionId)}
                disabled={reverifyLoading}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#356BFF] to-[#713BFF] text-white font-bold text-xs hover:brightness-110 transition flex items-center gap-2 cursor-pointer shadow-lg shadow-[#356BFF]/25 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${reverifyLoading ? 'animate-spin' : ''}`} />
                {reverifyLoading ? 'Validating WebCrypto Engine...' : 'Run Cryptographic Re-Verification'}
              </button>

              <button
                type="button"
                onClick={() => setSelectedAudit(null)}
                className="px-4 py-2.5 rounded-xl bg-[#0B1550] text-[#B8C5F2] hover:text-white border border-[#8B92FF]/20 font-semibold text-xs transition cursor-pointer"
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
