import React, { useState, useEffect } from 'react';
import {
  Key, ShieldCheck, AlertTriangle, CheckCircle2, Lock,
  Copy, Check, RefreshCw, Cpu, FileCheck, ArrowRight, ShieldAlert,
  Flame, ExternalLink, Sparkles
} from 'lucide-react';
import api from '../api';
import { getOrCreateKeypair } from '../utils/cryptoSigner';
import SignatureVerificationModal from './SignatureVerificationModal';
import CountUp from './CountUp';

export default function DigitalSignatureSection() {
  const [signatures, setSignatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keypair, setKeypair] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [selectedTxId, setSelectedTxId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);

  // Tamper test simulation state
  const [simulatingTamper, setSimulatingTamper] = useState(false);
  const [tamperResult, setTamperResult] = useState(null);

  const email = localStorage.getItem('userEmail') || 'user@vaultchain.bank';

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      // Ensure client keypair is generated
      const kp = await getOrCreateKeypair(email);
      setKeypair(kp);

      // Fetch digitally signed transactions
      const res = await api.get('/api/security/signature/my-signatures');
      if (res.data?.success) {
        setSignatures(res.data.signatures || []);
      }
    } catch (err) {
      console.warn('Failed to load signature data:', err);
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const copyPublicKey = () => {
    if (keypair?.publicKeyHex) {
      navigator.clipboard.writeText(keypair.publicKeyHex);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleOpenVerifyModal = (txId) => {
    setSelectedTxId(txId);
    setModalData(null);
    setModalOpen(true);
  };

  // Tamper simulation test
  const handleSimulateTamper = async () => {
    setSimulatingTamper(true);
    try {
      const res = await api.post('/api/security/signature/test-tamper', {
        transactionId: `TXN-DEMO-${Date.now().toString().slice(-4)}`,
        fromAccount: '1001-XXXX-001',
        toAccount: '1002-XXXX-002',
        originalAmount: '1500.00',
        tamperedAmount: '95000.00'
      });
      setTamperResult(res.data);
    } catch (err) {
      console.error('Tamper simulation error:', err);
    } finally {
      setSimulatingTamper(false);
    }
  };

  const verifiedCount = signatures.filter(s => s.signatureVerified).length;
  const failedCount = signatures.filter(s => !s.signatureVerified).length;

  return (
    <div className="glass-card rounded-2xl p-6 shadow-xl border border-[var(--border-subtle)] space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent-purple)]/25 border border-[var(--primary)]/30 flex items-center justify-center text-[var(--primary)] shadow-md shrink-0">
            <Key className="w-6 h-6 text-[var(--primary)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--primary)]">Cryptographic Assurance</span>
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">ECDSA P-256 Digital Signature Registry</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Non-custodial on-device transaction signing & SHA-256 payload integrity</p>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--primary)] hover:text-white border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-secondary)] transition self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[var(--primary)]' : ''}`} />
          Refresh Registry
        </button>
      </div>

      {/* Keypair Status Bar */}
      <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--text-primary)]">Client WebCrypto Keypair Active</span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 rounded-full">
                ECDSA P-256 SPKI
              </span>
            </div>
            <p className="text-[11px] font-mono text-[var(--text-secondary)] truncate mt-0.5 max-w-md">
              Public Key: {keypair?.publicKeyHex || 'Generating isolated key...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={copyPublicKey}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--primary)]/15 border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] transition cursor-pointer"
          >
            {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[var(--primary)]" />}
            <span>{copiedKey ? 'Key Copied' : 'Copy Public Key'}</span>
          </button>
        </div>
      </div>

      {/* Quick Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
          <span className="text-[11px] text-[var(--text-secondary)] uppercase font-semibold tracking-wider">Signed Transactions</span>
          <p className="text-2xl font-black text-[var(--text-primary)] mt-1 font-mono">
            <CountUp value={signatures.length} decimals={0} />
          </p>
        </div>
        <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-emerald-500/25">
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 uppercase font-semibold tracking-wider">Verified Signatures</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            <CountUp value={verifiedCount} decimals={0} />
          </p>
        </div>
        <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-rose-500/25">
          <span className="text-[11px] text-rose-600 dark:text-rose-400 uppercase font-semibold tracking-wider">Verification Failed</span>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 font-mono">
            <CountUp value={failedCount} decimals={0} />
          </p>
        </div>
      </div>

      {/* Digitally Signed Transactions Table */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-[var(--primary)]" />
          Cryptographically Signed Logs
        </h3>

        <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
          <table className="w-full text-left min-w-[700px] text-xs">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)] uppercase font-mono tracking-wider bg-[var(--bg-elevated)] text-[11px]">
                <th className="px-4 py-3">Transaction ID</th>
                <th className="px-4 py-3">SHA-256 Hash</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Signature Status</th>
                <th className="px-4 py-3">Tx Status</th>
                <th className="px-4 py-3 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-secondary)]">
              {signatures.length > 0 ? (
                signatures.slice(0, 8).map((sig, idx) => (
                  <tr key={idx} className="hover:bg-[var(--bg-elevated)]/60 transition">
                    <td className="px-4 py-3.5 font-mono font-bold text-[var(--text-primary)]">
                      {sig.transactionId}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-[var(--text-secondary)] max-w-[180px] truncate">
                      {sig.transactionHash || 'N/A'}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-semibold text-[var(--text-primary)]">
                      ₹{Number(sig.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">
                      {sig.signatureVerified ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                        {sig.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleOpenVerifyModal(sig.transactionId)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--primary)] hover:text-white border border-[var(--border-subtle)] hover:border-[var(--primary)] text-[var(--text-primary)] text-xs font-semibold transition cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-[var(--primary)]" />
                        Inspect Signature
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-[var(--text-secondary)]">
                    No digitally signed transactions recorded yet. Transfers made through "Send Funds" will be automatically signed.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cryptographic Tamper Test Lab */}
      <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              Cryptographic Attack & Tamper Simulation Lab
            </h4>
            <p className="text-xs text-[var(--text-secondary)]">
              Simulate an interception attack where an unauthorized MITM entity tampers with transaction amount parameters.
            </p>
          </div>
          <button
            onClick={handleSimulateTamper}
            disabled={simulatingTamper}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-300 border border-amber-500/35 text-xs font-semibold transition shrink-0 cursor-pointer"
          >
            <ShieldAlert className={`w-3.5 h-3.5 ${simulatingTamper ? 'animate-spin' : ''}`} />
            Simulate Tamper Attack
          </button>
        </div>

        {tamperResult && (
          <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-rose-600 dark:text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Tamper Attack Blocked by Cryptographic Engine
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30">
                STATUS: {tamperResult.status}
              </span>
            </div>
            <p className="text-[var(--text-primary)] text-[11px] leading-relaxed">
              <strong>Failure Explanation:</strong> {tamperResult.reason}
            </p>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-[var(--text-secondary)] pt-1 border-t border-rose-500/20">
              <div>Signed Original Amount: <span className="text-emerald-500 dark:text-emerald-400 font-bold">₹{tamperResult.originalAmount}</span></div>
              <div>Tampered Intercepted Amount: <span className="text-rose-500 dark:text-rose-400 font-bold">₹{tamperResult.tamperedAmount}</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Signature Verification Modal */}
      <SignatureVerificationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        transactionId={selectedTxId}
        initialData={modalData}
      />
    </div>
  );
}
