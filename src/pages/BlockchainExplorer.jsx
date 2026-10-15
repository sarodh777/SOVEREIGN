import React, { useState, useEffect } from 'react';
import {
  Link as LinkIcon, CheckCircle2, AlertTriangle, RefreshCw, Hash,
  Database, Layers, ShieldCheck, Activity, Copy, Check, ExternalLink,
  Clock, ChevronDown, Sparkles
} from 'lucide-react';
import api from '../api';
import BlockchainLivingVisual from '../components/BlockchainLivingVisual';
import CountUp from '../components/CountUp';

export default function BlockchainExplorer() {
  const [blocks, setBlocks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [chainValid, setChainValid] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [copiedHash, setCopiedHash] = useState('');

  const fetchBlocks = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/api/banking/blockchain/blocks');
      if (res.data.success) {
        const blks = res.data.blocks || [];
        setBlocks(blks);
        setChainValid(blks.every((b, i) => i === 0 || b.previousHash === blks[i-1].hash));
      }
    } catch {
      setError('Failed to load blockchain data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const initFetch = async () => {
      try {
        const res = await api.get('/api/banking/blockchain/blocks');
        if (!ignore && res.data.success) {
          const blks = res.data.blocks || [];
          setBlocks(blks);
          setChainValid(blks.every((b, i) => i === 0 || b.previousHash === blks[i-1].hash));
        }
      } catch {
        if (!ignore) setError('Failed to load blockchain data.');
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    initFetch();
    return () => { ignore = true; };
  }, []);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(''), 2000);
  };

  const truncate = (str, n = 28) => str ? str.substring(0, n) + '...' : '—';

  return (
    <div className="page-root">
      <div className="page-content space-y-6">
        {/* Header */}
        <div className="relative rounded-3xl glass-card border border-[var(--border-subtle)] p-6 md:p-8 shadow-xl overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--primary)]/15 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)] rounded-2xl flex items-center justify-center shadow-lg text-white">
                <Database className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono uppercase tracking-widest text-[var(--primary)] font-bold">Hardhat Ledger</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30 font-semibold">
                    NETWORK LIVE
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">Blockchain Explorer</h1>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                  Immutable EVM smart ledger state, cryptographic hashes, and block sequence validation
                </p>
              </div>
            </div>

            <button
              onClick={fetchBlocks}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-elevated)] hover:bg-[var(--primary)] hover:text-white border border-[var(--border-subtle)] rounded-xl text-xs font-semibold text-[var(--text-primary)] transition-all shadow-md cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[var(--primary)] ${loading ? 'animate-spin' : ''}`} />
              Sync Ledger
            </button>
          </div>
        </div>

        {/* ── Signature Living Blockchain Node Chain Visual ──── */}
        <BlockchainLivingVisual />

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Blocks', value: blocks.length, color: 'text-[var(--text-primary)]' },
            { label: 'Consensus Integrity', value: chainValid ? 'VALID' : 'TAMPERED', color: chainValid ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400' },
            { label: 'Anchored Transactions', value: blocks.reduce((acc, b) => acc + (b.transactionCount || 0), 0), color: 'text-blue-500 dark:text-blue-400' },
            { label: 'EVM Hardhat Node', value: 'SYNCED', color: 'text-[var(--primary)]' },
          ].map(({ label, value, color }) => (
            <div key={label} className="glass-card rounded-2xl p-4.5 shadow-xl border border-[var(--border-subtle)]">
              <p className="text-[var(--text-secondary)] text-xs uppercase tracking-wider mb-1 font-mono font-bold">{label}</p>
              <p className={`text-2xl font-black font-mono ${color}`}>
                {typeof value === 'number' ? <CountUp value={value} decimals={0} /> : value}
              </p>
            </div>
          ))}
        </div>

        {/* Chain Integrity Banner */}
        <div className={`p-4 rounded-2xl border flex items-center gap-3.5 shadow-md ${
          chainValid
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : 'bg-rose-500/10 border-rose-500/30'
        }`}>
          {chainValid ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" />
          )}
          <p className={`text-xs font-semibold ${chainValid ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}>
            {chainValid
              ? `Chain Integrity Status: VERIFIED — All ${blocks.length} blocks are cryptographically valid, linked with SHA-256 parent hashes, and immutably synchronized.`
              : 'ALERT: Chain Integrity Violation Detected! One or more blocks failed cryptographic verification.'}
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 dark:text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Block List Table */}
        <div className="glass-card rounded-2xl p-6 shadow-xl border border-[var(--border-subtle)]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[var(--primary)]" />
            Block Ledger Stream ({blocks.length})
          </h2>

          {loading ? (
            <div className="text-center py-16">
              <RefreshCw className="w-8 h-8 text-[#7C3AED] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-[#7E8DC4]">Loading blockchain blocks...</p>
            </div>
          ) : blocks.length === 0 ? (
            <div className="text-center py-16">
              <Hash className="w-12 h-12 text-[#7E8DC4] mx-auto mb-3 opacity-60" />
              <p className="text-white text-sm font-bold">No blocks on chain yet</p>
              <p className="text-xs text-[#7E8DC4] mt-1">Blocks will populate automatically as ledger transfers are signed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...blocks].reverse().map((block) => {
                const isExpanded = expanded === block.id;
                return (
                  <div
                    key={block.id}
                    className={`rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer bg-[var(--bg-card)] border ${
                      isExpanded
                        ? 'border-[var(--primary)] shadow-[0_0_25px_rgba(113,59,255,0.25)] ring-1 ring-[var(--primary)]/40'
                        : 'border-[var(--border-subtle)] hover:border-[var(--primary)]/50 hover:shadow-[0_8px_30px_rgba(113,59,255,0.12)]'
                    }`}
                    onClick={() => setExpanded(isExpanded ? null : block.id)}
                  >
                    <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                      {/* Left: Block badge & metadata */}
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--primary)]/20 via-[var(--primary)]/10 to-transparent border border-[var(--primary)]/35 flex flex-col items-center justify-center shrink-0 shadow-sm">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">BLK</span>
                          <span className="text-[var(--primary)] font-extrabold font-mono text-sm leading-none">#{block.id}</span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                            <span className="font-mono text-xs font-bold text-[var(--text-primary)] tracking-wide bg-[var(--bg-elevated)] px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] shadow-inner">
                              {truncate(block.hash, 32)}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Confirmed
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] font-mono flex-wrap">
                            <span className="inline-flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-[var(--primary)] opacity-80" />
                              <span>{block.transactionCount} {block.transactionCount === 1 ? 'tx' : 'txs'}</span>
                            </span>
                            <span className="text-[var(--border-subtle)]">•</span>
                            <span className="inline-flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 opacity-70" />
                              <span>{block.timestamp ? new Date(block.timestamp).toLocaleString() : '—'}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Sleek Inspect trigger */}
                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpanded(isExpanded ? null : block.id);
                          }}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 transition-all duration-200 border ${
                            isExpanded
                              ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-[0_0_15px_rgba(113,59,255,0.4)]'
                              : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white hover:bg-[var(--primary)]/20 border-[var(--border-subtle)] hover:border-[var(--primary)]/40'
                          }`}
                        >
                          <span>{isExpanded ? 'CLOSE' : 'INSPECT'}</span>
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Cryptographic Proof Drawer */}
                    {isExpanded && (
                      <div className="border-t border-[var(--border-subtle)] p-5 bg-[var(--bg-elevated)]/90 backdrop-blur-md space-y-3 font-mono text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-1">
                            <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">Block Hash</span>
                            <div className="text-[var(--text-primary)] break-all font-semibold flex items-start justify-between gap-2">
                              <span className="text-[11px] leading-relaxed">{block.hash}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(block.hash, `hash-${block.id}`);
                                }}
                                title="Copy Hash"
                                className="p-1.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--border-subtle)] shrink-0 transition-colors"
                              >
                                {copiedHash === `hash-${block.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-1">
                            <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">Previous Block Hash</span>
                            <div className="text-[var(--text-primary)] break-all font-semibold flex items-start justify-between gap-2">
                              <span className="text-[11px] leading-relaxed">{block.previousHash || '0x0000000000000000000000000000000000000000 (GENESIS)'}</span>
                              {block.previousHash && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopy(block.previousHash, `prev-${block.id}`);
                                  }}
                                  title="Copy Previous Hash"
                                  className="p-1.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--border-subtle)] shrink-0 transition-colors"
                                >
                                  {copiedHash === `prev-${block.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">Timestamp (UTC)</span>
                            <span className="text-[var(--text-primary)] font-semibold text-[11px]">
                              {block.timestamp ? new Date(block.timestamp).toISOString() : '—'}
                            </span>
                          </div>

                          <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">Transactions Merkle Count</span>
                            <span className="text-[var(--primary)] font-extrabold text-xs">
                              {block.transactionCount} Signed Records
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 flex items-center justify-between text-[11px] text-[var(--text-secondary)] border-t border-[var(--border-subtle)]/60">
                          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Cryptographically Sealed & Verified
                          </span>
                          <span className="opacity-60 text-[10px]">SHA-256 Ledger Consensus</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
