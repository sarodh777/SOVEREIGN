import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, AlertTriangle, X, CheckCircle2, Copy, Check,
  RefreshCw, Lock, Key, FileCheck, ArrowRight, ShieldAlert, Sparkles, Cpu
} from 'lucide-react';
import api from '../api';

export default function SignatureVerificationModal({ isOpen, onClose, transactionId, initialData }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(initialData || null);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState('');

  const verifyTx = async (txId) => {
    if (!txId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/security/signature/verify-tx/${txId}`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify transaction signature');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && transactionId) {
      verifyTx(transactionId);
    } else if (isOpen && initialData) {
      setData(initialData);
    }
  }, [isOpen, transactionId, initialData]);

  if (!isOpen) return null;

  const handleCopy = (text, field) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const isVerified = data?.verified === true || data?.status === 'VERIFIED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050720]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0C1342] border border-[#7C3AED]/40 rounded-2xl shadow-[0_16px_50px_rgba(5,7,32,0.95)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#8B92FF]/20 flex items-center justify-between bg-gradient-to-r from-[#111B57] to-[#10164A]">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-md ${
              isVerified
                ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400'
                : 'bg-rose-500/15 border-rose-500/35 text-rose-400'
            }`}>
              {isVerified ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Digital Signature Cryptographic Inspector
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#4169FF]/20 border border-[#4169FF]/35 text-[#B8C5F2]">
                  ECDSA P-256
                </span>
              </h3>
              <p className="text-xs text-[#B8C5F2]">Client WebCrypto SPKI signature & canonical SHA-256 integrity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#7E8DC4] hover:text-white rounded-xl hover:bg-white/5 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar text-sm">
          {loading ? (
            <div className="py-14 flex flex-col items-center justify-center gap-4">
              {/* Animated Cryptographic Verification Ring */}
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#7C3AED] animate-spin" />
                <div className="absolute inset-2 rounded-full border border-[#4169FF] animate-pulse" />
                <Lock className="w-6 h-6 text-[#A855F7]" />
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-white">Validating ECDSA P-256 Signature...</p>
                <p className="text-[11px] text-[#7E8DC4] mt-0.5">Hashing canonical payload & verifying public key SPKI curve points</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-xl text-rose-300">
              <p className="font-semibold text-xs">Verification Request Error</p>
              <p className="text-xs mt-1 text-rose-400">{error}</p>
            </div>
          ) : (
            <>
              {/* Primary Status Banner */}
              <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                isVerified
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
              }`}>
                {isVerified ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-white">
                      {isVerified ? 'Signature Cryptographically Validated' : 'Verification Failed — Signature Rejected'}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isVerified
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}>
                      {data?.status || (isVerified ? 'VERIFIED' : 'FAILED')}
                    </span>
                  </div>
                  <p className="text-xs mt-1 leading-relaxed opacity-90">
                    {data?.message || (isVerified
                      ? 'The transaction data matches the original signed payload and the ECDSA digital signature is authentic and untampered.'
                      : 'The digital signature could not be verified or the transaction payload was modified.')}
                  </p>
                </div>
              </div>

              {/* Transaction ID & Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#10164A] rounded-xl border border-[#8B92FF]/20">
                  <span className="text-[#7E8DC4] block mb-1 uppercase font-mono text-[10px]">Transaction ID</span>
                  <span className="font-mono font-bold text-white text-xs break-all">
                    {data?.transactionId || transactionId || 'N/A'}
                  </span>
                </div>
                <div className="p-3 bg-[#10164A] rounded-xl border border-[#8B92FF]/20">
                  <span className="text-[#7E8DC4] block mb-1 uppercase font-mono text-[10px]">Cryptographic Suite</span>
                  <span className="font-mono font-semibold text-[#60A5FA] text-xs">
                    {data?.algorithm || 'ECDSA (P-256) + SHA-256'}
                  </span>
                </div>
              </div>

              {/* SHA-256 Hash Comparison */}
              <div className="space-y-3">
                <div className="p-3.5 bg-[#10164A] rounded-xl border border-[#8B92FF]/20 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white font-medium flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#4169FF]" />
                      Original Transaction SHA-256 Hash
                    </span>
                    <button
                      onClick={() => handleCopy(data?.transactionHash || data?.storedHash, 'hash')}
                      className="text-[#A855F7] hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      {copiedField === 'hash' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedField === 'hash' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="font-mono text-xs text-[#B8C5F2] break-all bg-[#050720] p-2.5 rounded-lg border border-[#8B92FF]/20 select-all">
                    {data?.transactionHash || data?.storedHash || 'N/A'}
                  </p>
                </div>

                {data?.computedHash && (
                  <div className="p-3.5 bg-[#10164A] rounded-xl border border-[#8B92FF]/20 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white font-medium flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-[#60A5FA]" />
                        Recomputed Verification Hash
                      </span>
                      {data?.computedHash === (data?.transactionHash || data?.storedHash) ? (
                        <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Exact Match (Untampered)
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Mismatch (Tampered Payload)
                        </span>
                      )}
                    </div>
                    <p className={`font-mono text-xs break-all p-2.5 rounded-lg border select-all ${
                      data?.computedHash === (data?.transactionHash || data?.storedHash)
                        ? 'text-emerald-300 bg-emerald-950/20 border-emerald-500/30'
                        : 'text-rose-300 bg-rose-950/20 border-rose-500/40'
                    }`}>
                      {data?.computedHash}
                    </p>
                  </div>
                )}
              </div>

              {/* Public Key Card */}
              {data?.publicKey && (
                <div className="p-3.5 bg-[#10164A] rounded-xl border border-[#8B92FF]/20 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white font-medium flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      Signer Public Key (X.509 SPKI)
                    </span>
                    <button
                      onClick={() => handleCopy(data?.publicKey, 'pubkey')}
                      className="text-[#A855F7] hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      {copiedField === 'pubkey' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedField === 'pubkey' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="font-mono text-[11px] text-[#B8C5F2] break-all bg-[#050720] p-2.5 rounded-lg border border-[#8B92FF]/20 max-h-20 overflow-y-auto">
                    {data?.publicKey}
                  </p>
                </div>
              )}

              {/* Blockchain Record Match */}
              {data?.blockchainHash && (
                <div className="p-3.5 bg-[#10164A] rounded-xl border border-[#8B92FF]/20 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[#7E8DC4] block text-[11px]">Recorded Blockchain Hash</span>
                    <span className="font-mono text-emerald-400 break-all">{data.blockchainHash}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                    On-Chain Anchored
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#8B92FF]/20 bg-[#10164A] flex items-center justify-between">
          <button
            onClick={() => verifyTx(data?.transactionId || transactionId)}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#080C2E] hover:bg-[#172368] text-xs font-semibold text-[#B8C5F2] hover:text-white border border-[#8B92FF]/20 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#7C3AED]' : ''}`} />
            Re-verify Now
          </button>
          <button
            onClick={onClose}
            className="btn-primary-gradient px-5 py-2 rounded-xl text-xs font-bold text-white transition shadow-md cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
