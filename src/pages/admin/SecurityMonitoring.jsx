import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, AlertTriangle, ShieldCheck, Lock, Unlock,
  Search, RefreshCw, Activity, AlertOctagon, Terminal
} from 'lucide-react';
import api from '../../api';

export default function SecurityMonitoring() {
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSuspicious, setFilterSuspicious] = useState(false);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/security/events');
      setEvents(res.data.events || []);
      setSummary(res.data.summary || null);
    } catch (err) {
      console.error('Failed to load security telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const filteredEvents = events.filter((e) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      (e.userEmail && e.userEmail.toLowerCase().includes(q)) ||
      (e.action && e.action.toLowerCase().includes(q)) ||
      (e.ipAddress && e.ipAddress.includes(q)) ||
      (e.details && e.details.toLowerCase().includes(q));

    const matchesSuspicious = !filterSuspicious || e.isSuspicious;

    return matchesSearch && matchesSuspicious;
  });

  return (
    <div className="page-root">
      <div className="page-content space-y-6 text-[var(--text-primary)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#8B92FF]/20 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#356BFF]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#A855F7]">Threat Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] mt-1">Security Monitoring</h1>
          <p className="text-sm text-[#B8C5F2]">Audit authentication attempts, failed OTP challenges, lockout events & suspicious access logs</p>
        </div>
        <button
          onClick={fetchSecurityData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111B57] hover:bg-[#111B57]/80 text-xs font-semibold text-[#B8C5F2] hover:text-white border border-[#8B92FF]/25 self-start sm:self-auto cursor-pointer transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#713BFF]' : ''}`} />
          Refresh Threat Feed
        </button>
      </div>

      {/* Threat Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#111B57]/80 backdrop-blur-md border border-[#8B92FF]/22 shadow-[0_8px_32px_rgba(5,11,46,0.5)]">
          <span className="text-xs font-semibold text-[#B8C5F2] uppercase">Successful Logins</span>
          <p className="text-2xl font-black text-[#356BFF] mt-1">{summary?.successfulLogins || 0}</p>
          <p className="text-[11px] text-[#B8C5F2]/70 mt-0.5">Authenticated sessions</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#111B57]/80 backdrop-blur-md border border-rose-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
          <span className="text-xs font-semibold text-[#B8C5F2] uppercase">Failed Login Attempts</span>
          <p className="text-2xl font-black text-rose-400 mt-1">{summary?.failedLogins || 0}</p>
          <p className="text-[11px] text-[#B8C5F2]/70 mt-0.5">Bad passwords / brute attempts</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#111B57]/80 backdrop-blur-md border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
          <span className="text-xs font-semibold text-[#B8C5F2] uppercase">OTP Verification Failures</span>
          <p className="text-2xl font-black text-amber-400 mt-1">{summary?.otpFailures || 0}</p>
          <p className="text-[11px] text-[#B8C5F2]/70 mt-0.5">Incorrect or expired OTP codes</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#111B57]/80 backdrop-blur-md border border-[#713BFF]/30 shadow-[0_0_15px_rgba(113,59,255,0.15)]">
          <span className="text-xs font-semibold text-[#B8C5F2] uppercase">Account Lockouts</span>
          <p className="text-2xl font-black text-[#A855F7] mt-1">{summary?.lockouts || 0}</p>
          <p className="text-[11px] text-[#B8C5F2]/70 mt-0.5">Automatic threshold freezes</p>
        </div>
      </div>

      {/* Filter and Switch */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-[#111B57]/80 backdrop-blur-md border border-[#8B92FF]/22 rounded-2xl shadow-[0_8px_32px_rgba(5,11,46,0.5)]">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#8B92FF]/50 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search security events by user email, IP address, or action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-[#0B1550] border border-[#8B92FF]/25 rounded-xl text-xs text-[#F8FAFC] placeholder-[#8B92FF]/40 focus:outline-none focus:border-[#713BFF]"
          />
        </div>

        <button
          onClick={() => setFilterSuspicious(!filterSuspicious)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
            filterSuspicious
              ? 'bg-gradient-to-r from-[#356BFF] to-[#713BFF] text-white border-transparent shadow-[0_0_15px_rgba(113,59,255,0.3)]'
              : 'bg-[#0B1550] text-[#B8C5F2] border-[#8B92FF]/25 hover:text-white'
          }`}
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          {filterSuspicious ? 'Showing Anomalies Only' : 'Filter High-Risk Only'}
        </button>
      </div>

      {/* Threat Event Feed Table */}
      <div className="bg-[#111B57]/80 backdrop-blur-md border border-[#8B92FF]/22 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(5,11,46,0.5)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B1550] text-[#B8C5F2] uppercase text-[10px] tracking-wider border-b border-[#8B92FF]/20">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Event ID</th>
                <th className="py-3.5 px-4 font-semibold">Action Type</th>
                <th className="py-3.5 px-4 font-semibold">User Identity</th>
                <th className="py-3.5 px-4 font-semibold">Outcome Status</th>
                <th className="py-3.5 px-4 font-semibold">Client IP Address</th>
                <th className="py-3.5 px-4 font-semibold">Security Details & Diagnostics</th>
                <th className="py-3.5 px-4 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#8B92FF]/10 text-[#B8C5F2]">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-[#B8C5F2]/60">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#713BFF] mb-2" />
                    Scanning event telemetry...
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-[#B8C5F2]/60">
                    No security events captured matching criteria.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt) => (
                  <tr key={evt.id} className={`hover:bg-[#356BFF]/5 transition-colors ${evt.isSuspicious ? 'bg-[#EC4899]/5' : ''}`}>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#B8C5F2]/50">
                      #{evt.id}
                    </td>

                    <td className="py-3.5 px-4 font-bold">
                      <span className="text-[#F8FAFC] flex items-center gap-1.5">
                        {evt.isSuspicious && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                        {evt.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[#F8FAFC]">
                      {evt.userEmail || 'System'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          evt.status === 'SUCCESS'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                        }`}
                      >
                        {evt.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[#356BFF] text-[11px]">
                      {evt.ipAddress || '127.0.0.1'}
                    </td>

                    <td className="py-3.5 px-4 text-[#B8C5F2] max-w-xs truncate">
                      {evt.details || evt.failureReason || 'Normal execution parameters'}
                    </td>

                    <td className="py-3.5 px-4 text-right text-[#B8C5F2]/70 font-mono text-[11px]">
                      {evt.timestamp ? new Date(evt.timestamp).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}
