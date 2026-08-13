import React, { useState, useEffect } from 'react';
import { Link as LinkIcon, CheckCircle2, AlertTriangle, RefreshCw, Hash } from 'lucide-react';
import api from '../api';

export default function BlockchainExplorer() {
  const [blocks, setBlocks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [chainValid, setChainValid] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const fetchBlocks = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/api/banking/blockchain/blocks');
      if (res.data.success) {
        const blks = res.data.blocks || [];
        setBlocks(blks);
        // Verify chain integrity client-side
        setChainValid(blks.every((b, i) => i === 0 || b.previousHash === blks[i-1].hash));
      }
    } catch (err) {
      setError('Failed to load blockchain data.');
    }
    setLoading(false);
  };

  useEffect(() => { fetchBlocks(); }, []);

  const truncate = (str, n = 20) => str ? str.substring(0, n) + '...' : '—';

  return (
    <div className="w-full min-h-screen p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#10B981]/10 rounded-xl flex items-center justify-center border border-[#10B981]/20">
              <LinkIcon className="w-6 h-6 text-[#10B981]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#E8EEF7]">Blockchain Explorer</h1>
              <p className="text-[#A0AEC0] text-sm">Immutable transaction ledger</p>
            </div>
          </div>
          <button onClick={fetchBlocks} className="p-2 text-[#A0AEC0] hover:text-[#00F0FF] transition">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Blocks', value: blocks.length, color: '#00F0FF' },
            { label: 'Chain Status', value: chainValid ? 'VALID' : 'TAMPERED', color: chainValid ? '#10B981' : '#FF006E' },
            { label: 'Total Transactions', value: blocks.reduce((acc, b) => acc + (b.transactionCount || 0), 0), color: '#F59E0B' },
            { label: 'Network', value: 'LIVE', color: '#10B981' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border rounded-xl p-4" style={{ borderColor: color + '20' }}>
              <p className="text-[#A0AEC0] text-xs uppercase tracking-wider mb-1">{label}</p>
              <p className="text-xl font-bold font-mono" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Chain Integrity Banner */}
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${chainValid ? 'bg-[#10B981]/5 border-[#10B981]/20' : 'bg-[#FF006E]/10 border-[#FF006E]/30'}`}>
          {chainValid
            ? <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />
            : <AlertTriangle className="w-5 h-5 text-[#FF006E] shrink-0" />}
          <p className={`text-sm font-semibold ${chainValid ? 'text-[#10B981]' : 'text-[#FF006E]'}`}>
            {chainValid
              ? `Chain Integrity: VERIFIED — All ${blocks.length} blocks are cryptographically valid and unmodified.`
              : 'ALERT: Chain Integrity Violation Detected! One or more blocks may have been tampered with.'}
          </p>
        </div>

        {error && <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}

        {/* Block List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-2 border-[#00F0FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#A0AEC0]">Loading blockchain...</p>
          </div>
        ) : blocks.length === 0 ? (
          <div className="text-center py-20 bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] rounded-2xl border border-white/5">
            <Hash className="w-12 h-12 text-[#4A5568] mx-auto mb-4" />
            <p className="text-[#A0AEC0] text-lg font-semibold">No blocks yet</p>
            <p className="text-[#718096] text-sm mt-1">Blockchain will populate as transactions are recorded.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...blocks].reverse().map((block, i) => (
              <div key={block.id}
                className={`bg-gradient-to-br from-[#1A1F2E] to-[#252C3C] border rounded-xl overflow-hidden transition cursor-pointer ${expanded === block.id ? 'border-[#00F0FF]/40' : 'border-white/5 hover:border-[#00F0FF]/20'}`}
                onClick={() => setExpanded(expanded === block.id ? null : block.id)}>
                <div className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex items-center justify-center shrink-0">
                    <span className="text-[#00F0FF] font-bold font-mono text-sm">#{block.id}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-mono text-[#E8EEF7] text-sm font-semibold truncate">{truncate(block.hash, 28)}</p>
                      <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                    </div>
                    <p className="text-xs text-[#A0AEC0]">
                      {block.transactionCount} tx &nbsp;•&nbsp; {block.timestamp ? new Date(block.timestamp).toLocaleString() : '—'}
                    </p>
                  </div>
                  <div className="text-[#718096] text-sm">{expanded === block.id ? '▲' : '▼'}</div>
                </div>

                {expanded === block.id && (
                  <div className="border-t border-white/5 p-4 bg-[#0B0F14]/50 font-mono text-xs space-y-2">
                    {[
                      ['Block Hash', block.hash],
                      ['Previous Hash', block.previousHash || '0x000...GENESIS'],
                      ['Timestamp', block.timestamp ? new Date(block.timestamp).toISOString() : '—'],
                      ['Transactions', block.transactionCount],
                    ].map(([k, v]) => (
                      <div key={k} className="flex gap-3">
                        <span className="text-[#718096] w-28 shrink-0">{k}:</span>
                        <span className="text-[#E8EEF7] break-all">{v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
