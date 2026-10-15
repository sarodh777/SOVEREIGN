import React, { useState, useEffect, useCallback } from 'react';
import {
  FileCheck2, Search, Filter, CheckCircle2, XCircle, Clock,
  Eye, RefreshCw, AlertCircle, FileText, User, Calendar, MapPin
} from 'lucide-react';
import api from '../../api';

export default function KycVerification() {
  const [kycList, setKycList] = useState([]);
  const [activeTab, setActiveTab] = useState('PENDING'); // PENDING, UNDER_REVIEW, VERIFIED, REJECTED, ALL
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Review Modal
  const [selectedKyc, setSelectedKyc] = useState(null);
  const [reviewAction, setReviewAction] = useState('APPROVE'); // APPROVE | REJECT
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchKycList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/admin/kyc/list?status=${activeTab}`);
      setKycList(res.data.kyc || []);
    } catch (err) {
      console.error('Failed to load KYC documents:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchKycList();
  }, [fetchKycList]);

  const handleApprove = async (id) => {
    try {
      setSubmitting(true);
      await api.post(`/api/admin/kyc/${id}/approve`);
      setSelectedKyc(null);
      fetchKycList();
    } catch (err) {
      alert(err.response?.data?.message || 'Approval failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      alert('A valid rejection reason is required for legal and audit compliance.');
      return;
    }
    try {
      setSubmitting(true);
      await api.post(`/api/admin/kyc/${selectedKyc.id}/reject`, {
        reason: rejectReason
      });
      setSelectedKyc(null);
      setRejectReason('');
      fetchKycList();
    } catch (err) {
      alert(err.response?.data?.message || 'Rejection failed');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredList = kycList.filter((k) => {
    const q = search.toLowerCase();
    return (
      !search ||
      (k.fullName && k.fullName.toLowerCase().includes(q)) ||
      (k.userEmail && k.userEmail.toLowerCase().includes(q)) ||
      (k.aadhaarNumber && k.aadhaarNumber.includes(q)) ||
      (k.panNumber && k.panNumber.toLowerCase().includes(q))
    );
  });

  const tabs = [
    { id: 'PENDING',      label: 'Pending Review' },
    { id: 'UNDER_REVIEW', label: 'Under Review' },
    { id: 'VERIFIED',     label: 'Verified' },
    { id: 'REJECTED',     label: 'Rejected' },
    { id: 'ALL',          label: 'All Submissions' },
  ];

  return (
    <div className="page-root">
      <div className="page-content space-y-6 text-[var(--text-primary)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#8B92FF]/20 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-[#356BFF]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#A855F7]">Compliance Officer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] mt-1">KYC Verification</h1>
          <p className="text-sm text-[#B8C5F2]">Review submitted identity documents, cross-check citizen credentials & issue verdicts</p>
        </div>
        <button
          onClick={fetchKycList}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111B57] hover:bg-[#111B57]/80 text-xs font-semibold text-[#B8C5F2] hover:text-white border border-[#8B92FF]/25 self-start sm:self-auto cursor-pointer transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#713BFF]' : ''}`} />
          Refresh Submissions
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#356BFF] to-[#713BFF] text-white shadow-[0_0_15px_rgba(113,59,255,0.3)]'
                  : 'text-[#B8C5F2] hover:text-white hover:bg-[#111B57]/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#8B92FF]/50 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Name, Email, Aadhaar, PAN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#0B1550] border border-[#8B92FF]/25 rounded-xl text-xs text-[#F8FAFC] placeholder-[#8B92FF]/40 focus:outline-none focus:border-[#713BFF]"
          />
        </div>
      </div>

      {/* KYC Submissions Table */}
      <div className="bg-[#111B57]/80 backdrop-blur-md border border-[#8B92FF]/22 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(5,11,46,0.5)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B1550] text-[#B8C5F2] uppercase text-[10px] tracking-wider border-b border-[#8B92FF]/20">
              <tr>
                <th className="py-3.5 px-4 font-semibold">User</th>
                <th className="py-3.5 px-4 font-semibold">Legal Full Name</th>
                <th className="py-3.5 px-4 font-semibold">Aadhaar Number</th>
                <th className="py-3.5 px-4 font-semibold">PAN Number</th>
                <th className="py-3.5 px-4 font-semibold">Submitted</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#8B92FF]/10 text-[#B8C5F2]">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-[#B8C5F2]/60">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#713BFF] mb-2" />
                    Fetching compliance documents...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-[#B8C5F2]/60">
                    No KYC submissions in this status.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-[#356BFF]/5 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-[#F8FAFC]">{item.userName || 'User'}</p>
                      <p className="text-[11px] text-[#B8C5F2]/70 font-mono">{item.userEmail}</p>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#F8FAFC]">
                      {item.fullName || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#356BFF]">
                      {item.aadhaarNumber ? `•••• •••• ${item.aadhaarNumber.slice(-4)}` : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#F8FAFC]">
                      {item.panNumber || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-[#B8C5F2]/70 text-[11px] font-mono">
                      {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'VERIFIED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                            : item.status === 'PENDING'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedKyc(item);
                            setReviewAction('VIEW');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#0B1550] hover:bg-[#111B57] text-[#F8FAFC] text-[11px] font-semibold border border-[#8B92FF]/25 transition cursor-pointer"
                        >
                          Inspect Details
                        </button>
                        {item.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(item.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-bold border border-emerald-500/25 transition cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedKyc(item);
                                setReviewAction('REJECT');
                                setRejectReason('');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-bold border border-rose-500/25 transition cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review / Inspect / Reject Modal */}
      {selectedKyc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050B2E]/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-[#0B1550] border border-[#8B92FF]/30 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-[0_16px_50px_rgba(5,11,46,0.9)]">
            <div className="flex items-center justify-between border-b border-[#8B92FF]/20 pb-3">
              <div className="flex items-center gap-2 font-bold text-[#F8FAFC]">
                <FileText className="w-5 h-5 text-[#356BFF]" />
                Compliance Review: Dossier #{selectedKyc.id}
              </div>
              <button onClick={() => setSelectedKyc(null)} className="text-[#B8C5F2] hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#111B57]/80 rounded-xl border border-[#8B92FF]/20">
                <p className="text-[#B8C5F2]/70">Legal Full Name</p>
                <p className="font-bold text-[#F8FAFC] mt-0.5">{selectedKyc.fullName || '—'}</p>
              </div>
              <div className="p-3 bg-[#111B57]/80 rounded-xl border border-[#8B92FF]/20">
                <p className="text-[#B8C5F2]/70">Date of Birth</p>
                <p className="font-bold text-[#F8FAFC] font-mono mt-0.5">{selectedKyc.dateOfBirth || '—'}</p>
              </div>
              <div className="p-3 bg-[#111B57]/80 rounded-xl border border-[#8B92FF]/20">
                <p className="text-[#B8C5F2]/70">Aadhaar / National ID</p>
                <p className="font-bold text-[#356BFF] font-mono mt-0.5">{selectedKyc.aadhaarNumber || '—'}</p>
              </div>
              <div className="p-3 bg-[#111B57]/80 rounded-xl border border-[#8B92FF]/20">
                <p className="text-[#B8C5F2]/70">PAN Card Number</p>
                <p className="font-bold text-[#F8FAFC] font-mono mt-0.5">{selectedKyc.panNumber || '—'}</p>
              </div>
              <div className="col-span-2 p-3 bg-[#111B57]/80 rounded-xl border border-[#8B92FF]/20">
                <p className="text-[#B8C5F2]/70">Declared Address</p>
                <p className="font-bold text-[#F8FAFC] mt-0.5">{selectedKyc.address || '—'}</p>
              </div>
            </div>

            {/* Rejection form */}
            {reviewAction === 'REJECT' ? (
              <form onSubmit={handleReject} className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-rose-400 uppercase">
                  Rejection Reason (Compulsory for Audit Logs)
                </label>
                <textarea
                  rows="3"
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Blurred document, Aadhaar number mismatch with name..."
                  className="w-full p-2.5 bg-[#050B2E] border border-rose-500/40 rounded-xl text-xs text-[#F8FAFC] placeholder-[#8B92FF]/40 focus:outline-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewAction('VIEW')}
                    className="px-3 py-1.5 rounded-xl bg-[#111B57] hover:bg-[#111B57]/80 text-xs text-[#B8C5F2] hover:text-white cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg cursor-pointer"
                  >
                    {submitting ? 'Rejecting...' : 'Confirm KYC Rejection'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex justify-end gap-2 pt-3 border-t border-[#8B92FF]/20">
                <button
                  type="button"
                  onClick={() => setSelectedKyc(null)}
                  className="px-4 py-2 rounded-xl bg-[#111B57] hover:bg-[#111B57]/80 text-xs font-semibold text-[#B8C5F2] hover:text-white cursor-pointer"
                >
                  Close
                </button>
                {selectedKyc.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => {
                        setReviewAction('REJECT');
                        setRejectReason('');
                      }}
                      className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 cursor-pointer"
                    >
                      Reject With Reason
                    </button>
                    <button
                      onClick={() => handleApprove(selectedKyc.id)}
                      disabled={submitting}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#356BFF] to-[#713BFF] text-white text-xs font-bold shadow-lg hover:opacity-95 cursor-pointer"
                    >
                      {submitting ? 'Processing...' : 'Approve Citizen KYC'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
