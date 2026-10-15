import React, { useState, useEffect } from 'react';
import {
  FileText, Download, Calendar, Filter, Users, X, CheckCircle2,
  AlertCircle, Loader2, ShieldCheck, Search, Sparkles
} from 'lucide-react';
import { generateAdminTransactionReport } from '../utils/pdfGenerator';
import api from '../api';

export default function AdminReportModal({
  isOpen,
  onClose,
  preloadedTransactions = [],
}) {
  const [usersList, setUsersList] = useState([]);
  const [_loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState('ALL');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  const [generating, setGenerating] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [previewCount, setPreviewCount] = useState(null);
  const [fetchingCount, setFetchingCount] = useState(false);

  // Fetch users list when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const res = await api.get('/api/admin/users');
        if (res.data.success && res.data.users) {
          setUsersList(res.data.users);
        }
      } catch (err) {
        console.warn('Could not load users for report filter', err);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [isOpen]);

  // Compute or fetch preview count
  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;
    const checkCount = async () => {
      setFetchingCount(true);
      try {
        const params = {};
        if (selectedUserId !== 'ALL') params.userId = selectedUserId;
        if (statusFilter !== 'ALL') params.status = statusFilter;
        if (dateRange === 'CUSTOM') {
          if (customStart) params.startDate = customStart;
          if (customEnd) params.endDate = customEnd;
        } else if (dateRange === '7D') {
          const d = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
          params.startDate = d;
        } else if (dateRange === '30D') {
          const d = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
          params.startDate = d;
        } else if (dateRange === 'TODAY') {
          const d = new Date().toISOString().slice(0, 10);
          params.startDate = d;
        }

        const res = await api.get('/api/admin/transactions', { params });
        if (!isCancelled && res.data.transactions) {
          let list = res.data.transactions;
          if (typeFilter !== 'ALL') {
            list = list.filter((t) => t.type === typeFilter);
          }
          setPreviewCount(list.length);
        }
      } catch {
        if (!isCancelled && preloadedTransactions?.length) {
          setPreviewCount(preloadedTransactions.length);
        }
      } finally {
        if (!isCancelled) setFetchingCount(false);
      }
    };

    const timer = setTimeout(checkCount, 300);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen, selectedUserId, statusFilter, dateRange, customStart, customEnd, typeFilter, preloadedTransactions]);

  if (!isOpen) return null;

  const getRangeLabel = (isComplete = false) => {
    if (isComplete || dateRange === 'ALL') return 'All Time';
    if (dateRange === 'TODAY') return 'Today';
    if (dateRange === '7D') return 'Last 7 Days';
    if (dateRange === '30D') return 'Last 30 Days';
    if (dateRange === 'CUSTOM') {
      return `${customStart || 'Start'} to ${customEnd || 'Now'}`;
    }
    return 'Custom';
  };

  const handleDownload = async (isComplete = false) => {
    setGenerating(true);
    setFeedback(null);
    try {
      const params = {};
      if (!isComplete) {
        if (selectedUserId !== 'ALL') params.userId = selectedUserId;
        if (statusFilter !== 'ALL') params.status = statusFilter;
        if (dateRange === 'CUSTOM') {
          if (customStart) params.startDate = customStart;
          if (customEnd) params.endDate = customEnd;
        } else if (dateRange === '7D') {
          params.startDate = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
        } else if (dateRange === '30D') {
          params.startDate = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
        } else if (dateRange === 'TODAY') {
          params.startDate = new Date().toISOString().slice(0, 10);
        }
      }

      const res = await api.get('/api/admin/transactions', { params });
      let transactionsToExport = res.data.transactions || [];

      if (!isComplete && typeFilter !== 'ALL') {
        transactionsToExport = transactionsToExport.filter((t) => t.type === typeFilter);
      }

      let targetUserName = 'All Users (Platform-Wide)';
      if (!isComplete && selectedUserId !== 'ALL') {
        const found = usersList.find((u) => String(u.id) === String(selectedUserId));
        if (found) {
          targetUserName = `${found.name || 'User'} (${found.email}) [ID #${found.id}]`;
        } else {
          targetUserName = `User ID #${selectedUserId}`;
        }
      }

      const adminEmail = localStorage.getItem('userEmail') || 'System Administrator';

      await generateAdminTransactionReport({
        adminUser: { email: adminEmail, name: 'VaultChain Super Admin' },
        transactions: transactionsToExport,
        filterInfo: {
          userId: isComplete ? 'ALL' : selectedUserId,
          userName: targetUserName,
          status: isComplete ? 'ALL' : statusFilter,
          dateRangeLabel: getRangeLabel(isComplete),
          type: isComplete ? 'ALL' : typeFilter,
        },
      });

      setFeedback({
        type: 'success',
        message: `Admin PDF report generated (${transactionsToExport.length} transactions included).`,
      });

      setTimeout(() => {
        setGenerating(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to generate admin transaction PDF:', err);
      setFeedback({
        type: 'error',
        message: 'PDF generation failed. Please verify system logs and try again.',
      });
      setGenerating(false);
    }
  };

  const filteredUsers = usersList.filter((u) => {
    if (!userSearchQuery) return true;
    const q = userSearchQuery.toLowerCase();
    return (
      String(u.id).includes(q) ||
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.accountNumber && u.accountNumber.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050B2E]/80 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-xl bg-[#0B1550] border border-[#8B92FF]/30 rounded-2xl shadow-[0_16px_50px_rgba(5,11,46,0.9)] overflow-hidden flex flex-col text-[#F8FAFC] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#8B92FF]/20 bg-gradient-to-r from-[#111B57] via-[#0B1550] to-[#111B57]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#356BFF]/20 to-[#713BFF]/20 border border-[#8B92FF]/30 flex items-center justify-center text-[#356BFF]">
              <ShieldCheck className="w-5 h-5 text-[#356BFF]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#A855F7]">
                  Administrative Tool
                </span>
              </div>
              <h2 className="text-lg font-bold text-[#F8FAFC]">
                Download PDF Transaction Report
              </h2>
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
          {/* Target User Filter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#B8C5F2] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#356BFF]" /> Filter By User
              </label>
              {selectedUserId !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setSelectedUserId('ALL')}
                  className="text-[11px] text-[#356BFF] hover:underline cursor-pointer"
                >
                  Reset to All Users
                </button>
              )}
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8B92FF]/50 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search user by name, email, or ID..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full bg-[#050B2E] border border-[#8B92FF]/25 rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#F8FAFC] placeholder-[#8B92FF]/40 focus:outline-none focus:border-[#713BFF]"
                />
              </div>

              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full bg-[#050B2E] border border-[#8B92FF]/25 rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#713BFF]"
              >
                <option value="ALL">All Users (Complete Platform Ledger)</option>
                {filteredUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    User #{u.id} — {u.name || 'User'} ({u.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#B8C5F2] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#713BFF]" /> Date Range
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'ALL', label: 'All Time' },
                { id: 'TODAY', label: 'Today' },
                { id: '7D', label: 'Last 7D' },
                { id: '30D', label: 'Last 30D' },
                { id: 'CUSTOM', label: 'Custom' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDateRange(opt.id)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition cursor-pointer ${
                    dateRange === opt.id
                      ? 'bg-gradient-to-r from-[#356BFF] to-[#713BFF] border-transparent text-white font-semibold shadow-[0_0_15px_rgba(113,59,255,0.3)]'
                      : 'bg-[#050B2E] border-[#8B92FF]/20 text-[#B8C5F2] hover:border-[#8B92FF]/40'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {dateRange === 'CUSTOM' && (
              <div className="grid grid-cols-2 gap-2 pt-1 animate-fadeIn">
                <div>
                  <label className="text-[11px] text-[#B8C5F2]/70 block mb-1">From Date</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full bg-[#050B2E] border border-[#8B92FF]/25 rounded-lg px-2.5 py-1.5 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#713BFF]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#B8C5F2]/70 block mb-1">To Date</label>
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

          {/* Status & Type Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#B8C5F2]">
                Transaction Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-[#050B2E] border border-[#8B92FF]/25 rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#713BFF]"
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed Only</option>
                <option value="PENDING">Pending Only</option>
                <option value="FAILED">Failed Only</option>
              </select>
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#B8C5F2]">
                Transaction Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full bg-[#050B2E] border border-[#8B92FF]/25 rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#713BFF]"
              >
                <option value="ALL">All Types</option>
                <option value="TRANSFER">Transfers</option>
                <option value="DEPOSIT">Deposits</option>
                <option value="WITHDRAWAL">Withdrawals</option>
                <option value="SMART_TRANSFER">Smart Transfers</option>
              </select>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="p-3.5 bg-[#111B57]/80 border border-[#8B92FF]/20 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="text-[#B8C5F2] block text-[11px]">PROJECTED RECORDS</span>
              <span className="text-[#F8FAFC] font-bold text-sm flex items-center gap-1.5">
                {fetchingCount ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#713BFF]" />
                ) : (
                  previewCount !== null ? previewCount : '—'
                )}
                <span className="text-xs text-[#B8C5F2]/70 font-normal">transactions ready</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-[#B8C5F2] block text-[11px]">OUTPUT FORMAT</span>
              <span className="text-[#356BFF] font-semibold">Landscape A4 PDF</span>
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

        {/* Footer Actions */}
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
            title="Download complete ledger containing all users"
          >
            Complete Report (PDF)
          </button>
        </div>
      </div>
    </div>
  );
}
