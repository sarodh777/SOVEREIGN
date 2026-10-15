import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User, Shield, Wallet, History, ShieldAlert, Database,
  ArrowLeft, RefreshCw, CheckCircle2, XCircle, AlertTriangle,
  Lock, Unlock, FileText, ExternalLink, Calendar, Mail, Phone, MapPin, Sparkles
} from 'lucide-react';
import api from '../../api';

export default function UserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('PERSONAL');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Status Action Modal
  const [statusModal, setStatusModal] = useState(false);
  const [modalAction, setModalAction] = useState('BLOCK');
  const [reason, setReason] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const fetchUserDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/admin/users/${id}/details`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load user details:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  const handleStatusChange = async (e) => {
    e.preventDefault();
    if (!reason.trim() && modalAction === 'BLOCK') {
      alert('Reason is required');
      return;
    }
    try {
      setModalLoading(true);
      await api.post(`/api/admin/users/${id}/status`, {
        action: modalAction,
        reason: reason
      });
      setStatusModal(false);
      setReason('');
      fetchUserDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Status update failed');
    } finally {
      setModalLoading(false);
    }
  };

  const handleUnlock = async () => {
    try {
      await api.post(`/api/admin/users/${id}/unlock`);
      fetchUserDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to unlock');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <RefreshCw className="w-8 h-8 text-[#713BFF] animate-spin" />
        <p className="text-sm text-[#B8C5F2]">Retrieving User Dossier #{id}...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-[#B8C5F2]">
        <p>User profile not found.</p>
        <button onClick={() => navigate('/admin/users')} className="mt-4 text-[#356BFF] underline">
          Back to User Registry
        </button>
      </div>
    );
  }

  const { personalInfo, accountInfo, kycInfo, transactions, securityLogs, blockchainActivity } = data;
  const isBlocked = !accountInfo?.isActive;
  const isLocked = accountInfo?.isAccountLocked;

  const tabs = [
    { id: 'PERSONAL',   label: 'Personal Info',       icon: User },
    { id: 'ACCOUNT',    label: 'Account Details',     icon: Wallet },
    { id: 'KYC',        label: 'KYC Information',     icon: FileText },
    { id: 'TX',         label: 'Transaction History', icon: History, count: transactions?.length || 0 },
    { id: 'SECURITY',   label: 'Security Activity',   icon: ShieldAlert, count: securityLogs?.length || 0 },
    { id: 'BLOCKCHAIN', label: 'Blockchain Activity', icon: Database, count: blockchainActivity?.length || 0 },
  ];

  return (
    <div className="page-root">
      <div className="page-content space-y-6 text-[var(--text-primary)]">
      {/* Back button & top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#8B92FF]/20 pb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/users')}
            className="p-2.5 rounded-xl bg-[#111B57] hover:bg-[#111B57]/80 text-[#B8C5F2] hover:text-white border border-[#8B92FF]/25 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-[#F8FAFC]">{personalInfo?.name || 'User Profile'}</h1>
              <span className="font-mono text-xs text-[#356BFF] bg-[#356BFF]/10 px-2 py-0.5 rounded-md border border-[#356BFF]/25 font-bold">
                UID: #{personalInfo?.id}
              </span>
            </div>
            <p className="text-xs text-[#B8C5F2] mt-0.5">{personalInfo?.email}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {isLocked && (
            <button
              onClick={handleUnlock}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30 transition cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5" /> Unlock Account
            </button>
          )}

          {isBlocked ? (
            <button
              onClick={() => { setModalAction('UNBLOCK'); setReason(''); setStatusModal(true); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 transition cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Unblock Account
            </button>
          ) : (
            <button
              onClick={() => { setModalAction('BLOCK'); setReason(''); setStatusModal(true); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-[0_0_15px_rgba(239,68,68,0.3)] cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" /> Block Account
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-[#8B92FF]/20 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                active
                  ? 'bg-gradient-to-r from-[#356BFF] to-[#713BFF] text-white shadow-[0_0_15px_rgba(113,59,255,0.3)]'
                  : 'text-[#B8C5F2] hover:text-white hover:bg-[#111B57]/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#050B2E] text-[#B8C5F2]/70">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="bg-[#111B57]/80 backdrop-blur-md border border-[#8B92FF]/22 rounded-2xl p-6 min-h-[400px] shadow-[0_8px_32px_rgba(5,11,46,0.5)]">
        {/* 1. PERSONAL INFORMATION */}
        {activeTab === 'PERSONAL' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#356BFF]">Personal Demographics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-[#0B1550]/70 rounded-xl border border-[#8B92FF]/15 space-y-1">
                <span className="text-[#B8C5F2]/70 flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-[#356BFF]" /> Full Legal Name</span>
                <p className="font-bold text-[#F8FAFC] text-sm">{personalInfo?.name || 'Not Provided'}</p>
              </div>
              <div className="p-4 bg-[#0B1550]/70 rounded-xl border border-[#8B92FF]/15 space-y-1">
                <span className="text-[#B8C5F2]/70 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-[#356BFF]" /> Registered Email Address</span>
                <p className="font-bold text-[#F8FAFC] text-sm font-mono">{personalInfo?.email}</p>
              </div>
              <div className="p-4 bg-[#0B1550]/70 rounded-xl border border-[#8B92FF]/15 space-y-1">
                <span className="text-[#B8C5F2]/70 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-[#356BFF]" /> Phone Number</span>
                <p className="font-bold text-[#F8FAFC] text-sm font-mono">{personalInfo?.phone || 'Not Provided'}</p>
              </div>
              <div className="p-4 bg-[#0B1550]/70 rounded-xl border border-[#8B92FF]/15 space-y-1">
                <span className="text-[#B8C5F2]/70 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#356BFF]" /> Registration Timestamp</span>
                <p className="font-bold text-[#F8FAFC] text-sm font-mono">
                  {personalInfo?.createdAt ? new Date(personalInfo.createdAt).toLocaleString() : '—'}
                </p>
              </div>
              <div className="p-4 bg-[#0B1550]/70 rounded-xl border border-[#8B92FF]/15 space-y-1">
                <span className="text-[#B8C5F2]/70">System Role</span>
                <p className="font-bold text-[#F8FAFC] text-sm">{personalInfo?.role}</p>
              </div>
              <div className="p-4 bg-[#0B1550]/70 rounded-xl border border-[#8B92FF]/15 space-y-1">
                <span className="text-[#B8C5F2]/70">Email Verification State</span>
                <p className={`font-bold text-sm ${personalInfo?.emailVerified ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {personalInfo?.emailVerified ? 'Verified' : 'Pending Verification'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. ACCOUNT INFORMATION */}
        {activeTab === 'ACCOUNT' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#356BFF]">Linked Bank Accounts & Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mb-6">
              <div className="p-4 bg-[#0B1550]/70 rounded-xl border border-[#8B92FF]/15">
                <p className="text-[#B8C5F2]/70">Account State</p>
                <p className={`font-black text-base mt-1 ${isBlocked ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {isBlocked ? 'BLOCKED' : 'OPERATIONAL'}
                </p>
              </div>
              <div className="p-4 bg-[#0B1550]/70 rounded-xl border border-[#8B92FF]/15">
                <p className="text-[#B8C5F2]/70">Failed Login Attempts</p>
                <p className="font-black text-base mt-1 text-[#F8FAFC] font-mono">
                  {accountInfo?.failedLoginAttempts || 0}
                </p>
              </div>
              <div className="p-4 bg-[#0B1550]/70 rounded-xl border border-[#8B92FF]/15">
                <p className="text-[#B8C5F2]/70">Last Login Trace</p>
                <p className="font-black text-sm mt-1 text-[#F8FAFC] font-mono">
                  {accountInfo?.lastLoginAt ? new Date(accountInfo.lastLoginAt).toLocaleString() : 'Never'}
                </p>
              </div>
            </div>

            {accountInfo?.accounts && accountInfo.accounts.length > 0 ? (
              <div className="space-y-3">
                {accountInfo.accounts.map((acc) => (
                  <div key={acc.id} className="p-4 bg-[#0B1550]/70 rounded-xl border border-[#8B92FF]/15 flex items-center justify-between">
                    <div>
                      <p className="font-mono font-bold text-[#F8FAFC] text-sm">Acc: {acc.accountNumber}</p>
                      <p className="text-[#B8C5F2]/70 text-xs mt-0.5">Type: {acc.accountType} | Currency: {acc.currency || 'INR'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-[#F8FAFC]">₹{Number(acc.balance || 0).toLocaleString()}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        acc.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                      }`}>
                        {acc.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#B8C5F2]/60">No bank accounts provisioned yet.</p>
            )}
          </div>
        )}

        {/* 3. KYC INFORMATION */}
        {activeTab === 'KYC' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#356BFF]">KYC Dossier & Submitted Documents</h3>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                kycInfo?.status === 'VERIFIED' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                kycInfo?.status === 'PENDING' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}>
                {kycInfo?.status}
              </span>
            </div>

            {kycInfo?.hasKyc ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-[#0B1550]/70 rounded-xl border border-[#8B92FF]/15 space-y-1">
                  <span className="text-[#B8C5F2]/70">Full Name (as per ID)</span>
                  <p className="font-bold text-[#F8FAFC] text-sm">{kycInfo.fullName || '—'}</p>
                </div>
                <div className="p-4 bg-[#0B1550]/70 rounded-xl border border-[#8B92FF]/15 space-y-1">
                  <span className="text-[#B8C5F2]/70">Date of Birth</span>
                  <p className="font-bold text-[#F8FAFC] text-sm font-mono">{kycInfo.dateOfBirth || '—'}</p>
                </div>
                <div className="p-4 bg-[#0B1550]/70 rounded-xl border border-[#8B92FF]/15 space-y-1">
                  <span className="text-[#B8C5F2]/70">Aadhaar / National ID</span>
                  <p className="font-bold text-[#F8FAFC] text-sm font-mono">{kycInfo.aadhaarNumber || '—'}</p>
                </div>
                <div className="p-4 bg-[#0B1550]/70 rounded-xl border border-[#8B92FF]/15 space-y-1">
                  <span className="text-[#B8C5F2]/70">PAN Number</span>
                  <p className="font-bold text-[#F8FAFC] text-sm font-mono">{kycInfo.panNumber || '—'}</p>
                </div>
                <div className="p-4 bg-[#0B1550]/70 rounded-xl border border-[#8B92FF]/15 md:col-span-2 space-y-1">
                  <span className="text-[#B8C5F2]/70">Residential Address</span>
                  <p className="font-bold text-[#F8FAFC] text-sm">{kycInfo.address || '—'}</p>
                </div>
                {kycInfo.rejectionReason && (
                  <div className="p-4 bg-rose-500/10 rounded-xl border border-rose-500/30 md:col-span-2 space-y-1">
                    <span className="text-rose-400 font-bold">Rejection Reason Note</span>
                    <p className="text-[#F8FAFC] text-xs">{kycInfo.rejectionReason}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-[#B8C5F2]/60">This user has not submitted any KYC documents.</p>
            )}
          </div>
        )}

        {/* 4. TRANSACTION HISTORY */}
        {activeTab === 'TX' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#356BFF]">Transaction History Log</h3>
            <div className="overflow-x-auto rounded-xl border border-[#8B92FF]/20">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0B1550] text-[#B8C5F2] uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Tx ID</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Blockchain Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8B92FF]/10 text-[#B8C5F2]">
                  {transactions?.length > 0 ? (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[#356BFF]/5">
                        <td className="p-3 font-mono font-bold text-[#F8FAFC]">{tx.transactionId}</td>
                        <td className="p-3 font-bold text-[#B8C5F2]">{tx.type}</td>
                        <td className="p-3 font-mono font-black text-[#F8FAFC]">₹{Number(tx.amount || 0).toLocaleString()}</td>
                        <td className="p-3 font-bold text-[10px]">{tx.status}</td>
                        <td className="p-3 text-[#B8C5F2]/70 font-mono">{tx.date ? new Date(tx.date).toLocaleString() : '—'}</td>
                        <td className="p-3 font-mono text-[10px] text-[#356BFF] truncate max-w-[150px]">
                          {tx.blockchainHash || '—'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-[#B8C5F2]/60">No transactions executed by this user.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. SECURITY ACTIVITY */}
        {activeTab === 'SECURITY' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#356BFF]">Security & Authentication Audit Trail</h3>
            <div className="space-y-2">
              {securityLogs?.length > 0 ? (
                securityLogs.map((l) => (
                  <div key={l.id} className="p-3 bg-[#0B1550]/70 rounded-xl border border-[#8B92FF]/15 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-[#F8FAFC]">{l.action}</p>
                      <p className="text-[11px] text-[#B8C5F2]/70">{l.details || l.failureReason || 'Normal execution'}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        l.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                      }`}>
                        {l.status}
                      </span>
                      <p className="text-[10px] text-[#B8C5F2]/60 font-mono mt-1">{l.timestamp ? new Date(l.timestamp).toLocaleString() : ''}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#B8C5F2]/60 p-4 text-center">No security incidents recorded for this user.</p>
              )}
            </div>
          </div>
        )}

        {/* 6. BLOCKCHAIN ACTIVITY */}
        {activeTab === 'BLOCKCHAIN' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#356BFF]">Blockchain Distributed Ledger Records</h3>
            {blockchainActivity?.length > 0 ? (
              <div className="space-y-3">
                {blockchainActivity.map((tx) => (
                  <div key={tx.id} className="p-4 bg-[#0B1550]/70 rounded-xl border border-[#8B92FF]/20 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#F8FAFC]">Tx ID: {tx.transactionId}</span>
                      <span className="font-mono font-bold text-[#F8FAFC]">₹{Number(tx.amount || 0).toLocaleString()}</span>
                    </div>
                    <p className="text-[10px] text-[#B8C5F2]/70">Immutable Hash:</p>
                    <p className="font-mono text-[11px] text-[#356BFF] bg-[#050B2E] p-2 rounded-lg border border-[#8B92FF]/20 break-all">
                      {tx.blockchainHash}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#B8C5F2]/60 p-4 text-center">No transactions confirmed on blockchain for this account.</p>
            )}
          </div>
        )}
      </div>

      {/* Action Dialog */}
      {statusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050B2E]/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-[#0B1550] border border-[#8B92FF]/30 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-[0_16px_50px_rgba(5,11,46,0.9)]">
            <h3 className="text-base font-bold text-[#F8FAFC]">Confirm {modalAction} Account</h3>
            <p className="text-xs text-[#B8C5F2]">
              {modalAction === 'BLOCK'
                ? 'This user will be immediately locked out of all banking transactions.'
                : 'This user will have operational banking access restored.'}
            </p>
            <form onSubmit={handleStatusChange} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#F8FAFC] uppercase mb-1">
                  Reason for Action (Mandatory)
                </label>
                <textarea
                  rows="3"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="State operational reason..."
                  className="w-full p-2.5 bg-[#050B2E] border border-[#8B92FF]/25 rounded-xl text-xs text-[#F8FAFC] placeholder-[#8B92FF]/40 focus:outline-none focus:border-[#713BFF]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStatusModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#111B57] hover:bg-[#111B57]/80 text-xs font-semibold text-[#B8C5F2] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#356BFF] to-[#713BFF] text-xs font-bold text-white hover:opacity-95 shadow-[0_0_15px_rgba(113,59,255,0.3)] cursor-pointer"
                >
                  {modalLoading ? 'Submitting...' : 'Confirm'}
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
