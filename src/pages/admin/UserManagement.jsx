import React, { useState, useEffect } from 'react';
import {
  Users, Search, Filter, ShieldCheck, ShieldAlert, AlertTriangle,
  Lock, Unlock, Eye, X, Check, ArrowUpDown, RefreshCw, AlertCircle
} from 'lucide-react';
import api from '../../api';
import { useNavigate } from 'react-router-dom';

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionModal, setActionModal] = useState(null); // { user, action: 'BLOCK' | 'UNBLOCK' | 'SUSPEND' }
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/users');
      setUsers(res.data.users || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleStatusChange = async (e) => {
    e.preventDefault();
    if (!actionReason.trim() && (actionModal.action === 'BLOCK' || actionModal.action === 'SUSPEND')) {
      setErrorMsg('A valid reason is required for security and auditing records.');
      return;
    }

    try {
      setActionLoading(true);
      setErrorMsg('');
      await api.post(`/api/admin/users/${actionModal.user.id}/status`, {
        action: actionModal.action,
        reason: actionReason
      });
      setActionModal(null);
      setActionReason('');
      fetchUsers();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlock = async (userId) => {
    try {
      await api.post(`/api/admin/users/${userId}/unlock`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to unlock account');
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      String(u.id).includes(q) ||
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q)) ||
      (u.accountNumber && u.accountNumber.toLowerCase().includes(q));

    const matchesKyc =
      kycFilter === 'ALL' ||
      (kycFilter === 'VERIFIED' && u.kycStatus === 'VERIFIED') ||
      (kycFilter === 'PENDING' && u.kycStatus === 'PENDING') ||
      (kycFilter === 'NOT_SUBMITTED' && u.kycStatus === 'NOT_SUBMITTED') ||
      (kycFilter === 'REJECTED' && u.kycStatus === 'REJECTED');

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && u.isActive && !u.isAccountLocked) ||
      (statusFilter === 'BLOCKED' && !u.isActive) ||
      (statusFilter === 'LOCKED' && u.isAccountLocked);

    return matchesSearch && matchesKyc && matchesStatus;
  });

  return (
    <div className="page-root">
      <div className="page-content space-y-6 text-[var(--text-primary)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#8B92FF]/20 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#356BFF]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#A855F7]">Identity Registry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] mt-1">User Management</h1>
          <p className="text-sm text-[#B8C5F2]">Audit user accounts, enforce security freezes & inspect profiles</p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111B57] hover:bg-[#111B57]/80 text-xs font-semibold text-[#B8C5F2] hover:text-white border border-[#8B92FF]/25 self-start sm:self-auto cursor-pointer transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#713BFF]' : ''}`} />
          Refresh Registry
        </button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-[#111B57]/80 backdrop-blur-md border border-[#8B92FF]/22 rounded-2xl shadow-[0_8px_32px_rgba(5,11,46,0.5)]">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-[#8B92FF]/50 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by ID, Name, Email, Phone, or Account Number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0B1550] border border-[#8B92FF]/25 rounded-xl text-xs text-[#F8FAFC] placeholder-[#8B92FF]/40 focus:outline-none focus:border-[#713BFF]"
          />
        </div>

        {/* KYC Status Filter */}
        <div>
          <select
            value={kycFilter}
            onChange={(e) => setKycFilter(e.target.value)}
            className="w-full px-3 py-2 bg-[#0B1550] border border-[#8B92FF]/25 rounded-xl text-xs text-[#F8FAFC] focus:outline-none focus:border-[#713BFF]"
          >
            <option value="ALL">KYC: All Statuses</option>
            <option value="VERIFIED">KYC: Verified</option>
            <option value="PENDING">KYC: Pending Review</option>
            <option value="REJECTED">KYC: Rejected</option>
            <option value="NOT_SUBMITTED">KYC: Not Submitted</option>
          </select>
        </div>

        {/* Account Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-[#0B1550] border border-[#8B92FF]/25 rounded-xl text-xs text-[#F8FAFC] focus:outline-none focus:border-[#713BFF]"
          >
            <option value="ALL">Account: All Statuses</option>
            <option value="ACTIVE">Account: Active</option>
            <option value="BLOCKED">Account: Blocked / Frozen</option>
            <option value="LOCKED">Account: Security Locked</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#111B57]/80 backdrop-blur-md border border-[#8B92FF]/22 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(5,11,46,0.5)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B1550] text-[#B8C5F2] uppercase text-[10px] tracking-wider border-b border-[#8B92FF]/20">
              <tr>
                <th className="py-3.5 px-4 font-semibold">User ID</th>
                <th className="py-3.5 px-4 font-semibold">Name & Email</th>
                <th className="py-3.5 px-4 font-semibold">Account No</th>
                <th className="py-3.5 px-4 font-semibold">KYC Status</th>
                <th className="py-3.5 px-4 font-semibold">Account Status</th>
                <th className="py-3.5 px-4 font-semibold">Risk Level</th>
                <th className="py-3.5 px-4 font-semibold">Registered</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#8B92FF]/10 text-[#B8C5F2]">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-[#B8C5F2]/60">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#713BFF] mb-2" />
                    Fetching user records...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-[#B8C5F2]/60">
                    No accounts matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isBlocked = !user.isActive;
                  const isLocked = user.isAccountLocked;
                  return (
                    <tr key={user.id} className="hover:bg-[#356BFF]/5 transition-colors group">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#356BFF]">
                        #{user.id}
                      </td>

                      <td className="py-3.5 px-4">
                        <div
                          onClick={() => navigate(`/admin/users/${user.id}`)}
                          className="cursor-pointer hover:underline"
                        >
                          <p className="font-bold text-[#F8FAFC] flex items-center gap-1.5">
                            {user.name || 'Unnamed User'}
                            {user.role === 'ROLE_ADMIN' && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#713BFF]/20 text-[#A855F7] font-bold border border-[#713BFF]/30">ADMIN</span>
                            )}
                          </p>
                          <p className="text-[#B8C5F2]/70 text-[11px] font-mono">{user.email}</p>
                          {user.phone && <p className="text-[#B8C5F2]/60 text-[10px]">{user.phone}</p>}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[#F8FAFC]">
                        {user.accountNumber || '—'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            user.kycStatus === 'VERIFIED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                              : user.kycStatus === 'PENDING'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                              : user.kycStatus === 'REJECTED'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                              : 'bg-[#8B92FF]/10 text-[#B8C5F2] border border-[#8B92FF]/20'
                          }`}
                        >
                          {user.kycStatus || 'NOT_SUBMITTED'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isBlocked ? 'bg-rose-400' : isLocked ? 'bg-amber-400' : 'bg-emerald-400'
                            }`}
                          />
                          <span className="font-medium text-[11px] text-[#F8FAFC]">
                            {isBlocked ? 'Blocked' : isLocked ? 'Locked Out' : 'Operational'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            user.riskStatus === 'BLOCKED' || user.riskStatus === 'HIGH'
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : user.riskStatus === 'MEDIUM' || user.riskStatus === 'LOCKED'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {user.riskStatus}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-[#B8C5F2]/70 text-[11px] font-mono">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Profile */}
                          <button
                            onClick={() => navigate(`/admin/users/${user.id}`)}
                            title="Inspect User Details"
                            className="p-1.5 rounded-lg bg-[#0B1550] hover:bg-[#111B57] text-[#356BFF] border border-[#8B92FF]/25 transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Unlock (if locked) */}
                          {isLocked && (
                            <button
                              onClick={() => handleUnlock(user.id)}
                              title="Unlock account login"
                              className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition cursor-pointer"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Block / Unblock Modal trigger */}
                          {isBlocked ? (
                            <button
                              onClick={() => {
                                setActionModal({ user, action: 'UNBLOCK' });
                                setActionReason('');
                                setErrorMsg('');
                              }}
                              title="Unblock account"
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold transition cursor-pointer"
                            >
                              Unblock
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setActionModal({ user, action: 'BLOCK' });
                                setActionReason('');
                                setErrorMsg('');
                              }}
                              title="Block account"
                              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold transition cursor-pointer"
                            >
                              Block
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Block / Unblock / Suspend */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050B2E]/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-[#0B1550] border border-[#8B92FF]/30 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-[0_16px_50px_rgba(5,11,46,0.9)]">
            <div className="flex items-center justify-between border-b border-[#8B92FF]/20 pb-3">
              <div className="flex items-center gap-2 text-[#F8FAFC] font-bold">
                <AlertCircle className="w-5 h-5 text-[#356BFF]" />
                Confirm {actionModal.action} Account
              </div>
              <button
                onClick={() => setActionModal(null)}
                className="text-[#B8C5F2] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="text-xs text-[#B8C5F2]">
                Target account: <span className="text-[#F8FAFC] font-mono font-bold">{actionModal.user.email}</span> (ID: #{actionModal.user.id})
              </p>
              <p className="text-xs text-[#B8C5F2] mt-1">
                {actionModal.action === 'BLOCK'
                  ? 'Blocking this user will immediately freeze all associated bank accounts and revoke access to Transfers and Deposits on both frontend and backend.'
                  : 'Unblocking this user will restore operational banking access.'}
              </p>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-400">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleStatusChange} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#F8FAFC] mb-1">
                  Reason for Action (Mandatory for Audit Logs)
                </label>
                <textarea
                  rows="3"
                  required={actionModal.action === 'BLOCK'}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="e.g. Suspicious transaction activity, Fraud flag by KYC officer, User requested block..."
                  className="w-full p-2.5 bg-[#050B2E] border border-[#8B92FF]/25 rounded-xl text-xs text-[#F8FAFC] placeholder-[#8B92FF]/40 focus:outline-none focus:border-[#713BFF]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 rounded-xl bg-[#111B57] hover:bg-[#111B57]/80 text-xs font-semibold text-[#B8C5F2] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer ${
                    actionModal.action === 'BLOCK'
                      ? 'bg-rose-600 text-white hover:bg-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                      : 'bg-gradient-to-r from-[#356BFF] to-[#713BFF] text-white hover:opacity-95 shadow-[0_0_15px_rgba(113,59,255,0.3)]'
                  }`}
                >
                  {actionLoading ? 'Enforcing...' : `Confirm ${actionModal.action}`}
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
