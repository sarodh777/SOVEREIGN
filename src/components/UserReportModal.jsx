import React, { useState } from 'react';
import {
  FileText, Download, Calendar, Filter, X, CheckCircle2,
  Clock, Shield, AlertCircle, Loader2, Sparkles
} from 'lucide-react';
import { generateUserTransactionReport, formatINR } from '../utils/pdfGenerator';
import api from '../api';

export default function UserReportModal({
  isOpen,
  onClose,
  allTransactions = [],
  accountInfo = {},
  userInfo = {},
}) {
  const [dateRange, setDateRange] = useState('ALL');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [generating, setGenerating] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [snapshotTime] = useState(() => Date.now());

  if (!isOpen) return null;

  // Filter transactions according to selected criteria
  const getFilteredTransactions = (isComplete = false) => {
    if (isComplete) return allTransactions;

    const now = snapshotTime;
    return allTransactions.filter((tx) => {
      // Type filter
      if (typeFilter !== 'ALL' && tx.type !== typeFilter) return false;

      // Status filter
      if (statusFilter !== 'ALL' && tx.status !== statusFilter) return false;

      // Date filter
      const txTime = new Date(tx.date).getTime();
      if (isNaN(txTime)) return true;

      if (dateRange === '7D') {
        return txTime >= now - 7 * 864e5;
      } else if (dateRange === '30D') {
        return txTime >= now - 30 * 864e5;
      } else if (dateRange === '90D') {
        return txTime >= now - 90 * 864e5;
      } else if (dateRange === 'CUSTOM') {
        if (customStart) {
          const s = new Date(customStart + 'T00:00:00').getTime();
          if (txTime < s) return false;
        }
        if (customEnd) {
          const e = new Date(customEnd + 'T23:59:59').getTime();
          if (txTime > e) return false;
        }
      }
      return true;
    });
  };

  const getRangeLabel = (isComplete = false) => {
    if (isComplete || dateRange === 'ALL') return 'All Time';
    if (dateRange === '7D') return 'Last 7 Days';
    if (dateRange === '30D') return 'Last 30 Days';
    if (dateRange === '90D') return 'Last 90 Days';
    if (dateRange === 'CUSTOM') {
      return `${customStart || 'Start'} to ${customEnd || 'Now'}`;
    }
    return 'Custom';
  };

  const handleDownload = async (isComplete = false) => {
    setGenerating(true);
    setFeedback(null);
    try {
      let finalUser = { ...userInfo };
      let finalAccount = { ...accountInfo };

      if (!finalUser.name) {
        try {
          const profileRes = await api.get('/api/auth/profile');
          if (profileRes.data.success && profileRes.data.user) {
            finalUser = { ...finalUser, ...profileRes.data.user };
          }
        } catch {}
      }

      if (!finalAccount.accountNumber) {
        try {
          const accRes = await api.get('/api/banking/accounts');
          if (accRes.data.success && accRes.data.accounts?.length) {
            finalAccount = { ...finalAccount, ...accRes.data.accounts[0] };
          }
        } catch {}
      }

      const txList = getFilteredTransactions(isComplete);

      await generateUserTransactionReport({
        user: finalUser,
        account: finalAccount,
        transactions: txList,
        dateRangeLabel: getRangeLabel(isComplete),
        typeFilter: isComplete ? 'ALL' : typeFilter,
      });

      setFeedback({
        type: 'success',
        message: `Report generated successfully (${txList.length} records exported).`,
      });

      setTimeout(() => {
        setGenerating(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('PDF generation error:', err);
      setFeedback({
        type: 'error',
        message: 'Failed to generate PDF statement. Please try again.',
      });
      setGenerating(false);
    }
  };

  const currentFiltered = getFilteredTransactions(false);
  const totalCredits = currentFiltered
    .filter((t) => t.direction === 'IN' || t.type === 'DEPOSIT')
    .reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalDebits = currentFiltered
    .filter((t) => t.direction === 'OUT' || t.type === 'WITHDRAWAL')
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050B2E]/80 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-lg bg-[#0B1550] border border-[#8B92FF]/30 rounded-2xl shadow-[0_16px_50px_rgba(5,11,46,0.9)] overflow-hidden flex flex-col text-[#F8FAFC] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#8B92FF]/20 bg-gradient-to-r from-[#111B57] to-[#0B1550]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#356BFF]/20 to-[#713BFF]/20 border border-[#8B92FF]/30 flex items-center justify-center text-[#356BFF]">
              <FileText className="w-5 h-5 text-[#356BFF]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#F8FAFC] flex items-center gap-2">
                Download PDF Statement
              </h2>
              <p className="text-xs text-[#B8C5F2]">
                Export official branded PDF account report
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={generating}
            className="p-2 rounded-lg text-[#B8C5F2] hover:text-white hover:bg-white/5 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Account Summary Banner */}
          <div className="p-3.5 bg-[#111B57]/80 border border-[#8B92FF]/20 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
            <div>
              <span className="text-[#B8C5F2]">Account:</span>{' '}
              <span className="font-mono text-[#F8FAFC] font-semibold">
                {accountInfo.accountNumber || 'Primary Account'}
              </span>
            </div>
            <div>
              <span className="text-[#B8C5F2]">Balance:</span>{' '}
              <span className="text-emerald-400 font-bold">
                {formatINR(accountInfo.balance || userInfo.balance || 0)}
              </span>
            </div>
          </div>

          {/* Date Range Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#B8C5F2] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#356BFF]" /> Date Range
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'ALL', label: 'All Time' },
                { id: '7D', label: 'Last 7 Days' },
                { id: '30D', label: 'Last 30 Days' },
                { id: 'CUSTOM', label: 'Custom' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDateRange(opt.id)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border transition cursor-pointer ${
                    dateRange === opt.id
                      ? 'bg-gradient-to-r from-[#356BFF] to-[#713BFF] border-transparent text-white font-semibold shadow-[0_0_15px_rgba(113,59,255,0.3)]'
                      : 'bg-[#050B2E] border-[#8B92FF]/20 text-[#B8C5F2] hover:border-[#8B92FF]/40'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Custom Date Inputs */}
            {dateRange === 'CUSTOM' && (
              <div className="grid grid-cols-2 gap-2 pt-2 animate-fadeIn">
                <div>
                  <label className="text-[11px] text-[#B8C5F2]/70 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full bg-[#050B2E] border border-[#8B92FF]/25 rounded-lg px-2.5 py-1.5 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#713BFF]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#B8C5F2]/70 block mb-1">End Date</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full bg-[#050B2E] border border-[#8B92FF]/25 rounded-lg px-2.5 py-1.5 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#713BFF]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Transaction Type Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#B8C5F2] flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#713BFF]" /> Transaction Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['ALL', 'TRANSFER', 'DEPOSIT', 'WITHDRAWAL'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border text-center transition cursor-pointer ${
                    typeFilter === t
                      ? 'bg-gradient-to-r from-[#356BFF] to-[#713BFF] border-transparent text-white font-semibold shadow-[0_0_15px_rgba(113,59,255,0.3)]'
                      : 'bg-[#050B2E] border-[#8B92FF]/20 text-[#B8C5F2] hover:border-[#8B92FF]/40'
                  }`}
                >
                  {t === 'ALL' ? 'All' : t.charAt(0) + t.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#B8C5F2]">
              Transaction Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'ALL', label: 'All Statuses' },
                { id: 'COMPLETED', label: 'Completed' },
                { id: 'FAILED', label: 'Failed' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStatusFilter(s.id)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border text-center transition cursor-pointer ${
                    statusFilter === s.id
                      ? 'bg-gradient-to-r from-[#356BFF] to-[#713BFF] border-transparent text-white font-semibold shadow-[0_0_15px_rgba(113,59,255,0.3)]'
                      : 'bg-[#050B2E] border-[#8B92FF]/20 text-[#B8C5F2] hover:border-[#8B92FF]/40'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scope Preview Card */}
          <div className="p-3 bg-[#111B57]/80 border border-[#8B92FF]/20 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#B8C5F2]">Matching Records:</span>
              <span className="font-bold text-[#F8FAFC] text-sm">
                {currentFiltered.length}{' '}
                <span className="text-xs text-[#B8C5F2]/70 font-normal">
                  of {allTransactions.length} total
                </span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#8B92FF]/15">
              <div>
                <span className="text-[#B8C5F2]/70 block text-[10px]">TOTAL CREDITS</span>
                <span className="text-emerald-400 font-medium">
                  {formatINR(totalCredits)}
                </span>
              </div>
              <div>
                <span className="text-[#B8C5F2]/70 block text-[10px]">TOTAL DEBITS</span>
                <span className="text-rose-400 font-medium">
                  {formatINR(totalDebits)}
                </span>
              </div>
            </div>
          </div>

          {/* Feedback message */}
          {feedback && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}
        </div>

        {/* Modal Footer / Actions */}
        <div className="p-4 border-t border-[#8B92FF]/20 bg-[#0B1550] flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleDownload(false)}
            disabled={generating}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#356BFF] to-[#713BFF] text-white font-bold text-xs hover:opacity-95 active:scale-[0.99] transition shadow-[0_0_20px_rgba(113,59,255,0.3)] disabled:opacity-50 cursor-pointer"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download Filtered Report (PDF)
          </button>

          <button
            type="button"
            onClick={() => handleDownload(true)}
            disabled={generating}
            className="w-full sm:w-auto flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl bg-[#111B57] border border-[#8B92FF]/30 hover:border-[#713BFF] text-xs font-semibold text-[#B8C5F2] hover:text-white transition disabled:opacity-50 cursor-pointer"
            title="Download complete unfiltered history"
          >
            All History (PDF)
          </button>
        </div>
      </div>
    </div>
  );
}
