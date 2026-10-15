import React, { useState, useEffect } from 'react';
import {
  ClipboardList, Search, Filter, Shield, Calendar,
  RefreshCw, Terminal, CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';
import api from '../../api';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/audit-logs');
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      (log.userEmail && log.userEmail.toLowerCase().includes(q)) ||
      (log.action && log.action.toLowerCase().includes(q)) ||
      (log.details && log.details.toLowerCase().includes(q)) ||
      (log.ipAddress && log.ipAddress.includes(q));

    const matchesAction =
      actionFilter === 'ALL' ||
      log.action.toUpperCase().includes(actionFilter.toUpperCase());

    return matchesSearch && matchesAction;
  });

  return (
    <div className="page-root">
      <div className="page-content space-y-6 text-[var(--text-primary)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#8B92FF]/20 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-[#356BFF]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#A855F7]">Legal & Regulatory Compliance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] mt-1">Admin Audit Logs</h1>
          <p className="text-sm text-[#B8C5F2]">Immutable audit logs tracking every administrative action, account block, KYC verdict & system change</p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111B57] hover:bg-[#111B57]/80 text-xs font-semibold text-[#B8C5F2] hover:text-white border border-[#8B92FF]/25 self-start sm:self-auto cursor-pointer transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#713BFF]' : ''}`} />
          Refresh Logs
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#111B57]/80 backdrop-blur-md border border-[#8B92FF]/22 rounded-2xl shadow-[0_8px_32px_rgba(5,11,46,0.5)]">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-[#8B92FF]/50 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by Admin, Action, Target User, or IP Address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0B1550] border border-[#8B92FF]/25 rounded-xl text-xs text-[#F8FAFC] placeholder-[#8B92FF]/40 focus:outline-none focus:border-[#713BFF]"
          />
        </div>

        <div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full px-3 py-2 bg-[#0B1550] border border-[#8B92FF]/25 rounded-xl text-xs text-[#F8FAFC] focus:outline-none focus:border-[#713BFF]"
          >
            <option value="ALL">All Recorded Actions</option>
            <option value="ACCOUNT">Account Status (Block / Unblock)</option>
            <option value="KYC">KYC Actions (Approve / Reject)</option>
            <option value="LOGIN">Logins & Authentications</option>
            <option value="ADMIN">Administrative Role Changes</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#111B57]/80 backdrop-blur-md border border-[#8B92FF]/22 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(5,11,46,0.5)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B1550] text-[#B8C5F2] uppercase text-[10px] tracking-wider border-b border-[#8B92FF]/20">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Audit ID</th>
                <th className="py-3.5 px-4 font-semibold">Action Performed</th>
                <th className="py-3.5 px-4 font-semibold">Actor / Admin</th>
                <th className="py-3.5 px-4 font-semibold">Outcome</th>
                <th className="py-3.5 px-4 font-semibold">Source IP</th>
                <th className="py-3.5 px-4 font-semibold">Reason & Audit Details</th>
                <th className="py-3.5 px-4 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#8B92FF]/10 text-[#B8C5F2]">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-[#B8C5F2]/60">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#713BFF] mb-2" />
                    Fetching regulatory audit trail...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-[#B8C5F2]/60">
                    No audit records matching filter parameters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#356BFF]/5 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#B8C5F2]/50">
                      #{log.id}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-[#F8FAFC]">
                      <span className="px-2 py-0.5 rounded-lg bg-[#0B1550] border border-[#8B92FF]/25 text-[11px]">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[#F8FAFC]">
                      {log.userEmail || 'System Core'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[#356BFF] text-[11px]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>

                    <td className="py-3.5 px-4 text-[#B8C5F2] max-w-sm truncate" title={log.details || log.failureReason}>
                      {log.details || log.failureReason || 'Standard administrative event'}
                    </td>

                    <td className="py-3.5 px-4 text-right text-[#B8C5F2]/70 font-mono text-[11px]">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
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
