import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, ShieldAlert, Eye, Lock, CheckCircle2,
  RefreshCw, Search, ArrowRight, UserX, AlertCircle, X, Sparkles
} from 'lucide-react';
import api from '../../api';
import { useNavigate } from 'react-router-dom';

export default function SuspiciousActivity() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionUser, setActionUser] = useState(null);
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/suspicious-activity');
      setAlerts(res.data.alerts || []);
    } catch (err) {
      console.error('Failed to load suspicious telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleBlockUser = async (e) => {
    e.preventDefault();
    if (!actionReason.trim()) {
      alert('A reason is mandatory for blocking an account.');
      return;
    }
    try {
      setActionLoading(true);
      await api.post(`/api/admin/users/${actionUser.userId}/status`, {
        action: 'BLOCK',
        reason: actionReason
      });
      setActionUser(null);
      setActionReason('');
      fetchAlerts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to block user');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    const q = search.toLowerCase();
    return (
      !search ||
      (a.userEmail && a.userEmail.toLowerCase().includes(q)) ||
      (a.description && a.description.toLowerCase().includes(q)) ||
      (a.type && a.type.toLowerCase().includes(q))
    );
  });

  return (
    <div className="page-root">
      <div className="page-content space-y-6 text-[var(--text-primary)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#8B92FF]/20 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#EC4899]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#EC4899]">Fraud & Risk Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] mt-1">Suspicious Activity</h1>
          <p className="text-sm text-[#B8C5F2]">Algorithmic anomaly flags, excessive authentication failures & high-value transfers</p>
        </div>
        <button
          onClick={fetchAlerts}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111B57] hover:bg-[#111B57]/80 text-xs font-semibold text-[#B8C5F2] hover:text-white border border-[#8B92FF]/25 self-start sm:self-auto cursor-pointer transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#713BFF]' : ''}`} />
          Refresh Anomaly Feed
        </button>
      </div>

      {/* Filter */}
      <div className="p-4 bg-[#111B57]/80 backdrop-blur-md border border-[#8B92FF]/22 rounded-2xl flex items-center justify-between gap-4 shadow-[0_8px_32px_rgba(5,11,46,0.5)]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8B92FF]/50 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search anomalies by User, Anomaly Type, or Risk Flag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0B1550] border border-[#8B92FF]/25 rounded-xl text-xs text-[#F8FAFC] placeholder-[#8B92FF]/40 focus:outline-none focus:border-[#713BFF]"
          />
        </div>
        <span className="text-xs font-mono text-[#EC4899] bg-[#EC4899]/10 px-3 py-2 rounded-xl border border-[#EC4899]/25 whitespace-nowrap font-bold">
          {filteredAlerts.length} Active Anomaly Alerts
        </span>
      </div>

      {/* Anomaly Alerts Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-[#B8C5F2]/60 bg-[#111B57]/80 rounded-2xl border border-[#8B92FF]/22">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#713BFF] mb-2" />
            Analyzing telemetry anomalies...
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="p-12 text-center text-[#B8C5F2] bg-[#111B57]/80 rounded-2xl border border-[#8B92FF]/22">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-90" />
            No suspicious activities or active risk anomalies detected. System secure.
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL' || alert.severity === 'HIGH';
            return (
              <div
                key={alert.id}
                className={`p-5 rounded-2xl bg-[#111B57]/80 backdrop-blur-md border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-[#111B57] shadow-[0_8px_32px_rgba(5,11,46,0.5)] ${
                  isCritical ? 'border-[#EC4899]/40 shadow-[0_0_20px_rgba(236,72,153,0.15)]' : 'border-[#8B92FF]/22'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                        isCritical
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {alert.severity} SEVERITY
                    </span>
                    <span className="text-xs font-bold text-[#F8FAFC] tracking-wide">{alert.type}</span>
                  </div>

                  <p className="text-xs text-[#F8FAFC]">{alert.description}</p>

                  <div className="flex items-center gap-4 text-[11px] text-[#B8C5F2]/70 font-mono">
                    {alert.userEmail && <span>Target: {alert.userEmail}</span>}
                    <span>Timestamp: {alert.timestamp ? new Date(alert.timestamp).toLocaleString() : 'Recent'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                  {alert.userId && (
                    <>
                      <button
                        onClick={() => navigate(`/admin/users/${alert.userId}`)}
                        className="px-3 py-1.5 rounded-xl bg-[#0B1550] hover:bg-[#111B57] text-[#356BFF] hover:text-[#713BFF] text-xs font-bold border border-[#8B92FF]/25 flex items-center gap-1 transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> Investigate
                      </button>

                      <button
                        onClick={() => {
                          setActionUser(alert);
                          setActionReason(`Triggered by suspicious alert: ${alert.type}`);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-xs font-bold border border-rose-500/30 flex items-center gap-1 transition cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5" /> Block Account
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Block Dialog */}
      {actionUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050B2E]/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-[#0B1550] border border-[#8B92FF]/30 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-[0_16px_50px_rgba(5,11,46,0.9)]">
            <div className="flex items-center justify-between border-b border-[#8B92FF]/20 pb-3">
              <div className="flex items-center gap-2 text-white font-bold">
                <AlertCircle className="w-5 h-5 text-rose-400" />
                Enforce Account Block
              </div>
              <button onClick={() => setActionUser(null)} className="text-[#B8C5F2] hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#B8C5F2]">
              Target: <span className="text-white font-mono font-bold">{actionUser.userEmail}</span>
            </p>

            <form onSubmit={handleBlockUser} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#F8FAFC] mb-1">
                  Investigation & Blocking Note (Mandatory)
                </label>
                <textarea
                  rows="3"
                  required
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="w-full p-2.5 bg-[#050B2E] border border-[#8B92FF]/25 rounded-xl text-xs text-[#F8FAFC] placeholder-[#8B92FF]/40 focus:outline-none focus:border-[#713BFF]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActionUser(null)}
                  className="px-4 py-2 rounded-xl bg-[#111B57] hover:bg-[#111B57]/80 text-xs font-semibold text-[#B8C5F2] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] cursor-pointer"
                >
                  {actionLoading ? 'Enforcing...' : 'Enforce Immediate Block'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
