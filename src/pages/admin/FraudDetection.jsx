import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, AlertTriangle, CheckCircle2, XCircle, Search,
  RefreshCw, Filter, Calendar, Eye, ArrowRight, ShieldCheck,
  TrendingUp, AlertOctagon, User, FileText, Check, X,
  Clock, ArrowUpRight, DollarSign, Cpu, HelpCircle, Sparkles,
  Radio, Activity, Terminal, Shield
} from 'lucide-react';
import axios from 'axios';
import CountUp from '../../components/CountUp';

export default function FraudDetection() {
  const [stats, setStats] = useState({
    totalAlerts: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
    pendingReview: 0,
    approvedCases: 0,
    rejectedCases: 0,
    reviewedCases: 0
  });

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Review Modal State
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [reviewDecision, setReviewDecision] = useState('LEGITIMATE');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  const token = localStorage.getItem('token');

  const fetchStats = React.useCallback(async () => {
    try {
      const res = await axios.get('/api/admin/fraud/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to load fraud stats:', err);
    }
  }, [token]);

  const fetchAlerts = React.useCallback(async () => {
    try {
      setRefreshing(true);
      const params = {};
      if (riskFilter !== 'ALL') params.riskLevel = riskFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await axios.get('/api/admin/fraud/alerts', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (res.data?.success) {
        setAlerts(res.data.alerts || []);
      }
    } catch (err) {
      console.error('Failed to load fraud alerts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [riskFilter, statusFilter, searchQuery, startDate, endDate, token]);

  useEffect(() => {
    fetchStats();
    fetchAlerts();
  }, [fetchStats, fetchAlerts]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAlerts();
  };

  const resetFilters = () => {
    setRiskFilter('ALL');
    setStatusFilter('ALL');
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
  };

  const handleOpenReview = (alert, defaultDecision = 'LEGITIMATE') => {
    setSelectedAlert(alert);
    setReviewDecision(defaultDecision);
    setReviewNotes('');
    setActionMessage(null);
  };

  const handleSubmitReview = async () => {
    if (!selectedAlert) return;
    setSubmittingReview(true);
    setActionMessage(null);

    try {
      const res = await axios.post(`/api/admin/fraud/review/${selectedAlert.id}`, {
        decision: reviewDecision,
        notes: reviewNotes || (reviewDecision === 'LEGITIMATE' ? 'Approved as legitimate transaction' : 'Confirmed fraudulent activity by admin')
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (res.data?.success) {
        setActionMessage({
          type: 'success',
          text: reviewDecision === 'LEGITIMATE'
            ? 'Transaction marked as legitimate. Funds processed and recorded on blockchain.'
            : 'Transaction marked as confirmed fraud and safely cancelled.'
        });

        await fetchStats();
        await fetchAlerts();

        setTimeout(() => {
          setSelectedAlert(null);
          setActionMessage(null);
        }, 1500);
      } else {
        setActionMessage({ type: 'error', text: res.data?.message || 'Action failed' });
      }
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Error processing review action'
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const getRiskBadge = (level, score) => {
    switch (level?.toUpperCase()) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/35">
            <AlertOctagon className="w-3.5 h-3.5 animate-pulse" />
            HIGH ({score ?? 0})
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/35">
            <AlertTriangle className="w-3.5 h-3.5" />
            MEDIUM ({score ?? 0})
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/35">
            <ShieldCheck className="w-3.5 h-3.5" />
            LOW ({score ?? 0})
          </span>
        );
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'HELD':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
            <Clock className="w-3 h-3" /> HELD
          </span>
        );
      case 'PENDING_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <Clock className="w-3 h-3" /> PENDING
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="w-3 h-3" /> LEGITIMATE
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/50 text-rose-300 border border-rose-600/50">
            <XCircle className="w-3 h-3" /> CONFIRMED FRAUD
          </span>
        );
      case 'VERIFIED_BY_USER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#4169FF]/20 text-[#60A5FA] border border-[#4169FF]/40">
            <ShieldCheck className="w-3 h-3" /> 2FA VERIFIED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#111B57] text-[#B8C5F2] border border-[#8B92FF]/20">
            {status || 'CLEARED'}
          </span>
        );
    }
  };

  return (
    <div className="page-root">
      <div className="page-content space-y-7 text-[var(--text-primary)]">
      {/* ── Header with Radar Scanner Visual ─────────────────── */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#10164A]/90 via-[#111B57]/80 to-[#0A0F35]/90 border border-[#8B92FF]/25 p-6 md:p-8 shadow-[0_12px_40px_rgba(5,7,32,0.6)] overflow-hidden">
        {/* Glow & Radar Sweep */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#7C3AED]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full border border-[#7C3AED]/30 opacity-40 pointer-events-none animate-pulse" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5 text-xs font-mono text-[#A855F7] uppercase tracking-wider mb-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EC4899] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#A855F7]" />
              </span>
              AI Behavioral Surveillance & Heuristic Threat Matrix
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Cpu className="w-8 h-8 text-[#7C3AED]" />
              AI Fraud Detection Command Center
            </h1>

            <p className="text-[#B8C5F2] text-xs sm:text-sm mt-1.5 leading-relaxed">
              Autonomous machine assessment monitoring pre-flight transaction requests. Flags velocity spikes, nocturnal spikes, high balance depletions, and abnormal counterparties.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Live Scanner Radar Widget */}
            <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#080C2E]/80 border border-[#8B92FF]/20 shadow-inner">
              <div className="relative w-8 h-8 rounded-full border border-[#4169FF]/50 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 rounded-full border-t-2 border-[#A855F7] animate-spin" />
                <Radio className="w-3.5 h-3.5 text-[#4169FF]" />
              </div>
              <div className="text-left text-xs">
                <div className="font-mono font-bold text-white text-[11px]">RADAR ACTIVE</div>
                <div className="text-[10px] text-emerald-400">0.02ms Heuristic Latency</div>
              </div>
            </div>

            <button
              onClick={() => { fetchStats(); fetchAlerts(); }}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#172368] hover:bg-[#1C2C7E] border border-[#8B92FF]/25 rounded-xl text-xs font-semibold text-white transition-all shadow-md cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#A855F7] ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Telemetry
            </button>
          </div>
        </div>
      </div>

      {/* ── Summary KPI Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Alerts */}
        <div className="glass-card rounded-2xl p-4.5 border border-[#8B92FF]/22 relative overflow-hidden">
          <div className="flex items-center justify-between text-[#B8C5F2] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Evaluated</span>
            <div className="w-8 h-8 rounded-xl bg-[#4169FF]/20 border border-[#4169FF]/35 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[#60A5FA]" />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-mono">
            <CountUp value={stats.totalAlerts} decimals={0} />
          </div>
          <div className="text-[11px] text-[#7E8DC4] mt-1">Live scanned ledger transfers</div>
        </div>

        {/* High Risk */}
        <div className="glass-card rounded-2xl p-4.5 border border-rose-500/35 relative overflow-hidden">
          <div className="flex items-center justify-between text-rose-300 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">High Risk</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/35 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-400 font-mono">
            <CountUp value={stats.highRisk} decimals={0} />
          </div>
          <div className="text-[11px] text-rose-400/80 mt-1">Score ≥ 70 (Held for review)</div>
        </div>

        {/* Medium Risk */}
        <div className="glass-card rounded-2xl p-4.5 border border-amber-500/35 relative overflow-hidden">
          <div className="flex items-center justify-between text-amber-300 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Medium Risk</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/35 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-400 font-mono">
            <CountUp value={stats.mediumRisk} decimals={0} />
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1">Score 40-69 (2FA Step-up)</div>
        </div>

        {/* Pending Review / Held */}
        <div className="glass-card rounded-2xl p-4.5 border border-[#7C3AED]/40 relative overflow-hidden">
          <div className="flex items-center justify-between text-[#B8C5F2] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Action</span>
            <div className="w-8 h-8 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/40 flex items-center justify-center">
              <Clock className="w-4 h-4 text-[#A855F7]" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#A855F7] font-mono">
            <CountUp value={stats.pendingReview} decimals={0} />
          </div>
          <div className="text-[11px] text-[#7E8DC4] mt-1">Transactions actively quarantined</div>
        </div>

        {/* Reviewed Cases */}
        <div className="glass-card rounded-2xl p-4.5 border border-emerald-500/35 relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-300 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Reviewed Cases</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/35 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono">
            <CountUp value={stats.reviewedCases} decimals={0} />
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1">
            {stats.approvedCases} Approved • {stats.rejectedCases} Rejected
          </div>
        </div>
      </div>

      {/* ── Filter and Search Toolbar ─────────────────────────── */}
      <div className="glass-card rounded-2xl p-4 shadow-md">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-[#7E8DC4] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Transaction ID, User, Email, or Triggered Reason..."
              className="w-full bg-[#0A103D] border border-[#8B92FF]/25 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#7E8DC4] focus:outline-none focus:border-[#7C3AED] transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#B8C5F2] whitespace-nowrap">Risk:</span>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="bg-[#0A103D] border border-[#8B92FF]/25 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="HIGH">High Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="LOW">Low Risk</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#B8C5F2] whitespace-nowrap">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#0A103D] border border-[#8B92FF]/25 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
              >
                <option value="ALL">All Statuses</option>
                <option value="HELD">Held (Quarantined)</option>
                <option value="PENDING_REVIEW">Pending Review</option>
                <option value="APPROVED">Legitimate (Approved)</option>
                <option value="REJECTED">Confirmed Fraud (Rejected)</option>
                <option value="VERIFIED_BY_USER">Verified by User</option>
                <option value="CLEARED">Cleared</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-[#0A103D] border border-[#8B92FF]/25 rounded-xl px-2 py-1">
              <Calendar className="w-3.5 h-3.5 text-[#7E8DC4] ml-1" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-xs text-white py-1 px-1 focus:outline-none"
                title="Start Date"
              />
              <span className="text-[#7E8DC4] text-xs">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-xs text-white py-1 px-1 focus:outline-none"
                title="End Date"
              />
            </div>

            <button
              type="submit"
              className="btn-primary-gradient px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-md cursor-pointer"
            >
              Apply Filter
            </button>

            {(riskFilter !== 'ALL' || statusFilter !== 'ALL' || searchQuery || startDate || endDate) && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-3 py-2 bg-[#0A103D] hover:bg-[#10164A] text-[#B8C5F2] hover:text-white rounded-xl text-xs transition border border-[#8B92FF]/25 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ── Fraud Surveillance Stream Table ───────────────────── */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-xl border border-[#8B92FF]/22">
        <div className="p-4 border-b border-[#8B92FF]/20 flex items-center justify-between bg-[#10164A]/80">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#A855F7]" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Surveillance Stream ({alerts.length})
            </h2>
          </div>
          <span className="text-xs text-[#B8C5F2] font-mono hidden sm:inline">
            Deterministic Heuristic Heuristics & Velocity Anomaly Scoring
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center text-[#7E8DC4]">
            <RefreshCw className="w-8 h-8 text-[#7C3AED] animate-spin mx-auto mb-3" />
            <p className="text-sm">Evaluating transaction heuristic matrix...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-16 text-center text-[#B8C5F2]">
            <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-80" />
            <p className="text-sm font-bold text-white">No fraud alerts matching filters</p>
            <p className="text-xs text-[#7E8DC4] mt-1">All processed transactions conform to baseline risk thresholds.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0C1342] text-[#B8C5F2] uppercase tracking-wider font-mono border-b border-[#8B92FF]/20 text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Transaction ID & Timestamp</th>
                  <th className="py-3.5 px-4">Counterparties</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Risk Evaluation</th>
                  <th className="py-3.5 px-4">Triggered Reasons</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#8B92FF]/10 font-normal">
                {alerts.map((alert) => (
                  <tr
                    key={alert.id}
                    className={`hover:bg-[#16226B]/50 transition-colors ${
                      alert.status === 'HELD' ? 'bg-rose-950/20' : ''
                    }`}
                  >
                    {/* Transaction ID & Date */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-white text-[12px]">
                        {alert.transactionId}
                      </div>
                      <div className="text-[11px] text-[#7E8DC4] mt-0.5">
                        {alert.createdAt ? new Date(alert.createdAt).toLocaleString() : 'N/A'}
                      </div>
                      {alert.blockchainHash && (
                        <div className="text-[10px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400" />
                          On-chain: {alert.blockchainHash.substring(0, 14)}...
                        </div>
                      )}
                    </td>

                    {/* Counterparties */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="text-[#7E8DC4] text-[10px] uppercase font-bold">From: </span>
                        <span className="text-white font-medium">{alert.userName}</span>
                        <div className="text-[11px] text-[#B8C5F2] font-mono">{alert.senderAccount}</div>
                      </div>
                      <div className="mt-1">
                        <span className="text-[#7E8DC4] text-[10px] uppercase font-bold">To: </span>
                        <span className="text-white">{alert.receiverName || alert.receiverAccount}</span>
                        <div className="text-[11px] text-[#B8C5F2] font-mono">{alert.receiverAccount}</div>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4">
                      <div className="text-sm font-bold text-white font-mono">
                        ₹{Number(alert.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-[#A855F7] uppercase font-semibold">
                        {alert.transactionType || 'TRANSFER'}
                      </div>
                    </td>

                    {/* Risk Evaluation */}
                    <td className="py-3.5 px-4">
                      <div className="mb-1">{getRiskBadge(alert.riskLevel, alert.riskScore)}</div>
                      <div className="w-24 bg-[#0A103D] rounded-full h-1.5 overflow-hidden border border-[#8B92FF]/20">
                        <div
                          className={`h-full rounded-full ${
                            alert.riskScore >= 70
                              ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                              : alert.riskScore >= 40
                              ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                              : 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                          }`}
                          style={{ width: `${Math.min(alert.riskScore, 100)}%` }}
                        />
                      </div>
                    </td>

                    {/* Reasons */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="space-y-1">
                        {alert.reasons ? (
                          alert.reasons.split(';').map((reason, idx) => (
                            <div key={idx} className="text-[11px] text-white flex items-start gap-1.5 leading-snug">
                              <span className="text-rose-400 shrink-0">•</span>
                              <span>{reason.trim()}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-[#7E8DC4] text-[11px]">Normal parameters</span>
                        )}
                        {alert.adminNotes && (
                          <div className="mt-1.5 p-1.5 rounded-lg bg-[#0A103D] border border-[#8B92FF]/20 text-[10px] text-[#B8C5F2]">
                            <span className="font-semibold text-white">Admin Note: </span>
                            {alert.adminNotes}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <div>{getStatusBadge(alert.status)}</div>
                      {alert.reviewedBy && (
                        <div className="text-[10px] text-[#7E8DC4] mt-1 font-mono">
                          By: {alert.reviewedBy}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {alert.status === 'HELD' || alert.status === 'PENDING_REVIEW' ? (
                          <>
                            <button
                              onClick={() => handleOpenReview(alert, 'LEGITIMATE')}
                              className="px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                              title="Mark Legitimate & Approve Transfer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleOpenReview(alert, 'CONFIRMED_FRAUD')}
                              className="px-2.5 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/35 rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                              title="Confirm Fraud & Cancel Transfer"
                            >
                              <X className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleOpenReview(alert, alert.adminDecision || 'LEGITIMATE')}
                            className="px-2.5 py-1.5 bg-[#0A103D] hover:bg-[#10164A] text-[#B8C5F2] hover:text-white border border-[#8B92FF]/25 rounded-lg text-[11px] font-medium transition flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#4169FF]" />
                            Inspect
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Review & Resolution Modal ─────────────────────────── */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050720]/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0C1342] border border-[#7C3AED]/40 rounded-2xl w-full max-w-xl shadow-[0_16px_50px_rgba(5,7,32,0.9)] overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#8B92FF]/20 flex items-center justify-between bg-[#10164A]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/40">
                  <ShieldAlert className="w-5 h-5 text-[#A855F7]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Fraud Case Investigation</h3>
                  <p className="text-xs text-[#B8C5F2] font-mono mt-0.5">
                    ID: {selectedAlert.transactionId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="p-1 rounded-lg text-[#7E8DC4] hover:text-white hover:bg-white/5 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {actionMessage && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                    actionMessage.type === 'success'
                      ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200'
                      : 'bg-rose-950/60 border border-rose-500/40 text-rose-200'
                  }`}
                >
                  {actionMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{actionMessage.text}</span>
                </div>
              )}

              {/* Transaction & Risk Overview */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#10164A] border border-[#8B92FF]/20 rounded-xl">
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#7E8DC4]">Transaction Amount</div>
                  <div className="text-lg font-bold text-white font-mono mt-0.5">
                    ₹{Number(selectedAlert.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#7E8DC4]">Risk Assessment</div>
                  <div className="mt-1 flex items-center gap-2">
                    {getRiskBadge(selectedAlert.riskLevel, selectedAlert.riskScore)}
                  </div>
                </div>
                <div className="col-span-2 pt-2 border-t border-[#8B92FF]/15">
                  <div className="text-[10px] uppercase font-bold text-[#7E8DC4]">Sender & Account</div>
                  <div className="text-xs text-white font-medium">
                    {selectedAlert.userName} ({selectedAlert.userEmail})
                  </div>
                  <div className="text-[11px] text-[#B8C5F2] font-mono">
                    Account: {selectedAlert.senderAccount}
                  </div>
                </div>
              </div>

              {/* Suspicious Reasons */}
              <div>
                <label className="text-xs font-bold text-white uppercase tracking-wider block mb-2">
                  Suspicious Indicators & Detection Triggers
                </label>
                <div className="p-3 bg-rose-950/25 border border-rose-900/40 rounded-xl space-y-1.5">
                  {selectedAlert.reasons ? (
                    selectedAlert.reasons.split(';').map((reason, i) => (
                      <div key={i} className="text-xs text-rose-200 flex items-start gap-2">
                        <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <span>{reason.trim()}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-[#7E8DC4]">No triggers recorded</span>
                  )}
                </div>
              </div>

              {/* Triggered Rule Codes */}
              {selectedAlert.rulesTriggered && (
                <div>
                  <label className="text-[10px] font-bold text-[#7E8DC4] uppercase tracking-wider block mb-1">
                    Internal Surveillance Rules Fired
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAlert.rulesTriggered.split(',').map((rule, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-[#050720] text-[#B8C5F2] font-mono text-[10px] rounded-md border border-[#8B92FF]/20"
                      >
                        {rule.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Decision Selector */}
              {selectedAlert.status === 'HELD' || selectedAlert.status === 'PENDING_REVIEW' ? (
                <div className="pt-2 border-t border-[#8B92FF]/20 space-y-3">
                  <label className="text-xs font-bold text-white uppercase tracking-wider block">
                    Administrative Review Decision
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setReviewDecision('LEGITIMATE')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        reviewDecision === 'LEGITIMATE'
                          ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                          : 'bg-[#10164A] border-[#8B92FF]/20 text-[#B8C5F2] hover:border-[#8B92FF]/40'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs text-emerald-400 mb-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Mark as Legitimate
                      </div>
                      <p className="text-[11px] text-[#B8C5F2]/80">
                        Release quarantine, execute ledger transaction, and record in immutable blockchain audit trail.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReviewDecision('CONFIRMED_FRAUD')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        reviewDecision === 'CONFIRMED_FRAUD'
                          ? 'bg-rose-950/40 border-rose-500 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
                          : 'bg-[#10164A] border-[#8B92FF]/20 text-[#B8C5F2] hover:border-[#8B92FF]/40'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs text-rose-400 mb-1">
                        <XCircle className="w-4 h-4" />
                        Confirm Fraud
                      </div>
                      <p className="text-[11px] text-[#B8C5F2]/80">
                        Permanently abort transaction, revert funds safely to sender, and flag incident in compliance ledger.
                      </p>
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-white block mb-1">
                      Surveillance Notes & Rationale
                    </label>
                    <textarea
                      rows={3}
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Add investigation comments or compliance verification notes..."
                      className="w-full bg-[#050720] border border-[#8B92FF]/25 rounded-xl p-2.5 text-xs text-white placeholder-[#7E8DC4] focus:outline-none focus:border-[#7C3AED]"
                    />
                  </div>
                </div>
              ) : (
                <div className="pt-2 border-t border-[#8B92FF]/20 space-y-2">
                  <div className="text-xs font-bold text-white">Previous Review Record</div>
                  <div className="p-3 bg-[#10164A] border border-[#8B92FF]/20 rounded-xl space-y-1 text-xs">
                    <div>
                      <span className="text-[#7E8DC4]">Decision: </span>
                      <span className="font-bold text-white">{selectedAlert.adminDecision || selectedAlert.status}</span>
                    </div>
                    <div>
                      <span className="text-[#7E8DC4]">Reviewed By: </span>
                      <span className="text-white">{selectedAlert.reviewedBy || 'System Automated'}</span>
                    </div>
                    <div>
                      <span className="text-[#7E8DC4]">Review Date: </span>
                      <span className="text-white">
                        {selectedAlert.reviewedAt ? new Date(selectedAlert.reviewedAt).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                    {selectedAlert.adminNotes && (
                      <div className="mt-1 pt-1 border-t border-[#8B92FF]/15 text-[#B8C5F2]">
                        <span className="text-white font-semibold">Notes: </span>
                        {selectedAlert.adminNotes}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#8B92FF]/20 bg-[#10164A] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedAlert(null)}
                className="px-4 py-2 bg-[#080C2E] hover:bg-[#172368] text-[#B8C5F2] hover:text-white rounded-xl text-xs font-medium transition cursor-pointer"
              >
                Close
              </button>

              {(selectedAlert.status === 'HELD' || selectedAlert.status === 'PENDING_REVIEW') && (
                <button
                  type="button"
                  disabled={submittingReview}
                  onClick={handleSubmitReview}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer ${
                    reviewDecision === 'LEGITIMATE'
                      ? 'btn-primary-gradient'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                  }`}
                >
                  {submittingReview ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Executing Action...
                    </>
                  ) : reviewDecision === 'LEGITIMATE' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Confirm & Release Transaction
                    </>
                  ) : (
                    <>
                      <X className="w-3.5 h-3.5" />
                      Confirm Fraud & Cancel
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
