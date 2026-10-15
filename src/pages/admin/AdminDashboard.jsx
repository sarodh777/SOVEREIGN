import React, { useState, useEffect } from 'react';
import {
  Users, UserCheck, Clock, ShieldAlert, AlertTriangle, Activity,
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, ArrowRight, Shield,
  RefreshCw, CheckCircle2, XCircle, FileText, Database, FileDown, Cpu, Fingerprint, Sparkles, Layers
} from 'lucide-react';
import api from '../../api';
import { useNavigate } from 'react-router-dom';
import AdminReportModal from '../../components/AdminReportModal';
import CountUp from '../../components/CountUp';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showPdfModal, setShowPdfModal] = useState(false);

  const fetchStats = async () => {
    setError('');
    try {
      const res = await api.get('/api/admin/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
      setError(err.response?.status === 403 ? 'Access denied. Please ensure your account has ROLE_ADMIN or ROLE_SUPER_ADMIN.' : 'Failed to load dashboard data. Is the backend running?');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <RefreshCw className="w-8 h-8 text-[#7C3AED] animate-spin" />
        <p className="text-sm text-[#B8C5F2]">Loading Supervisory System Telemetry...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 px-4">
        <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
          <ShieldAlert className="w-7 h-7 text-rose-400" />
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-lg font-bold text-white mb-2">Supervisory Console Unavailable</h2>
          <p className="text-sm text-[#B8C5F2] mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#10164A] hover:bg-[#172368] text-[#4169FF] border border-[#8B92FF]/30 text-sm font-semibold mx-auto transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: '#4169FF', desc: 'Registered accounts' },
    { label: 'Active Users', value: stats?.activeUsers || 0, icon: UserCheck, color: '#7C3AED', desc: 'Operational accounts' },
    { label: 'Verified Users', value: stats?.verifiedUsers || 0, icon: CheckCircle2, color: '#10B981', desc: 'Email & 2FA verified' },
    { label: 'Pending KYC', value: stats?.pendingKyc || 0, icon: Clock, color: '#EC4899', desc: 'Awaiting supervisory review', alert: (stats?.pendingKyc || 0) > 0 },
    { label: 'Blocked Accounts', value: stats?.blockedUsers || 0, icon: XCircle, color: '#EF4444', desc: 'Restricted from banking' },
    { label: 'Suspended Accounts', value: stats?.lockedUsers || 0, icon: ShieldAlert, color: '#F59E0B', desc: 'Locked out accounts' },
    { label: 'Suspicious Accounts', value: stats?.suspiciousAccounts || 0, icon: AlertTriangle, color: '#EF4444', desc: 'Triggered risk heuristics', alert: (stats?.suspiciousAccounts || 0) > 0 },
    { label: 'Total Transactions', value: stats?.totalTransactions || 0, icon: Activity, color: '#4169FF', desc: 'Platform throughput' },
    { label: 'Failed Transactions', value: stats?.failedTransactions || 0, icon: AlertTriangle, color: '#EF4444', desc: 'Terminated operations' },
  ];

  const dailyCounts = stats?.dailyTxCounts || {};
  const maxTxCount = Math.max(...Object.values(dailyCounts), 1);

  return (
    <div className="page-root">
      <div className="page-content space-y-6 text-[var(--text-primary)]">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#10164A]/90 via-[#111B57]/80 to-[#0A0F35]/90 border border-[#8B92FF]/25 p-6 md:p-8 shadow-[0_12px_40px_rgba(5,7,32,0.6)] overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#7C3AED]/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#7C3AED] animate-pulse shrink-0" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#A855F7]">Supervisory Console 3.0</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight truncate">Admin Command Center</h1>
            <p className="text-sm text-[#B8C5F2] mt-0.5">Comprehensive surveillance, real-time banking telemetry & verification monitoring</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap shrink-0">
            <button
              onClick={() => setShowPdfModal(true)}
              className="btn-primary-gradient flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg cursor-pointer"
            >
              <FileDown className="w-4 h-4 shrink-0" />
              <span>Download PDF Audit</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn-secondary-gradient flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition shadow-sm cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${refreshing ? 'animate-spin text-[#7C3AED]' : ''}`} />
              <span>Refresh Telemetry</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`glass-card rounded-2xl p-5 flex flex-col justify-between min-h-[125px] relative overflow-hidden ${
                card.alert ? 'border-[#EC4899]/50 shadow-[0_0_20px_rgba(236,72,153,0.2)]' : 'border-[#8B92FF]/22'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#B8C5F2] uppercase tracking-wider truncate font-mono">{card.label}</p>
                  <h3 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight truncate font-mono">
                    <CountUp value={card.value} decimals={0} />
                  </h3>
                  <p className="text-[11px] text-[#7E8DC4] mt-1 line-clamp-1">{card.desc}</p>
                </div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0"
                  style={{
                    backgroundColor: `${card.color}20`,
                    borderColor: `${card.color}40`,
                    color: card.color
                  }}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div
                className="absolute bottom-0 left-0 right-0 h-[2px]"
                style={{ backgroundColor: card.color, opacity: 0.8 }}
              />
            </div>
          );
        })}
      </div>

      {/* ── Charts & Analytical Cards ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction Activity Chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 sm:p-6 space-y-4 flex flex-col justify-between min-w-0 shadow-xl border border-[#8B92FF]/22">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#8B92FF]/15">
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white flex items-center gap-2 truncate">
                <Activity className="w-4 h-4 text-[#4169FF] shrink-0" />
                Transaction Activity (Past 7 Days)
              </h3>
              <p className="text-xs text-[#B8C5F2] mt-0.5 truncate">Daily transaction volume processed through ledger</p>
            </div>
            <div className="sm:text-right shrink-0">
              <span className="inline-block text-xs font-bold text-[#60A5FA] bg-[#4169FF]/15 border border-[#4169FF]/30 px-2.5 py-1 rounded-full font-mono">
                ₹{Number(stats?.txVolume || 0).toLocaleString()} Total Volume
              </span>
            </div>
          </div>

          {/* Bar Chart representation */}
          <div className="w-full overflow-x-auto pb-2">
            <div className="h-52 min-w-[280px] flex items-end gap-2 sm:gap-3 pt-6 pb-2 px-2 border-b border-[#8B92FF]/15">
              {Object.entries(dailyCounts).length > 0 ? (
                Object.entries(dailyCounts).map(([date, count]) => {
                  const heightPct = Math.max(Math.round((count / maxTxCount) * 100), 8);
                  return (
                    <div key={date} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end min-w-[32px]">
                      <div className="text-[10px] text-[#A855F7] opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                        {count}
                      </div>
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-[#4169FF]/20 via-[#7C3AED] to-[#EC4899] transition-all group-hover:brightness-125 shadow-[0_0_12px_rgba(124,58,237,0.4)]"
                      />
                      <div className="text-[10px] text-[#7E8DC4] whitespace-nowrap font-mono mt-1">
                        {date.slice(5)}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-[#7E8DC4]">
                  No transaction activity recorded for the past 7 days
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-xs text-[#B8C5F2]">
            <span className="font-medium">System Total Balance: <strong className="text-white font-mono">₹{Number(stats?.totalBalance || 0).toLocaleString()}</strong></span>
            <button
              onClick={() => navigate('/admin/transactions')}
              className="text-[#4169FF] hover:text-[#7C3AED] hover:underline flex items-center gap-1 font-semibold self-start sm:self-auto cursor-pointer transition"
            >
              Inspect all transactions <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Recent Login Surveillance */}
        <div className="glass-card rounded-2xl p-5 sm:p-6 space-y-4 flex flex-col justify-between min-w-0 shadow-xl border border-[#8B92FF]/22">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#8B92FF]/15">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#7C3AED] shrink-0" />
                Auth Audit Stream
              </h3>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#A855F7] bg-[#7C3AED]/15 px-2 py-0.5 rounded-lg border border-[#7C3AED]/30">Live Stream</span>
            </div>

            <div className="divide-y divide-[#8B92FF]/10 mt-3 space-y-2">
              {stats?.recentLogins && stats.recentLogins.length > 0 ? (
                stats.recentLogins.slice(0, 5).map((log, i) => (
                  <div key={i} className="pt-2 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-semibold text-white truncate">{log.email}</p>
                      <p className="text-[10px] text-[#7E8DC4] font-mono truncate">{log.ipAddress || '127.0.0.1'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.status === 'SUCCESS' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}>
                        {log.status}
                      </span>
                      <p className="text-[9px] text-[#7E8DC4] mt-0.5 font-mono">{log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-[#7E8DC4] text-xs">
                  No recent login activity recorded
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#8B92FF]/15 text-xs">
            <button
              onClick={() => navigate('/admin/security')}
              className="text-[#A855F7] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              Open Security Monitoring Hub <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showPdfModal && (
        <AdminReportModal
          isOpen={showPdfModal}
          onClose={() => setShowPdfModal(false)}
        />
      )}
      </div>
    </div>
  );
}
